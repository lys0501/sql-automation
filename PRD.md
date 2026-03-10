# SQL Mart Builder — Product Requirements Document

> **프로젝트 한 줄 정의**: 분석가 전용 쿼리 오케스트레이터 — 복잡한 데이터 마트 생성을 자동화하여 분석 생산성을 극대화하는 CLI 도구.

---

## 1. 배경 및 목적

토스뱅크 데이터 분석 조직은 반복적인 퍼널·코호트 분석 쿼리를 매번 수작업으로 작성하고 있습니다.
이 도구는 **YAML 설정 한 번으로 검증된 SQL 마트를 자동 생성**하여 분석가의 쿼리 작성 부담을 없애고,
비개발 직군(PO/PM)도 사전 정의 템플릿으로 지표를 직접 추출할 수 있게 합니다.

---

## 2. 타겟 사용자 페르소나

| 페르소나 | 니즈 | 현재 불편함 |
|---|---|---|
| **DA (데이터 분석가)** | 퍼널·코호트 쿼리 재사용, 정합성 자동 검증 | "매번 비슷한 퍼널 분석 쿼리 짜는 게 지겨워요. 정합성 검증까지 자동으로 됐으면 좋겠어요." |
| **PO / PM** | SQL 없이 미리 정의된 템플릿으로 지표 추출 | "SQL을 몰라도 미리 정의된 템플릿으로 간단한 지표는 직접 뽑아보고 싶어요." |

---

## 3. 핵심 기능 (Core Features)

### 3-1. Template-based Query Generation
- **Jinja2** 엔진 기반 동적 SQL 생성
- 퍼널 단계(steps), 기간(date_range), 파티션 컬럼 등을 YAML로 주입
- 재사용 가능한 매크로(`macro`) 레이어 분리 (dbt 방식 차용)
- 템플릿 상속으로 공통 로직 중복 제거

### 3-2. Schema Validation
- 쿼리 실행 전 소스 테이블 컬럼·타입 사전 체크
- 필수 파티션 조건 누락 시 경고 발생
- SQLFluff 연동으로 SQL 린팅 자동화
- 데이터 정합성 룰 YAML로 선언적 관리

### 3-3. Query Optimizer
- 대용량 처리를 위한 **JOIN 순서 자동 재정렬** (작은 테이블 → 큰 테이블)
- 파티션 Pruning 조건 자동 삽입
- `EXPLAIN` 플랜 결과를 기반으로 힌트 삽입 가이드 제공
- 반복 서브쿼리를 CTE로 자동 리팩토링

### 3-4. Auto Documentation
- 마트 정의서(Markdown) 자동 추출
- 컬럼 설명, 소스 테이블 계보(Lineage), 파티션 정보 포함
- Git 커밋 시 문서 자동 갱신 훅(pre-commit hook) 지원

---

## 4. 화면 구성 (UI/UX)

### 4-1. Dashboard
- 생성된 마트 목록 및 최근 실행 현황 요약
- 마트별 row count 트렌드, 파티션 상태 시각화

### 4-2. Query Builder UI
- YAML/설정값 입력창 (좌측 패널)
- SQL 실시간 프리뷰 (우측 패널, 신택스 하이라이팅)
- "검증 실행" 버튼 → 스키마 체크 결과 인라인 표시

### 4-3. Documentation Viewer
- 자동 생성된 데이터 사전 (컬럼명 / 타입 / 설명 / 소스)
- 마트 간 의존 관계 DAG 시각화

---

## 5. 기술 스택

| 레이어 | 기술 | 선택 이유 |
|---|---|---|
| **쿼리 엔진** | Python + Jinja2 | 템플릿 렌더링 표준, dbt와 동일 방식 |
| **SQL 검증** | SQLFluff | Python 생태계 최적 SQL 린터 |
| **프론트엔드** | Next.js 14 (App Router) | SSR + React Server Components |
| **스타일** | Tailwind CSS | 빠른 UI 프로토타이핑 |
| **데이터 직렬화** | YAML (PyYAML) | 사람이 읽기 쉬운 설정 포맷 |

---

## 6. 참고 레퍼런스

- **dbt (Data Build Tool)**: 템플릿 기반 SQL 관리, 모델 의존성 그래프
- **Apache Airflow**: DAG 기반 파이프라인 오케스트레이션 패턴

---

## 7. 성공 지표 (KPI)

| 지표 | 목표 |
|---|---|
| 쿼리 작성 시간 단축 | 반복 쿼리 작성 시간 **70% 감소** |
| 정합성 오류 감소 | 마트 배포 후 hotfix 건수 **50% 감소** |
| PO 셀프서비스 비율 | DA 개입 없이 지표 추출 **월 20건 이상** |

---

## 8. 마일스톤

| Phase | 기간 | 목표 |
|---|---|---|
| Phase 1 | Week 1–2 | CLI 프로토타입 (builder.py), 퍼널 템플릿 3종 |
| Phase 2 | Week 3–4 | 스키마 검증 + SQLFluff 연동 |
| Phase 3 | Week 5–6 | Next.js Query Builder UI MVP |
| Phase 4 | Week 7–8 | 자동 문서화 + Git 훅 연동 |
