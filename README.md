# Rescue One Bridge

> 골든타임을 지켜내는 구급차–응급실 실시간 매칭 플랫폼

**[Live Demo](https://rescue-one-bridge.vercel.app/)**

---

## 문제

응급 환자 이송 시, 구급대원은 수많은 병원에 직접 전화해서 환자 수용 가능 여부를 확인합니다. 이 과정에서 **시간**이 허비되고 있습니다.

이 '응급실 뺑뺑이'는 환자의 생존을 위협하는 가장 큰 걸림돌 중 하나입니다.

## 해결

**버튼 한 번**으로 환자 정보와 GPS 위치를 주변 병원에 실시간 전파하고, 거리·병상·대기 기반 **자동 매칭**으로 불필요한 통화를 없앱니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Map | Leaflet + OpenStreetMap (GPS 위치, Haversine 거리 계산) |
| Charts | Recharts |
| Deploy | Vercel |
| CI/CD | GitHub Actions (TypeScript, ESLint, Vitest, Build) |

---

## 주요 기능

### 구급대원 (Mobile)

- **GPS 실시간 위치** — 현재 위치를 지도에 표시, 가까운 병원을 거리순 정렬
- **원터치 요청** — 환자 정보 + GPS 좌표를 병원에 즉시 전송
- **자동 매칭** — 거리(40%) + 병상(30%) + 대기(20%) + 수용상태(10%) 점수 기반 최적 병원 배정
- **역지오코딩** — GPS 좌표를 한국어 주소로 자동 변환

### 병원 Dashboard (Web)

- **통합 대시보드** — KPI 카드, 중증도 분포 차트, 시간대별 부하 그래프
- **실시간 요청 관리** — 구급대원 요청 수락/보류, 환자 상세 정보 확인
- **병상 관리** — 구역별 병상 상태(가용/사용중/청소중/정비) 실시간 관리
- **직원 관리** — 근무 스케줄, 상태 관리, 응급 호출
- **장비 현황** — 의료 장비 상태 모니터링, 배터리/정비 알림
- **환자 관리** — 환자 정보 CRUD, 상태 업데이트, 메모 저장

### 공통

- **Supabase Realtime** — 데이터 변경 시 모든 클라이언트에 즉시 반영
- **역할 기반 접근** — hospital_staff / paramedic 역할 분리
- **데모 모드** — Supabase 없이도 목 데이터로 전체 기능 체험 가능
- **다크 모드** — 시스템/밝게/어둡게 테마 지원

---

## 로컬 실행

```bash
git clone https://github.com/dongho-dev/rescue-one-bridge.git
cd rescue-one-bridge
npm install
npm run dev
```

### 데모 모드 (Supabase 없이)

```bash
VITE_DEMO_MODE=true npm run dev
```

### Supabase 연동

```bash
cp .env.example .env
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 설정
npm run dev
```

### 기타 명령어

```bash
npm run build      # 프로덕션 빌드
npm run lint       # ESLint 검사
npm run test:run   # 테스트 실행
npm run preview    # 빌드 결과 미리보기
```

---

## 시스템 구조

```
구급대원 App (Mobile)
  ↕ Supabase Realtime + REST API
Supabase (PostgreSQL + Auth + Edge Functions)
  ↕ Supabase Realtime + REST API
병원 Dashboard (Web)
```

---

## 확장 계획

- 웨어러블 연동 — 심정지 자동 감지 → 자동 긴급 호출
- AI 최적 경로 — 교통상황 + 중증도 기반 이송 경로 추천
- 빅데이터 분석 — 응급 데이터 기반 공중 보건 위기 대응
