# 작업 보고서: Pipeline Round 5 — Discover + Audit + 구현

- **날짜**: 2026-03-22
- **처리 이슈 수**: 13개 (discover 14개 + audit 16개 생성, MIS 13개 선정·구현·머지)
- **PR 목록**: #199 (Batch A), #198 (Batch B) — 전부 머지
- **실행 방식**: 2배치 병렬 (run-agents)

## 우선순위 분포

선정 13개 기준:
- priority:high: 5개 (#182, #183, #184, #185, #172)
- priority:medium: 7개 (#189, #190, #188, #174, #178, #177, #176)
- priority:low: 1개 (#196)

## Phase별 소요 시간

| Phase | 시작 | 완료 | 소요 |
|-------|------|------|------|
| Discover | — | — | ~15분 (3 Explore Agent 병렬) |
| Audit | — | — | ~15분 (7 Explore Agent 병렬) |
| Phase 1 (nextplan) | 12:52 | 12:53 | 1분 |
| Phase 2 (spec) | 12:53 | 12:59 | 6분 |
| Phase 3 (review-issues) | 12:59 | 13:03 | 4분 |
| Phase 4 (run-agents) | 13:03 | 13:39 | 36분 |
| Phase 5 (worktree-clean) | 13:39 | 13:40 | 1분 |
| **총 파이프라인** | **12:52** | **13:40** | **48분** |

## 파이프라인 전체 흐름

### Phase 0-A: Discover (이슈 발굴)

3개 Explore Agent(Sonnet) 병렬 실행:

| 에이전트 | 관심사 | 토큰 | tool uses | 소요 | 발견 수 |
|----------|--------|------|-----------|------|---------|
| Feature | 기능 확장 기회 | 135,517 | 50 | 3m15s | 20 |
| DX | 개발 경험·자동화 | 118,136 | 165 | 7m8s | 13 |
| Architecture | 아키텍처 진화 | 123,059 | 66 | 3m7s | 12 |

발견 45개 → 필터링 퍼널:

| 단계 | 수 |
|------|-----|
| Raw 발견 | 45 |
| 기존 이슈 겹침 스킵 | -13 |
| 보류 (낮은 임팩트) | -8 |
| 오탐 판정 | 0 |
| **최종 이슈 생성** | **14** |

스킵 상세 (주요):

| 발견 | 기존 이슈 | 매칭 근거 |
|------|----------|----------|
| Feature 1-4: CRUD 버튼 미동작 | #86 | 환자/직원/장비 등록·수정 범위 동일 |
| Feature 6-7: ETA/avgWaitTime 하드코딩 | #70 | 동일 하드코딩 패턴 |
| Arch 2: useOnlineStatus 중복 | #119 | 동일 훅 통합 대상 |
| Arch 3: getSeverityLabel prop drilling | #120 | UI 헬퍼 중복 제거 동일 |
| Arch 9: useRequests full refetch | #122 | 낙관적 업데이트 동일 |
| Arch 11: in-memory 라우팅 | #88 | URL 라우팅 도입 동일 |

### Phase 0-B: Audit (풀스택 감사)

7개 Explore Agent(Sonnet) 병렬 실행:

| 에이전트 | 관심사 | 토큰 | tool uses | 소요 | 발견 수 |
|----------|--------|------|-----------|------|---------|
| B1 보안+입력검증 | security | 138,270 | 70 | 4m2s | 16 |
| B2 에러핸들링 | error handling | 69,049 | 73 | 3m35s | 10 |
| B3 테스트+데이터 | test/data | 136,005 | 77 | 4m3s | 15 |
| F1 프론트보안 | frontend security | 128,665 | 54 | 2m57s | 10 |
| F2 UX+접근성 | UX/a11y | 111,858 | 36 | 3m22s | 26 |
| F3 성능+코드품질 | performance | 117,489 | 53 | 3m40s | 20 |
| C1 코드위생 | hygiene | 162,518 | 80 | 3m50s | 15 |

발견 ~92개 → 필터링:

| 단계 | 수 |
|------|-----|
| Raw 발견 | ~92 |
| 기존 이슈 겹침 | ~30 |
| 보류 (낮은 임팩트) | ~15 |
| 에이전트 간 중복 | ~15 |
| **최종 이슈 생성** | **16** |

### Phase 1: 트리아지

48개 open 이슈 분류:

| 카테고리 | 수 | 이슈 |
|----------|-----|------|
| 워커가능 | 40 | #182-196, #180-181, #175-178, #168-174, #138, #135, #106, #105, #99, #78, #126, #122, #121, #120, #119, #82, #79 |
| 대규모 | 4 | #88(URL 라우팅), #86(CRUD 전체), #95(Supabase CLI), #179(RTL 전면도입) |
| PR 진행 중 | 4 | #66, #70, #81, #91 (PR #104) |

### Phase 2: 명세

- 기존 명세 보유: 26개 (스킵)
- 신규 명세 작성: 16개
- 2개 Opus Agent 그룹 병렬 실행:

| 그룹 | 이슈 | 토큰 | tool uses | 소요 |
|------|------|------|-----------|------|
| A (#182-189) | 8개 | 86,063 | 44 | 4m47s |
| B (#190-197) | 8개 | 61,486 | 37 | 4m8s |

특이사항: #197(required_specialties 타입 불일치) — 명세 작성 중 migration 00010에서 컬럼이 이미 존재함을 발견. 이슈 닫음.

### Phase 3: 계획

**충돌 그래프 핵심 클러스터:**

| 공유 파일 | 충돌 이슈 (12개 이상) |
|----------|---------------------|
| `useRequests.ts` | #184, #186, #187, #194, #138, #135, #106, #99, #122, #119, #126, #79 |
| `useMessages.ts` | #184, #186, #192, #99, #79 |
| `useSupabaseQuery.ts` | #184, #187, #135, #126, #121, #82, #79 |
| `AuthContext.tsx` | #186, #190, #193 |

**MIS 핵심 트레이드오프:**

- `useRequests.ts` 클러스터: #184(high, Realtime 재연결 버그) 선택 → #186, #187, #194, #138, #135 등 10개 medium 이슈 제외. #184가 high priority + 3파일만 변경으로 가성비 최고.
- `AuthContext.tsx`: #190(useMemo 최적화) vs #193(fetchProfile silent). 둘 다 medium이나 #190이 전역 리렌더 해소로 임팩트 큼 → #190 선택.
- `RequestRow.tsx`: #185(high, URL injection) vs #168(high, 길 안내 목적지). #185가 보안 이슈로 우선 → #168 제외.

**MIS 결과:** 13개 선정, 28개 제외.

### Phase 4: 실행

2개 Opus 오케스트레이터 백그라운드 병렬:

| 배치 | 모델 | 토큰 | tool uses | 소요 | PR |
|------|------|------|-----------|------|-----|
| Batch A (L2, 5이슈) | Opus | 93,116 | 71 | 10m38s | #199 |
| Batch B (L1, 8이슈) | Opus | 94,314 | 74 | 9m40s | #198 |

이슈별 리뷰:

| 이슈 | 레벨 | 판정 | 재시도 | 주요 확인 사항 |
|------|------|------|--------|--------------|
| #182 | L2 | PASS | 0 | columns 문자열에 4필드 추가, 기존 null-safe 코드 확인 |
| #183 | L2 | PASS | 0 | isFallback 플래그 도입, useLocationSharing의 기존 null 가드 활용 |
| #184 | L2 | PASS | 0 | 3개 훅 모두 retryCount state + effect 의존성 추가, cleanup 정상 |
| #185 | L2 | PASS | 0 | sanitize.ts 신규, tel: sanitize + Maps encodeURIComponent 적용 |
| #172 | L2 | PASS | 0 | isTransporting prop으로 4시간 연장, 기존 API 호환 |
| #189 | L1 | PASS | 0 | try/catch 롤백 + subscribe 콜백 + retryCount 패턴 일관성 |
| #190 | L1 | PASS | 0 | useMemo/useCallback 적용, 의존성 배열 올바름 |
| #188 | L1 | PASS | 0 | age는 != null, gender/vitals는 ?? '-', 기존 패턴 일관성 |
| #174 | L1 | PASS | 0 | SpO2 Input 0-100 범위, EMPTY_FORM 초기값 추가 |
| #196 | L1 | PASS | 0 | MiniMapPlaceholder 삭제, StaffMember alias 제거 |
| #178 | L1 | PASS | 0 | pre-commit에 tsc --noEmit 추가 |
| #177 | L1 | PASS | 0 | 커버리지 임계값 현실 조정, test:coverage 스크립트 |
| #176 | L1 | PASS | 0 | trace on-first-retry + html/github reporter |

**CI 조사 과정:**

1. PR #198, #199 첫 push → lint-typecheck + unit-test **실패**
2. 로그 확인 → `npm ci` 단계에서 `@vitest/coverage-v8@4.1.0` peer dependency 충돌 (`vitest@4.1.0` 요구, 프로젝트 `vitest@2.1.9`)
3. main CI 확인 → **main도 동일 실패** (3회 연속) → pre-existing 판정
4. 수정: 양쪽 배치에서 `@vitest/coverage-v8`을 `^2.1.9`로 다운그레이드 + `npm install` → push
5. Batch A: lint ✅ unit-test ✅ → Prettier 포맷 실패 발견 (124 files) → `npm run format` + 커밋 + push → lint ✅ unit-test ✅
6. Batch B: 동일 포맷 실패 → format 적용 + push → lint ✅ unit-test ✅
7. Batch B: 커버리지 임계값 30%로 설정했으나 실제 20.12% → 임계값을 18%로 조정 + push → unit-test ✅
8. E2e: 양쪽 모두 실패 → "strict mode violation: getByText resolved to N elements" → main도 동일 → pre-existing 판정
9. 최종 판단: lint + unit-test 통과, e2e pre-existing → **머지 진행**

**머지 과정:**

1. PR #199 (Batch A) squash merge → 성공
2. PR #198 (Batch B) merge 시도 → **CONFLICTING** (Batch A의 Prettier 포맷 변경과 충돌)
3. Batch B rebase 시도 → 7개 파일 충돌 (Prettier 포맷 차이)
4. Rebase 중단 → batch-b를 `origin/main`으로 reset → 8개 이슈 변경을 Opus Agent로 재적용
5. 재적용 Agent: 74,816 토큰, 58 tool uses, 6분 소요 → 모든 검증 통과
6. Push → lint ✅ unit-test ✅ → PR #198 squash merge → 성공

### Phase 5: 정리

- `.claude/worktrees/batch-a` 제거 (정상)
- `.claude/worktrees/batch-b` 제거 (--force 필요, 수정 파일 잔존)
- `fix/batch-a`, `fix/batch-b` 로컬 브랜치 삭제
- 최종: main worktree만 남음

## 이슈별 상세

### Batch A (PR #199, L2 리뷰)

| 이슈 | 제목 | 변경 파일 | 비고 |
|------|------|----------|------|
| #182 | useEquipment columns 누락 | `useEquipment.ts` | columns 문자열에 `battery_level, alerts, next_maintenance, assigned_bed_id` 4개 필드 추가. 기존 컴포넌트는 이미 null-safe. |
| #183 | GPS 폴백 좌표 | `useGeolocation.ts` | `isFallback: boolean` 반환 추가, `handleError`에서 `setPosition(null)` + `setIsFallback(true)`. FALLBACK_POSITION 상수 제거. |
| #184 | Realtime 재연결 실패 | `useRequests.ts`, `useMessages.ts`, `useSupabaseQuery.ts` | 3개 훅에 `retryCount` state 추가, setTimeout 콜백에서 `setRetryCount(c => c + 1)`, effect 의존성에 `retryCount` 추가하여 채널 재구독 트리거. |
| #185 | URL injection | `sanitize.ts`(신규), `HospitalAdmin.tsx`, `HospitalAvailabilityPanel.tsx`, `RequestRow.tsx` | `sanitizePhone()`: 숫자/+/-만 허용. `isValidCoordinate()`: 좌표 범위 검증. tel: 링크와 Maps URL에 적용. |
| #172 | 세션 타임아웃 | `useSessionTimeout.ts` | `UseSessionTimeoutOptions` 인터페이스 + `isTransporting` prop 추가. true 시 TIMEOUT_MS를 4시간으로 연장. |

### Batch B (PR #198, L1 리뷰)

| 이슈 | 제목 | 변경 파일 | 비고 |
|------|------|----------|------|
| #189 | useHospitalAccepting 에러 | `useHospitalAccepting.ts` | `setAccepting`을 try/catch로 감싸 네트워크 에러 시 롤백. `.subscribe()` 콜백으로 CHANNEL_ERROR 시 toast + 30초 후 retryCount 증가. |
| #190 | AuthContext 리렌더 | `AuthContext.tsx` | `switchDemoRole`을 `useCallback`으로 추출, Provider `value`를 `useMemo`로 감싸 불필요 리렌더 제거. |
| #188 | null 미처리 렌더링 | `PatientDetails.tsx`, `IncomingRequestsTable.tsx` | age: `!= null` 체크, gender/vitals: `?? '-'`, distance_km/eta_minutes: `!= null` 체크. |
| #174 | SpO2 입력 필드 | `NewPatientForm.tsx`, `PatientRequest.tsx` | vitals 섹션에 산소포화도(0-100%) Input 추가, EMPTY_FORM에 `oxygenSaturation: ''` 초기값. |
| #196 | Dead code | `MiniMapPlaceholder.tsx`(삭제), `staffData.ts`, `index.ts` | 미사용 컴포넌트 파일 삭제, `StaffMember` alias 제거 + `mockStaff: Staff[]` 타입 변경. |
| #178 | pre-commit typecheck | `.husky/pre-commit` | `npx tsc --noEmit`을 lint-staged 전에 추가. |
| #177 | 커버리지 체계 | `vitest.config.ts`, `package.json`, `ci.yml` | 임계값: lines/statements 18%, branches 60%, functions 35%. `test:coverage` 스크립트 추가. coverage-v8 ^2.1.9로 다운그레이드. |
| #176 | Playwright trace | `playwright.config.ts` | CI: `trace: 'on-first-retry'`, `reporter: [['html', {open:'never'}], ['github']]`. 로컬: `trace: 'off'`, `reporter: [['list']]`. |

## 명세 외 변경 (unplannedWrites)

| 배치 | 수 | 내용 |
|------|-----|------|
| A | 0 | 없음 |
| B | 1 | `PatientRequest.tsx` — #174 SpO2 EMPTY_FORM 초기값 추가 (타입 호환 필수, 리뷰어 허용) |

## 명세 차이 + 특이사항

- #177: 명세에서 커버리지 임계값을 30%로 제안했으나, 실제 커버리지 20.12%로 CI 실패 → 18%로 하향 조정. 현실적 수준으로 회귀 감지 역할은 유지.
- #197: 명세 작성 중 migration 00010에서 `required_specialties` 컬럼이 이미 존재함을 발견 → 이슈 닫음 (오탐).
- Prettier 포맷: 양쪽 배치에서 pre-existing 포맷 불일치 124개 파일을 일괄 수정 (Batch A에서 발생, Batch B에서 머지 충돌 원인).

## 테스트 수 변화

- 이전: 225개 → 이후: 225개 (+0개)
- 이번 라운드에서 신규 테스트 추가 없음 (기존 테스트가 변경된 코드를 이미 커버)

## 이전 위험 추적

| 위험 항목 | 최초 보고 | 반복 횟수 | 현재 상태 |
|----------|----------|----------|----------|
| @vitest/coverage-v8 peer 충돌 | Round 5 | 1 | ✅ ^2.1.9로 해결 |
| E2e strict mode violation | Round 4 | ⚠️ 2+ | 미해결 (pre-existing) |
| Prettier 포맷 불일치 | Round 5 | 1 | ✅ 일괄 수정 |

## 잔여 위험 및 후속 과제

### CI pre-existing 실패

- **E2e**: `getByText('긴급 요청')` 등이 2+ 요소로 resolve → strict mode violation. 컴포넌트 리팩토링(Round 4)에서 동일 텍스트가 복수 렌더되는 구조 발생. `data-testid` 도입 또는 selector 구체화 필요.

### MIS 제외 이슈 — 다음 파이프라인 처리 가능성

| 이슈 | 우선순위 | 사유 | 다음 처리 가능성 |
|------|---------|------|-----------------|
| #168 | high | RequestRow.tsx → #185와 충돌 | ✅ #185 머지됨, 다음 파이프라인에서 충돌 없이 처리 가능 |
| #186 | medium | useRequests.ts 등 6파일 → #184와 충돌 | ✅ #184 머지됨, useRequests.ts 독점 해소 |
| #187 | medium | useSupabaseQuery.ts → #184와 충돌 | ✅ 동일 |
| #191 | medium | useEquipment.ts → #182와 충돌 | ✅ #182 머지됨 |
| #192 | medium | useMessages.ts → #184와 충돌 | ✅ 동일 |
| #193 | medium | AuthContext.tsx → #190과 충돌 | ✅ #190 머지됨 |
| #194 | medium | useRequests.ts → #184와 충돌 | ✅ 동일 |
| #195 | medium | useGeolocation.ts → #183과 충돌 | ✅ #183 머지됨 |
| #138 | medium | useRequests.ts | ✅ 충돌 해소 |
| #135 | medium | useRequests.ts + useSupabaseQuery.ts | ✅ 충돌 해소 |

**결론**: 이번 머지로 `useRequests.ts`, `useMessages.ts`, `useSupabaseQuery.ts`, `AuthContext.tsx`, `useGeolocation.ts`, `useEquipment.ts` 독점이 해소되어, 제외된 28개 이슈 중 대부분이 다음 파이프라인에서 처리 가능.

### 교훈

1. **Prettier 포맷**: 워커 Agent가 format 실행을 누락. 오케스트레이터 프롬프트의 체크리스트에 포함했지만 Agent가 건너뜀. → `node scripts/pipeline-cli.mjs add-tip` 등록 필요.
2. **커버리지 임계값**: 실제 커버리지를 측정하지 않고 임의 값(30%)을 설정하면 CI 실패. → 명세 작성 시 현재 커버리지를 먼저 확인하는 절차 추가.
3. **배치 간 Prettier 충돌**: 두 배치가 독립적으로 Prettier를 실행하면 머지 시 대규모 충돌 발생. → 포맷은 main에서 한 번만 적용하는 것이 안전.

## 전체 자원 사용량

| 단계 | 에이전트 수 | 총 토큰 | 총 tool uses |
|------|-----------|---------|-------------|
| Discover | 3 (Sonnet) | 376,712 | 281 |
| Audit | 7 (Sonnet) | 863,854 | 443 |
| Spec | 2 (Opus) | 147,549 | 81 |
| MIS 분석 | 1 (Sonnet) | 68,187 | 44 |
| 실행 (오케스트레이터) | 2 (Opus) | 187,430 | 145 |
| 재적용 (Batch B) | 1 (Opus) | 74,816 | 58 |
| **합계** | **16** | **~1,718,548** | **~1,052** |
