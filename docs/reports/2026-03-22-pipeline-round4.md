# 작업 보고서: Pipeline Round 4 — 파일 분리 후 첫 실행

- **날짜**: 2026-03-22
- **처리 이슈 수**: 6개 (Round 3 대비 +50%)
- **PR 목록**: #162, #163, #164, #165, #166, #167 (전부 머지)
- **실행 방식**: 1배치 6워커 병렬 (basic-agents)

## 우선순위 분포

- priority:high: 0개
- priority:medium: 3개 (#71, #76, #90)
- priority:low: 3개 (#113, #116, #145)

## Phase별 소요 시간

| Phase | 시작 (UTC) | 완료 (UTC) | 소요 |
|-------|-----------|-----------|------|
| 1. nextplan | 09:38 | 09:39 | 1분 6초 |
| 2. spec | — | — | 스킵 |
| 3. review-issues | 09:39 | 09:46 | 7분 2초 |
| 4. run-agents | 09:46 | 09:55 | 8분 52초 |
| 5. worktree-clean | 09:55 | 09:55 | 31초 |
| 6. report | 09:55 | — | — |
| **전체** | **09:38** | **~10:00** | **~22분** |

## 파이프라인 전체 흐름

### Phase 0: 파일 분리 (사전 작업)

Round 3 직후 MIS 병목 해소를 위해 5개 대형 파일을 분리:

| 파일 | 분리 전 | 분리 후 | 서브 컴포넌트 |
|------|--------|--------|-------------|
| App.tsx | 582줄 | 18줄 | 7개 |
| HospitalDashboard.tsx | 552줄 | 252줄 | 5개 |
| ParamedicDashboard.tsx | 559줄 | 152줄 | 5개 |
| PatientRequest.tsx | 597줄 | 258줄 | 4개 |
| StaffManagement.tsx | 500줄 | 148줄 | 3개 |

### Phase 1: 트리아지

- **전체 open**: 26개 (Round 3에서 4개 닫힘)
- 워커 실행 가능: 19개, PR 진행 중: 4개, 대규모: 2개, 외부 의존: 1개

### Phase 3: 계획

#### MIS 개선 효과 (파일 분리 전후)

| 지표 | Round 3 (분리 전) | Round 4 (분리 후) | 변화 |
|------|-----------------|-----------------|------|
| 충돌 간선 | 83개 | ~45개 | -46% |
| MIS 크기 | 4개 | 6개 | **+50%** |
| 워커가능 이슈 | 23개 | 19개 | -4 (Round 3 처리분) |

**핵심 병목 변화**: `useRequests.ts`(10개 공유)가 여전히 최대 허브이나, `HospitalDashboard.tsx` 충돌이 12→3으로 대폭 감소.

#### MIS 선정 근거

- `useRequests.ts` 클러스터(10개 이슈 공유) → 1개만 선택 가능 → #71 선택 (medium, bug fix)
- UI 컴포넌트 그래프: 파일 분리로 #76, #90이 독립 → 동시 선정 가능 (이전엔 HospitalDashboard.tsx 충돌로 불가)
- #113, #116, #145: 완전 독립 (충돌 0개)

### Phase 4: 실행

#### 에이전트 메트릭

| 에이전트 | 이슈 | 모델 | 토큰 | Tool Uses | 소요 |
|---------|------|------|------|-----------|------|
| Worker #76 | 다이얼로그 추가 | Sonnet | 57,641 | 37 | 4분 34초 |
| Worker #90 | 채팅 추가 | Sonnet | 36,621 | 24 | 3분 3초 |
| Worker #71 | withRetry 호환 | Sonnet | 33,613 | 30 | 3분 45초 |
| Worker #113 | Prettier | Sonnet | 23,531 | 22 | 2분 33초 |
| Worker #116 | ESLint | Sonnet | 37,422 | 23 | 3분 24초 |
| Worker #145 | fallback deps | Sonnet | 27,747 | 15 | 2분 25초 |
| Reviewer | 6PR 일괄 | Opus | 46,604 | 27 | 1분 52초 |

#### 이슈별 리뷰 결과

| 이슈 | 리뷰 | 판정 | 주요 확인 사항 |
|------|------|------|--------------|
| #76 | L1 | PASS | 6개 위험 동작 모두 AlertDialog 래핑 완료, 기존 패턴(StaffTable) 동일 |
| #90 | L2 | PASS | RequestDetailDialog에 RequestChat + Separator 추가, 기존 사이드바 채팅 무변경 |
| #71 | L1 | PASS | 기존 시그니처 호환 유지 (typeof 분기), shouldRetry + supabaseShouldRetry 헬퍼, 4개 테스트 |
| #113 | L1 | PASS | devDeps 정확, .husky LF 검증, ci.yml format:check 추가, prettier --write 미실행 |
| #116 | L1 | PASS | parserOptions.project + ignores 설정, no-floating-promises warn 레벨 (보수적 적용) |
| #145 | L1 | PASS | fallbackRef 패턴, columns deps 유지, lazy initializer |

**FAIL/재시도**: 0건 (Round 3 대비 개선 — 명확한 명세 + 파일 분리로 워커 정확도 향상)

#### CI 상태

Pre-existing `@vitest/coverage-v8` peer dep 충돌 동일 지속. `--admin` 플래그로 머지.

## 이슈별 상세

| 이슈 | 제목 | 변경 파일 | 비고 |
|------|------|----------|------|
| #71 | withRetry Supabase 호환 | retry.ts, useRequests.ts, retry.test.ts | `RetryOptions<T>` 인터페이스 + `shouldRetry` 콜백 추가. `supabaseShouldRetry`로 네트워크 오류만 재시도. 기존 positional 시그니처 완전 호환. +34 테스트 라인 |
| #76 | 확인 다이얼로그 추가 | IncomingRequestsTable, RequestRow, HospitalAdmin, EquipmentStatus, BedManagement | 6개 위험 동작(거절/취소/삭제/수용전환/긴급알림/병상변경)에 AlertDialog 래핑. `confirm()` 제거. +178줄 |
| #90 | 다이얼로그 내 채팅 | RequestDetailDialog.tsx | Separator + `<RequestChat requestId={request.id} compact />` 추가. 4줄 변경 |
| #113 | Prettier + husky | package.json, .prettierrc, .husky/pre-commit, ci.yml | prettier@3.8.1 + husky@9.1.7 + lint-staged@16.4.0. CI format:check 추가. 초기 포매팅 커밋은 별도 |
| #116 | ESLint 강화 | eslint.config.js, AppContent.tsx | no-console warn + no-floating-promises warn. parserOptions.project 활성화. config 파일 ignores 추가 |
| #145 | fallback deps 안정화 | useSupabaseQuery.ts | `fallback`을 `useRef`로 캡처, useCallback deps에서 제거. 인라인 배열 전달 시 무한 루프 방지 |

## 명세 외 변경 (unplannedWrites)

없음.

## 테스트 수 변화

- **이전**: 221개 → **이후**: 225개 (+4개)
- 신규 테스트: `src/utils/__tests__/retry.test.ts`
  - `shouldRetry가 true이면 재시도` (+1)
  - `shouldRetry가 false이면 즉시 반환` (+1)
  - `shouldRetry 재시도 소진 시 throw` (+1)
  - `shouldRetry 미지정 시 기본 동작` (+1)

## 잔여 위험 및 후속 과제

### CI Pre-existing
- `@vitest/coverage-v8` peer dep 충돌 — 4회 연속 보고
- Prettier 초기 포매팅 커밋 필요 (`prettier --write src` → 별도 PR)

### MIS 제외 이슈 — 다음 파이프라인

| 이슈 | 이번 머지 영향 | 다음 가능 여부 |
|------|-------------|-------------|
| #138 (뮤테이션) | #71 머지로 retry.ts 충돌 해소 | ✅ useRequests.ts만 남음 |
| #122 (낙관적 업데이트) | 충돌 변화 없음 | ✅ useRequests.ts만 |
| #99 (Notification Context) | #116 머지로 AppContent.tsx 충돌 해소 | ⚠️ useRequests.ts + App.tsx 잔존 |
| #105 (오프라인 큐 UI) | 충돌 변화 없음 | ⚠️ useRequests.ts + ParamedicDashboard |
| #78 (접근성) | #76 머지로 RequestRow.tsx 충돌 해소 | ⚠️ IncomingRequestsTable 잔존 |
| #120 (헬퍼 중복) | #76 머지로 일부 해소 | ⚠️ 여전히 6파일 |
| #135 (null 단언) | #145 머지로 useSupabaseQuery 충돌 해소 | ⚠️ useRequests.ts + 다수 hooks |

**핵심**: `useRequests.ts`가 여전히 10개 이슈의 허브. 이 파일의 추가 분리(mutations/fetch/realtime 분리)가 다음 MIS 개선의 열쇠.

### 교훈

1. **파일 분리의 MIS 효과 검증**: Round 3 MIS 4개 → Round 4 MIS 6개 (+50%). HospitalDashboard 분리가 특히 효과적 (충돌 12→3).
2. **FAIL 0건**: 파일 분리로 워커의 작업 범위가 명확해져 리뷰 FAIL 없이 전원 1차 통과.
3. **분리 후 명세 갱신 필요**: 이전 명세의 Write 파일 경로가 분리 전 기준이라 Phase 3에서 Opus 에이전트로 재매핑 수행. 향후 명세 갱신 자동화 고려.

## 전체 자원 사용량

| 단계 | 에이전트 수 | 총 토큰 | 총 Tool Uses |
|------|-----------|--------|-------------|
| Phase 3: Write 매핑 | 1 (Opus) | 86,222 | 74 |
| Phase 4: 워커 | 6 (Sonnet) | 216,575 | 151 |
| Phase 4: 리뷰어 | 1 (Opus) | 46,604 | 27 |
| **합계** | **8** | **349,401** | **252** |
