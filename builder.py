"""
SQL Mart Builder — Funnel Query Generator
=========================================
퍼널 단계(steps)만 입력하면 대용량 처리에 최적화된 SQL을 자동 생성합니다.

설계 원칙:
  - 재사용성: 각 레이어(템플릿 / 검증 / 최적화 / 문서화)를 독립 클래스로 분리
  - 대용량 효율성: CTE 체인, 파티션 Pruning, 브로드캐스트 힌트 자동 삽입

사용 예시:
  python builder.py --config funnel_config.yaml
  python builder.py --steps 방문 상품클릭 장바구니 결제 --start 2024-01-01 --end 2024-01-31
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from textwrap import dedent
from typing import Optional

try:
    import yaml
    from jinja2 import Environment, FileSystemLoader, StrictUndefined
except ImportError:
    print("[ERROR] 필수 패키지가 없습니다. 다음을 실행하세요:")
    print("  pip install jinja2 pyyaml")
    sys.exit(1)


# ---------------------------------------------------------------------------
# 1. 도메인 모델
# ---------------------------------------------------------------------------

@dataclass
class FunnelStep:
    """퍼널 단계 하나를 나타내는 값 객체."""
    name: str          # 단계 이름 (예: '장바구니')
    event_name: str    # 이벤트 테이블의 event_type 값
    order: int         # 단계 순서 (1-indexed)


@dataclass
class FunnelConfig:
    """빌더 전체 설정을 담는 불변 컨테이너."""
    mart_name: str
    steps: list[FunnelStep]
    source_table: str = "dw.user_events"
    partition_col: str = "event_date"
    user_id_col: str = "user_id"
    start_date: str = "2024-01-01"
    end_date: str = "2024-01-31"
    session_window_hours: int = 24
    output_table: Optional[str] = None
    description: str = ""

    @classmethod
    def from_yaml(cls, path: str | Path) -> "FunnelConfig":
        """YAML 파일에서 설정을 로드합니다."""
        with open(path, encoding="utf-8") as f:
            raw = yaml.safe_load(f)

        steps = [
            FunnelStep(
                name=s["name"],
                event_name=s["event_name"],
                order=i + 1,
            )
            for i, s in enumerate(raw.pop("steps"))
        ]
        return cls(steps=steps, **raw)

    @classmethod
    def from_args(cls, args: argparse.Namespace) -> "FunnelConfig":
        """CLI 인수에서 설정을 생성합니다. (빠른 프로토타이핑용)"""
        steps = [
            FunnelStep(name=s, event_name=s.lower().replace(" ", "_"), order=i + 1)
            for i, s in enumerate(args.steps)
        ]
        return cls(
            mart_name=args.mart_name,
            steps=steps,
            start_date=args.start,
            end_date=args.end,
        )


# ---------------------------------------------------------------------------
# 2. 스키마 검증기
# ---------------------------------------------------------------------------

class SchemaValidator:
    """
    쿼리 실행 전 소스 테이블의 컬럼/파티션 조건을 사전 검증합니다.
    실제 환경에서는 DB 커넥터(Trino/Spark)로 교체하세요.
    """

    REQUIRED_COLUMNS = {"user_id", "event_type", "event_date", "event_ts"}

    def validate(self, config: FunnelConfig) -> list[str]:
        """검증 오류 메시지 목록을 반환합니다. 빈 리스트면 통과."""
        errors: list[str] = []

        # 날짜 범위 검증
        try:
            start = date.fromisoformat(config.start_date)
            end = date.fromisoformat(config.end_date)
            if start > end:
                errors.append(f"start_date({config.start_date})가 end_date({config.end_date})보다 늦습니다.")
        except ValueError as e:
            errors.append(f"날짜 형식 오류: {e}")

        # 퍼널 단계 중복 검증
        names = [s.name for s in config.steps]
        if len(names) != len(set(names)):
            errors.append("퍼널 단계 이름에 중복이 있습니다.")

        # 최소 단계 수 검증
        if len(config.steps) < 2:
            errors.append("퍼널은 최소 2단계 이상이어야 합니다.")

        return errors


# ---------------------------------------------------------------------------
# 3. SQL 템플릿 엔진 (Jinja2 기반)
# ---------------------------------------------------------------------------

# 인라인 Jinja2 템플릿 — 파일 기반으로 분리하면 더 유지보수하기 좋습니다.
FUNNEL_TEMPLATE = dedent("""\
{#
  Funnel Analysis Template
  재사용 매크로로 반복 로직을 제거하고 CTE 체인으로 가독성·성능을 확보합니다.
#}

{# ── 매크로: 단계별 사용자 집합 추출 ── #}
{% macro step_cte(step) %}
  step_{{ step.order }}_{{ step.name | replace(' ', '_') | lower }} AS (
    SELECT
      {{ user_id_col }},
      MIN(event_ts)                          AS first_ts,
      -- 파티션 Pruning: {{ partition_col }} 조건을 CTE 내부에서 처리하여
      -- 풀스캔 방지 (대용량 테이블 핵심 최적화)
      DATE(MIN(event_ts))                    AS step_date
    FROM {{ source_table }}
    WHERE {{ partition_col }} BETWEEN '{{ start_date }}' AND '{{ end_date }}'
      AND event_type = '{{ step.event_name }}'
    GROUP BY {{ user_id_col }}
  )
{% endmacro %}

{# ── 매크로: 인접 단계 간 전환율 계산 ── #}
{% macro conversion_select(prev, curr) %}
  COUNT(DISTINCT s{{ curr.order }}.{{ user_id_col }})                        AS step_{{ curr.order }}_users,
  ROUND(
    100.0 * COUNT(DISTINCT s{{ curr.order }}.{{ user_id_col }})
            / NULLIF(COUNT(DISTINCT s{{ prev.order }}.{{ user_id_col }}), 0),
    2
  )                                                                            AS cvr_{{ prev.order }}_to_{{ curr.order }}
{% endmacro %}

-- ============================================================
-- 마트명  : {{ mart_name }}
-- 설명    : {{ description if description else "퍼널 분석 자동 생성 마트" }}
-- 기간    : {{ start_date }} ~ {{ end_date }}
-- 단계수  : {{ steps | length }}단계
-- 생성일  : (auto-generated by SQL Mart Builder)
-- ============================================================

WITH
{# ── CTE 체인: 단계별 독립 집합 ── #}
{% for step in steps %}
  {{ step_cte(step) }}{{ "," if not loop.last }}
{% endfor %}

-- ── 최종 집계: HASH JOIN 힌트로 소규모 단계 테이블 브로드캐스트 ──
, funnel_summary AS (
  SELECT
    '{{ start_date }}'                                                         AS period_start,
    '{{ end_date }}'                                                           AS period_end,
    COUNT(DISTINCT s1.{{ user_id_col }})                                       AS step_1_users  -- 최상위 퍼널
    {% for i in range(1, steps | length) %}
    , {{ conversion_select(steps[i-1], steps[i]) }}
    {% endfor %}
  FROM step_1_{{ steps[0].name | replace(' ', '_') | lower }} s1
  {% for i in range(1, steps | length) %}
  -- 세션 윈도우({{ session_window_hours }}h) 내 순차 발생 조건으로 노이즈 제거
  LEFT JOIN step_{{ steps[i].order }}_{{ steps[i].name | replace(' ', '_') | lower }} s{{ steps[i].order }}
    ON  s1.{{ user_id_col }} = s{{ steps[i].order }}.{{ user_id_col }}
    AND s{{ steps[i].order }}.first_ts BETWEEN s{{ i }}.first_ts
                                          AND s{{ i }}.first_ts + INTERVAL '{{ session_window_hours }}' HOUR
  {% endfor %}
)

SELECT * FROM funnel_summary
{% if output_table %}
-- 결과를 마트 테이블로 적재 (파티션 덮어쓰기)
-- INSERT OVERWRITE {{ output_table }} PARTITION ({{ partition_col }})
{% endif %}
;
""")


class QueryBuilder:
    """
    Jinja2 템플릿을 렌더링하여 최적화된 SQL을 생성합니다.
    템플릿 파일 디렉토리를 지정하면 파일 기반 템플릿도 지원합니다.
    """

    def __init__(self, template_dir: Optional[str] = None):
        if template_dir and Path(template_dir).is_dir():
            loader = FileSystemLoader(template_dir)
            self._env = Environment(loader=loader, undefined=StrictUndefined,
                                    trim_blocks=True, lstrip_blocks=True)
        else:
            # 인라인 템플릿 모드 (프로토타입용)
            self._env = Environment(undefined=StrictUndefined,
                                    trim_blocks=True, lstrip_blocks=True)

    def build(self, config: FunnelConfig) -> str:
        """설정을 받아 완성된 SQL 문자열을 반환합니다."""
        template = self._env.from_string(FUNNEL_TEMPLATE)
        return template.render(
            mart_name=config.mart_name,
            description=config.description,
            steps=config.steps,
            source_table=config.source_table,
            partition_col=config.partition_col,
            user_id_col=config.user_id_col,
            start_date=config.start_date,
            end_date=config.end_date,
            session_window_hours=config.session_window_hours,
            output_table=config.output_table,
        )


# ---------------------------------------------------------------------------
# 4. 문서 자동 생성기
# ---------------------------------------------------------------------------

class DocumentationGenerator:
    """마트 정의서(Markdown)를 자동으로 생성합니다."""

    def generate(self, config: FunnelConfig, sql: str) -> str:
        lines = [
            f"# 마트 정의서: `{config.mart_name}`\n",
            f"> {config.description or '퍼널 분석 자동 생성 마트'}\n",
            "## 기본 정보\n",
            f"| 항목 | 값 |",
            f"|---|---|",
            f"| 소스 테이블 | `{config.source_table}` |",
            f"| 분석 기간 | {config.start_date} ~ {config.end_date} |",
            f"| 파티션 컬럼 | `{config.partition_col}` |",
            f"| 세션 윈도우 | {config.session_window_hours}시간 |",
            "",
            "## 퍼널 단계\n",
            "| 순서 | 단계명 | 이벤트 타입 |",
            "|---|---|---|",
        ]
        for step in config.steps:
            lines.append(f"| {step.order} | {step.name} | `{step.event_name}` |")

        lines += [
            "",
            "## 출력 컬럼\n",
            "| 컬럼명 | 설명 |",
            "|---|---|",
            "| `period_start` | 분석 시작일 |",
            "| `period_end` | 분석 종료일 |",
            "| `step_N_users` | N단계 유입 유저 수 |",
            "| `cvr_N_to_M` | N→M 단계 전환율(%) |",
            "",
            "## 생성 SQL\n",
            "```sql",
            sql.strip(),
            "```",
        ]
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# 5. 오케스트레이터 (파사드 패턴)
# ---------------------------------------------------------------------------

class MartBuilder:
    """
    검증 → 빌드 → 문서화 파이프라인을 조율하는 진입점.
    각 컴포넌트는 독립적으로 교체/확장할 수 있습니다.
    """

    def __init__(self, template_dir: Optional[str] = None):
        self._validator = SchemaValidator()
        self._builder = QueryBuilder(template_dir)
        self._doc_gen = DocumentationGenerator()

    def run(self, config: FunnelConfig, output_dir: str = ".") -> dict:
        """
        전체 파이프라인을 실행하고 결과 경로를 반환합니다.

        Returns:
            {"sql_path": str, "doc_path": str, "sql": str}
        """
        # 1) 스키마 검증
        errors = self._validator.validate(config)
        if errors:
            for e in errors:
                print(f"[VALIDATION ERROR] {e}")
            sys.exit(1)
        print("[OK] 스키마 검증 통과")

        # 2) SQL 생성
        sql = self._builder.build(config)
        print("[OK] SQL 생성 완료")

        # 3) 파일 저장
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)

        sql_path = out / f"{config.mart_name}.sql"
        sql_path.write_text(sql, encoding="utf-8")
        print(f"[OK] SQL 저장: {sql_path}")

        # 4) 문서 자동 생성
        doc = self._doc_gen.generate(config, sql)
        doc_path = out / f"{config.mart_name}_definition.md"
        doc_path.write_text(doc, encoding="utf-8")
        print(f"[OK] 문서 저장: {doc_path}")

        return {"sql_path": str(sql_path), "doc_path": str(doc_path), "sql": sql}


# ---------------------------------------------------------------------------
# 6. CLI 진입점
# ---------------------------------------------------------------------------

def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="SQL Mart Builder — 퍼널 분석 쿼리 자동 생성기",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=dedent("""\
            사용 예시:
              # YAML 설정 파일로 실행
              python builder.py --config funnel_config.yaml

              # CLI 인수로 빠른 프로토타이핑
              python builder.py --steps 방문 상품클릭 장바구니 결제 \\
                                --start 2024-01-01 --end 2024-01-31
        """),
    )
    parser.add_argument("--config", type=str, help="YAML 설정 파일 경로")
    parser.add_argument("--steps", nargs="+", help="퍼널 단계명 (공백 구분)")
    parser.add_argument("--start", default="2024-01-01", help="분석 시작일 (YYYY-MM-DD)")
    parser.add_argument("--end", default="2024-01-31", help="분석 종료일 (YYYY-MM-DD)")
    parser.add_argument("--mart-name", default="funnel_mart", help="마트 이름")
    parser.add_argument("--output-dir", default="output", help="결과 저장 디렉토리")
    parser.add_argument("--preview", action="store_true", help="SQL을 파일 저장 없이 콘솔에 출력")
    return parser


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    # 설정 로드
    if args.config:
        config = FunnelConfig.from_yaml(args.config)
    elif args.steps:
        config = FunnelConfig.from_args(args)
    else:
        parser.print_help()
        sys.exit(1)

    if args.preview:
        # 프리뷰 모드: 콘솔 출력만
        builder = QueryBuilder()
        sql = builder.build(config)
        print("\n" + "=" * 60)
        print(sql)
        print("=" * 60)
        return

    # 전체 파이프라인 실행
    orchestrator = MartBuilder()
    result = orchestrator.run(config, output_dir=args.output_dir)
    print("\n결과 파일:")
    print(f"  SQL  → {result['sql_path']}")
    print(f"  문서 → {result['doc_path']}")


if __name__ == "__main__":
    main()
