# 작업 보고서: Pipeline Round 3 — Context 통합 + DX 개선

- **날짜**: 2026-03-22
- **처리 이슈 수**: 4개
- **PR 목록**: #153, #154, #155, #156 (전부 머지)
- **실행 방식**: 1배치 4워커 병렬 (basic-agents)

## 우선순위 분포

- priority:high: 1개 (#93)
- priority:medium: 0개
- priority:low: 3개 (#114, #117, #123)

## Phase별 소요 시간

| Phase | 시작 (UTC) | 완료 (UTC) | 소요 |
|-------|-----------|-----------|------|
| 1. nextplan | 09:03 | 09:05 | 2분 34초 |
| 2. spec | 09:06 | 09:06 | 스킵 (전체 명세 존재) |
| 3. review-issues | 09:06 | 09:10 | 4분 22초 |
| 4. run-agents | 09:10 | 09:24 | 13분 41초 |
| 5. worktree-clean | 09:24 | 09:24 | 27초 |
| 6. report | 09:24 | — | — |
| **전체** | **09:03** | **~09:30** | **~27분** |

## 파이프라인 전체 흐름

### Phase 1: 트리아지

- **전체 open**: 30개
- **중복 발견**: 0개

| 카테고리 | 수 | 이슈 번호 |
|---------|---|----------|
| 워커 실행 가능 | 23 | #93, #138, #135, #106, #105, #99, #90, #78, #76, #71, #145, #126, #123, #122, #121, #120, #119, #117, #116, #114, #113, #82, #79 |
| PR 진행 중 | 4 | #66, #70, #81, #91 (→ PR #104) |
| 대규모/아키텍처 | 2 | #88 (URL 라우팅 전면 도입), #86 (4개 엔티티 CRUD 전체) |
| 외부 의존 | 1 | #95 (Supabase CLI 설정 필요) |

- **허브 판정**: #93이 16개 이슈와 충돌하는 초대형 허브. `useRequests.ts`, `HospitalDashboard.tsx` 등 핵심 파일을 수정하기 때문.
- **라벨 추가**: #79에 `priority:low` 라벨 부여 (기존에 없었음)
- **명세 현황**: 23/23개 전부 명세 보유 → Phase 2 스킵

### Phase 2: 명세

- 전체 스킵. 23개 워커가능 이슈 모두 이전 파이프라인에서 명세 작성 완료.

### Phase 3: 계획

#### 충돌 그래프 핵심 클러스터

| 공유 파일 | 충돌 이슈 수 | 주요 이슈 |
|----------|------------|----------|
| `src/hooks/useRequests.ts` | 16개 | #93, #71, #99, #105, #119, #122, #126, #135, #138 등 |
| `src/components/hospital/HospitalDashboard.tsx` | 12개 | #93, #76, #78, #82, #90, #106, #120 등 |
| `src/hooks/useSupabaseQuery.ts` | 7개 | #123, #79, #82, #121, #126, #145 등 |
| `src/App.tsx` | 4개 | #93, #99, #116, #119 |

총 충돌 간선: 83개.

#### MIS 분석

초기 Greedy 알고리즘 결과 7개였으나, 파일 파싱 누락으로 5개 숨은 충돌 발견:
- #113 ↔ #114: `.github/workflows/ci.yml`
- #113 ↔ #117: `package.json`
- #116 ↔ #93: `src/App.tsx`, `src/hooks/useRequests.ts`
- #121 ↔ #93: `src/components/hospital/HospitalDashboard.tsx`
- #121 ↔ #123: `src/hooks/useSupabaseQuery.ts`

수동 보정 후 MIS 최적화:

| 옵션 | 포함 이슈 | 크기 | 비고 |
|------|----------|------|------|
| {#93, #113, #123} | #113 선택 시 #117 제외, #114 제외 | 3 | |
| **{#93, #114, #117, #123}** | #117 선택 시 #114 추가 가능 | **4** | **최적** |

→ **#117 선택이 #113 선택보다 1개 더 많은 MIS 확보** (4 vs 3). #113(Prettier)은 #117(zod) 및 #114(CI)와 모두 충돌하여 제외.

#### 제외 이슈 (19개)

| 이슈 | 우선순위 | 제외 사유 |
|------|---------|----------|
| #71, #99, #105, #119, #122, #126, #135, #138 | medium/low | #93과 `useRequests.ts` 충돌 |
| #76, #78, #82, #90, #106, #120 | medium/low | #93과 `HospitalDashboard.tsx` 충돌 |
| #116 | low | #93과 `App.tsx`/`useRequests.ts` 충돌 |
| #121 | low | #93 + #123 이중 충돌 |
| #113 | low | #117 (`package.json`) + #114 (`ci.yml`) 이중 충돌 |
| #145 | low | #123과 `useSupabaseQuery.ts` 충돌 |
| #79 | low | #93·#117·#123 삼중 충돌 |

### Phase 4: 실행

#### 오케스트레이터별 메트릭

| 에이전트 | 이슈 | 모델 | 토큰 | Tool Uses | 소요 |
|---------|------|------|------|-----------|------|
| Worker #93 | useRequests Context | Opus | 86,438 | 38 | 4분 54초 |
| Worker #114 | CI 최적화 | Sonnet | 13,673 | 9 | 57초 |
| Worker #117 | zod 검증 | Sonnet | 40,910 | 16 | 3분 59초 |
| Worker #123 | select 컬럼 | Sonnet | 31,538 | 28 | 3분 21초 |
| L2 Reviewer | PR #154 | Opus | 41,070 | 11 | 1분 8초 |
| L1 Reviewer | PR #153,155,156 | Opus | 46,200 | 27 | 2분 13초 |
| Fix #155 | 누락 컬럼 추가 | Sonnet | 31,851 | 10 | 1분 8초 |
| Fix #156 | 비밀번호+SVG | Sonnet | 28,353 | 13 | 2분 |

#### 이슈별 리뷰 결과

| 이슈 | 리뷰 레벨 | 1차 판정 | 재시도 | 최종 | 주요 확인 사항 |
|------|----------|---------|--------|------|--------------|
| #93 | L2 | PASS | — | PASS | AuthContext 패턴 일치, Provider 위치 올바름 (AuthProvider 내부), 테스트 이름 약간 미스리딩 (non-blocking) |
| #114 | L1 | PASS | — | PASS | YAML 구조 유효, cache key 적절, 각 job 독립 setup-node/npm ci |
| #123 | L1 | FAIL | 1회 | PASS | useStaff에 `shift_start,shift_end,certifications,emergency_contact` 누락, useEquipment에 `manufacturer,model,location,usage_hours,notes` 누락 → 수정 후 PASS |
| #117 | L1 | FAIL | 1회 | PASS | 비밀번호 정책 `min(8)+2종` → `min(6)` 약화 회귀, Google SVG path 좌표 `10.22 1` 탈락 → 수정 후 PASS |

#### CI 조사 과정

1. 4개 PR 전부 `check` job 실패 확인
2. PR #154 CI 로그 조사: `npm ci` 단계에서 `@vitest/coverage-v8@4.1.0`이 `vitest@4.1.0` peer dependency 요구, 프로젝트는 `vitest@2.1.9` 사용
3. main 브랜치 대조: 동일한 peer dependency 충돌이 main에도 존재 (이전 파이프라인 보고서에서도 동일 이슈 기록)
4. **Pre-existing 판정**: `@vitest/coverage-v8` 버전이 `vitest`와 불일치하는 기존 문제. 이번 변경과 무관
5. Vercel 배포 실패도 동일 원인 (`npm ci` 실패)
6. **머지 결정**: 모든 워커에서 로컬 테스트 218-221개 통과, lint 0 errors, build 성공 확인. `--admin` 플래그로 머지 진행

### Phase 5: 정리

- 4개 worktree 제거: batch-f-93, batch-f-114, batch-f-117, batch-f-123
- 4개 로컬 브랜치 삭제
- `.claude/worktrees/` 디렉토리 정리

## 이슈별 상세

| 이슈 | 제목 | 변경 파일 | 비고 |
|------|------|----------|------|
| #93 | useRequests Context 통합 | RequestsContext.tsx(new), App.tsx, HospitalDashboard.tsx, ParamedicDashboard.tsx, PatientRequest.tsx, useRequests.test.ts | `RequestsProvider` 생성하여 `useRequests()` 단일 인스턴스 래핑. 3곳의 소비자를 `useRequestsContext()`로 교체. 기존 `useRequests` hook export 유지하여 역호환성 보장. +85/-7 |
| #114 | CI 파이프라인 최적화 | .github/workflows/ci.yml | 단일 `check` job을 `lint-typecheck` + `unit-test` (병렬) + `e2e` (선행 완료 후)로 분리. Playwright 브라우저 캐시 도입, cache-hit 시 `--with-deps` 생략. +48/-10 |
| #117 | zod schema 검증 도입 | package.json, package-lock.json, LoginPage.tsx, SignupPage.tsx | `useState` 기반 수동 검증을 `zod` + `react-hook-form` + `zodResolver`로 전면 교체. `Controller`로 RadioGroup/Select 래핑, `superRefine`으로 hospitalId 조건부 필수. +237/-140 |
| #123 | select 컬럼 지정 | useSupabaseQuery.ts, useStaff.ts, useEquipment.ts | `UseSupabaseQueryOptions`에 `columns?: string` 옵션 추가 (기본값 `'*'`). useStaff/useEquipment에 필요 컬럼만 명시. `useCallback` deps에 `columns` 추가. +8/-3 |

## 명세 외 변경 (unplannedWrites)

없음. 4개 이슈 모두 Write 허용 목록 내에서만 변경.

## 명세 차이 + 특이사항

| 이슈 | 차이 | 리뷰어 판정 |
|------|------|------------|
| #117 | 비밀번호 정책이 `min(8)+2종` → `min(6)`으로 약화됨 | FAIL → 수정 후 PASS. zod 마이그레이션 시 기존 정책 복원 누락 |
| #117 | Google SVG path 좌표 `10.22 1` 탈락 | FAIL → 수정 후 PASS. 긴 SVG path 문자열 복사 시 손상 |
| #123 | useStaff/useEquipment에서 UI가 사용하는 컬럼 누락 | FAIL → 수정 후 PASS. 명세에 컬럼 예시만 있고 실제 UI 사용 컬럼 미조사 |

## 테스트 수 변화

- **이전**: 218개 → **이후**: 221개 (+3개)
- 신규 테스트: `src/hooks/__tests__/useRequests.test.ts`
  - `useRequestsContext throws when used without Provider` (+1)
  - `useRequestsContext returns same API shape when wrapped in Provider` (+1)
  - `two consumers share the same context value` (+1)

## 이전 위험 추적

| 위험 항목 | 최초 보고 | 반복 횟수 | 현재 상태 |
|----------|---------|----------|----------|
| `@vitest/coverage-v8` peer dep 충돌 | Round 2 | 2회 | ⚠️ 미해결 — `vitest@2.1.9` ↔ `@vitest/coverage-v8@4.1.0` 불일치 |
| `@sentry/vite-plugin` 미설치 빌드 경고 | Round 2 | 2회 | 미해결 — 빌드는 성공하나 경고 출력 |
| PR #104 (Batch E) 미머지 | Round 2 | 2회 | open 상태 유지 |

## 잔여 위험 및 후속 과제

### CI Pre-existing 실패
- `@vitest/coverage-v8@4.1.0`은 `vitest@4.1.0`을 peer로 요구하지만 프로젝트는 `vitest@2.1.9` 사용
- **해결 방안**: `@vitest/coverage-v8`를 `^2.1.9`로 다운그레이드하거나 `vitest`를 `^4.1.0`으로 업그레이드
- 3회 연속 보고됨 — 다음 파이프라인에서 우선 처리 권장

### MIS 제외 이슈 — 다음 파이프라인 처리 가능성

#93 머지로 `useRequests.ts` + `HospitalDashboard.tsx` 충돌이 해소됨. 다음 파이프라인 영향:

| 이슈 | #93 머지 후 상태 | 다음 파이프라인 워커 가능 여부 |
|------|----------------|---------------------------|
| #71 (withRetry 호환) | useRequests.ts 충돌 해소 | ✅ 가능 (retry.ts만 남음) |
| #99 (useNotification Context) | App.tsx 충돌 해소, useRequests.ts 충돌 해소 | ✅ 가능 |
| #119 (useOnlineStatus 통합) | useRequests.ts, App.tsx 충돌 해소 | ✅ 가능 |
| #138 (뮤테이션 안전성) | useRequests.ts 충돌 해소 | ✅ 가능 (retry.ts만 남음) |
| #135 (null 단언) | useRequests.ts 충돌 해소 | ⚠️ useSupabaseQuery.ts 충돌 잔존 (#123과) |
| #122 (낙관적 업데이트) | useRequests.ts 충돌 해소 | ✅ 가능 |
| #76, #78, #90, #106, #120 | HospitalDashboard.tsx 충돌 해소 | ⚠️ 상호 충돌 가능 — 재계산 필요 |
| #145 (fallback deps) | useSupabaseQuery.ts 충돌 해소 (#123 머지) | ✅ 가능 |
| #113 (Prettier) | package.json + ci.yml 충돌 해소 (#114, #117 머지) | ✅ 가능 |

**예상**: 다음 파이프라인에서 19개 제외 이슈 중 10개 이상 워커 가능.

### 교훈

1. **컬럼 선택 시 UI 소비처 전수 조사 필요**: #123에서 명세의 예시 컬럼만 사용하고 실제 UI 컴포넌트가 접근하는 필드를 조사하지 않아 FAIL 발생. 명세 작성 시 모든 소비 컴포넌트의 필드 접근을 나열해야 함.
2. **기존 보안 정책 보존 확인**: #117에서 zod 마이그레이션 시 기존 비밀번호 정책(8자+2종)이 약화됨. 보안 관련 로직 리팩터링 시 기존 정책을 테스트로 고정한 뒤 작업해야 함.
3. **SVG/긴 문자열 복사 주의**: 긴 path 데이터 복사 시 좌표 탈락 발생. 가능하면 SVG를 별도 파일로 분리하거나, diff로 원본 대조 필수.
4. **MIS 파일 파싱 정확도**: 정규식 기반 파싱이 `package.json`, `.github/workflows/ci.yml` 등 특수 경로를 누락. 수동 검증 단계가 5개 숨은 충돌을 발견하여 잘못된 배치 구성 방지.

## 전체 자원 사용량

| 단계 | 에이전트 수 | 총 토큰 | 총 Tool Uses |
|------|-----------|--------|-------------|
| Phase 4: 워커 | 4 | 172,559 | 91 |
| Phase 4: 리뷰어 | 2 | 87,270 | 38 |
| Phase 4: 수정 | 2 | 60,204 | 23 |
| **합계** | **8** | **320,033** | **152** |
