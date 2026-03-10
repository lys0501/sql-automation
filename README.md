# 🛠️ SQL Mart Builder (sql-automation)

> **분석가 전용 쿼리 오케스트레이터** — 복잡한 데이터 마트 생성을 자동화하여 분석 생산성을 극대화하는 멀티플랫폼 도구

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📌 프로젝트 소개 (Introduction)

**SQL Mart Builder**는 반복적인 퍼널(Funnel) 및 코호트(Cohort) 분석 쿼리 작성을 줄이고, 정합성을 자동으로 검증해주는 데이터 파이프라인 자동화 도구입니다.

데이터 분석가(DA)는 지루한 파티션 분할 쿼리 대신 비즈니스 로직에 집중할 수 있으며, 기획자(PO/PM)는 SQL을 몰라도 템플릿과 UI를 통해 직접 지표를 추출할 수 있습니다.

### ✨ 핵심 기능 (Key Features)

*   **동적 쿼리 생성 엔진 (Template-based Generation)**
    *   Python + Jinja2 템플릿 기반으로 YAML 설정만으로 SQL을 자동 렌더링.
    *   dbt 방식의 재사용 가능한 Macro 블록 지원.
*   **강력한 스키마 검증 (Schema Validation)**
    *   SQLFluff를 연동한 쿼리 린팅 및 파티션/타입 필수조건 사전 검증.
*   **쿼리 최적화 도우미 (Query Optimizer)**
    *   대용량 데이터 환경에 맞춘 JOIN 순서 힌트 및 반복 스니펫의 CTE(Common Table Expression) 리팩토링.
*   **자동 문서화 (Auto Documentation)**
    *   컬럼 데이터 사전, 마트 리니지(Lineage) Markdown 추출 및 Git Hook 지원.
*   **웹 대시보드 UI (Next.js)**
    *   웹 UI 환경에서 실시간 SQL 프리뷰 및 생성된 데이터 마트의 시각적 요약(Row 흐름, 퍼널 전환율).

---

## 🏗️ 아키텍처 및 기술 스택 (Tech Stack)

*   **Core Engine**: Python 3.x, Jinja2, PyYAML, SQLFluff
*   **Web Dashboard**: Next.js 14 (App Router), React, Tailwind CSS
*   **Visualization**: Recharts (차트 및 대시보드 지표 구성)

---

## 🚀 설치 방법 (Installation)

이 프로젝트는 Python(CLI 엔진) 및 Node.js(웹 대시보드) 환경이 모두 필요합니다.

### 1. 저장소 클론
```bash
git clone https://github.com/lys0501/sql-automation.git
cd sql-automation
```

### 2. 컴패니언 웹 대시보드 설정 (Next.js)

웹 대시보드를 사용하려면 패키지를 설치해야 합니다.
```bash
# 의존성 모듈 설치
npm install

# 로컬 개발 서버 실행 (기본 포트: http://localhost:3000)
npm run dev
```

### 3. CLI 파이썬 모듈 설정 (예정)

현재 `builder.py` 스크립트 실행에 필요한 라이브러리를 가상환경에 구성하세요.
```bash
# 예시
pip install jinja2 pyyaml sqlfluff
```

---

## 💻 사용법 (Usage)

### 1. 웹 대시보드 활용하기

1. `npm run dev` 실행 후 `http://localhost:3000`에 접속합니다.
2. 좌측 메뉴를 통해 **대시보드(Overview)**, **퍼널 & 리텐션 뷰(Simulation)**, **가설 검증(Behavior)** 탭을 탐색합니다.
3. 지표 카드 및 차트 인터페이스를 활용하여 SQL로 생성될 결과를 미리 시뮬레이션 해볼 수 있습니다.

### 2. CLI 쿼리 빌더 실행하기

`builder.py`를 호출하여 YAML 템플릿으로부터 SQL을 렌더링 할 수 있습니다. (상세 스펙은 지속 업데이트 지원)

```bash
# 기본 사용법 예시
python builder.py --config config/funnel_sample.yaml --output out/funnel.sql
```

---

## 🎯 도입 시 기대 효과 (KPI)

*   **효율성**: 반복 쿼리 작성 시간 **70% 감소**
*   **안정성**: 쿼리 린팅 및 룰 검증으로 배포 후 핫픽스 건수 **50% 감소**
*   **자율성**: PO 직군의 DA 개입 없는 능동 지표 추출 (월단위 비용/시간 절약)

---

## 📜 라이선스 (License)

이 프로젝트는 **MIT License**를 따릅니다. 자세한 내용은 라이선스 문서를 참고하세요.
