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
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Map | Leaflet + OpenStreetMap (GPS 위치, Haversine 거리 계산) |
| Charts | Recharts |
| Monitoring | Sentry |
| Deploy | Vercel |
| CI/CD | GitHub Actions (TypeScript, ESLint, Vitest, Playwright, Build) |

---

## 주요 기능

### 구급대원 (Mobile)

- **원탭 긴급 요청** — 환자 정보 없이도 1탭으로 즉시 요청 전송
- **GPS 실시간 추적** — `watchPosition`으로 이송 중 위치 연속 추적 + 병원에 실시간 공유
- **자동 매칭** — 거리(40%) + 병상(30%) + 대기(20%) + 수용상태(10%) 점수 기반 최적 병원 배정
- **대시보드** — 내 요청 목록, 상태 추적(대기→배정→이송중→완료), 근처 병원 현황
- **이송 시작/완료** — 상태 전환 버튼 + GPS 추적 + 화면 꺼짐 방지 자동 활성화
- **길 안내** — 매칭된 병원까지 Google Maps 네비게이션
- **전화 바로 걸기** — `tel:` 링크로 병원 직접 통화
- **오프라인 큐잉** — 네트워크 끊겨도 요청 로컬 저장 → 복구 시 자동 전송

### 병원 Dashboard (Web)

- **통합 대시보드** — KPI 카드, 중증도 분포 차트, 시간대별 부하 그래프 (실데이터)
- **실시간 요청 관리** — 수락/거절, 거절 시 다음 병원 자동 재매칭
- **수용 상태 토글** — DB 연동, 매칭 알고리즘에 즉시 반영
- **병상/직원/장비/환자 관리** — 실시간 CRUD
- **병원 관리 (Admin)** — 병원 등록/수정/삭제

### 공통

- **푸시 알림** — 새 요청/매칭 완료 시 브라우저 알림 + 진동
- **Supabase Realtime** — 데이터 변경 시 모든 클라이언트에 즉시 반영
- **병원↔구급대원 메시지** — 요청 단위 양방향 실시간 메시지
- **역할 기반 접근** — hospital_staff / paramedic 역할 분리
- **네트워크 재시도** — Exponential backoff 자동 재시도
- **세션 타임아웃** — 30분 미활동 시 자동 로그아웃 (환자 정보 보호)
- **감사 로그** — 환자 데이터 열람/수정 기록
- **에러 모니터링** — Sentry 연동 (환자 데이터 자동 스크러빙)
- **데모 모드** — Supabase 없이 전체 E2E 플로우 체험 가능 (역할 전환 포함)
- **다크 모드** — 시스템/밝게/어둡게 테마 지원
- **PWA** — 홈 화면 설치, Service Worker 캐싱

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
# VITE_SENTRY_DSN 설정 (선택)
npm run dev
```

### 기타 명령어

```bash
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm run test:run     # 유닛 테스트 실행
npx playwright test  # E2E 테스트 실행
npm run preview      # 빌드 결과 미리보기
```

---

## 시스템 구조

```
구급대원 App (Mobile/PWA)
  ↕ Supabase Realtime + REST API
Supabase (PostgreSQL + Auth + Realtime)
  ↕ Supabase Realtime + REST API
병원 Dashboard (Web)
```

---

## E2E 플로우

```
구급대원: 원탭 요청 →  자동 매칭 → 병원 배정 → 이송 시작 → 이송 완료
              ↓           ↓          ↓           ↓
병원:     요청 수신 → 수락/거절 → 구급차 위치 추적 → 환자 인수
```
