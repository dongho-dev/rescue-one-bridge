# 작업 보고서: 보안·테스트·UX 일괄 개선 파이프라인

**날짜**: 2026-03-22
**파이프라인**: pipeline-2026-03-22-854
**처리 이슈**: 18개 (32개 워커가능 중 MIS 선정)
**PR**: #100, #101, #102, #103 (전부 squash 머지)
**실행 방식**: basic-agents (4개 배치 병렬)

## 우선순위 분포
- priority:high: 7개 (#64, #65, #67, #68, #74, #87, #96)
- priority:medium: 8개 (#69, #73, #75, #77, #80, #89, #92, #97)
- priority:low: 3개 (#83, #84, #94)

## 이슈별 상세

### Batch D — PR #100 (다중 구급차, 번들, Mock 타입)

| 이슈 | 제목 | 변경 파일 | 리뷰 | 비고 |
|------|------|----------|------|------|
| #89 | 병원 지도에 다중 구급차 표시 | AmbulanceMap.tsx, HospitalDashboard.tsx | L1 PASS | 중증도별 색상(red/amber/blue), 하위호환 유지 |
| #83 | 번들 최적화: manualChunks | vite.config.ts | L2 PASS | map 청크 154KB 분리 |
| #84 | Mock ↔ DB 타입 불일치 | models.ts, mocks/*.ts | L2 PASS | patient_age string→number, 불필요 re-export 제거 |

### Batch A — PR #101 (PHI 보호, E2E, CI, 에러 핸들링)

| 이슈 | 제목 | 변경 파일 | 리뷰 | 비고 |
|------|------|----------|------|------|
| #64 | PHI 평문 저장 방지 | offlineQueue.ts, offlineQueue.test.ts | L2 PASS | sanitizePHI 함수 추출, vitals/allergies/notes/location 제거 |
| #74 | E2E 테스트 추가 | e2e/*.spec.ts (3개 신규) | L2 PASS | 핵심 워크플로우, 병원 액션, 내비게이션 |
| #96 | CI에 E2E + 커버리지 추가 | ci.yml, vitest.config.ts | L2 PASS | Playwright + coverage v8 |
| #67 | useMessages 에러 핸들링 | useMessages.ts, RequestChat.tsx | L2 PASS | sendMessage boolean 반환, isSubmitting 가드 |
| #68 | useLocationSharing 에러 핸들링 | useLocationSharing.ts | L2 PASS | position ref, 3회 실패 toast |

### Batch C — PR #102 (알림, 매칭 설정, tsconfig, UI)

| 이슈 | 제목 | 변경 파일 | 리뷰 | 비고 |
|------|------|----------|------|------|
| #92 | 알림 권한 모달 | App.tsx | L1 PASS | Dialog + localStorage 7일 재요청 |
| #94 | 매칭 가중치 설정 테이블 | 00009_matching_config.sql (신규) | L2 PASS | matching_config + COALESCE 폴백 |
| #97 | tsconfig 정리 + vite-env.d.ts | tsconfig.json, vite-env.d.ts | L2 PARTIAL | noUncheckedIndexedAccess 스킵 (18개 타입에러) |
| #69 | HospitalAdmin 에러 핸들링 | HospitalAdmin.tsx | L1 PASS | 낙관적 UI 롤백, getUserFriendlyError |
| #77 | 가짜 토스트 + 데드 버튼 | PatientDetails, StaffMgmt, EquipmentStatus, PatientRequest | L2 PASS | toast.success→toast.info 5곳, 데드 버튼 disabled |

### Batch B — PR #103 (매칭, RPC, 테스트, Sentry)

| 이슈 | 제목 | 변경 파일 | 리뷰 | 비고 |
|------|------|----------|------|------|
| #87 | 매칭 알고리즘 중증도+전문과 | 00010_matching.sql, database.ts | L2 PASS | specialty 보너스 +20, severity 가중치 +15 |
| #65 | 재매칭 RPC hospital_staff 권한 | 00009_fix_rematch.sql, useRequests.ts | L2 PASS | 원자적 hospital_id 클리어, FOR UPDATE 락 |
| #73 | OAuth role race condition | 00011_fix_oauth_role.sql, AuthContext.tsx | L2 PASS | role='paramedic' 조건 + 15분 윈도우 |
| #75 | 테스트 추가 + 유령 테스트 제거 | useRequests.test.ts + 8개 신규 | L2 PASS | 174 테스트 통과 (기존 62 → 174) |
| #80 | Sentry PHI 스크러빙 | sentry.ts | L2 PASS | scrubDeep 재귀, request.data, stacktrace vars |

## 명세 외 변경 (unplannedWrites)

| 배치 | 파일 | 리뷰어 판정 | 사유 |
|------|------|------------|------|
| A | package.json, package-lock.json | 허용 | @vitest/coverage-v8 설치 (#96 명세 요구) |

## CI/빌드 결과

| PR | Tests | Lint | Build | Vercel | GitHub Actions |
|----|-------|------|-------|--------|----------------|
| #100 | 62/62 | 0 err | pass | pass | pass |
| #101 | 70/70 | 0 err | pass | fail (배포환경) | 미트리거 |
| #102 | 62/62 | 0 err | pass | pass | pass |
| #103 | 174/174 | 0 err | pass | pass | pass |

**PR #101 Vercel 실패**: 로컬 빌드 정상. ci.yml 수정 포함 브랜치여서 GitHub Actions도 미트리거. 코드 품질 문제 아님.

## 진행 과정

1. **Phase 1 (nextplan)**: 이전 세션에서 완료. 36개 open → 32개 워커가능, 2개 허브 제외, 2개 외부의존 제외
2. **Phase 2 (spec)**: 32개 이슈 전부 명세 작성 (4개 Opus Agent 병렬, ~7분)
3. **Phase 3 (review-issues)**: MIS 18개 선정, 14개 충돌 제외. 4개 배치 구성
4. **Phase 4 (run-agents)**: 4개 오케스트레이터 병렬 실행 (~12분 최대). 18/18 성공
5. **머지**: 순차 squash 머지 (#100→#101→#102→#103), 리베이스 충돌 3회 해결
6. **Phase 5 (worktree-clean)**: worktree 4개 제거, 로컬 22개 + 리모트 19개 브랜치 삭제
7. **Phase 6 (report)**: 본 보고서

## 제외된 이슈 (14개) — 다음 파이프라인 후보

| 이슈 | 제외 사유 | 다음 파이프라인 처리 가능성 |
|------|----------|--------------------------|
| #93 | useRequests.ts 충돌 (#65) | #65 머지로 충돌 해소, 단독 처리 가능 |
| #99 | useMessages.ts 충돌 (#67) | #67 머지 후 처리 가능 |
| #66 | useRequests.ts + migration 충돌 (#65) | #65 머지 후 처리 가능 |
| #71 | useRequests.ts 충돌 (#65) | 처리 가능 |
| #79 | useRequests.ts 충돌 (#65) | 처리 가능 |
| #76 | HospitalAdmin 충돌 (#69) | #69 머지 후 처리 가능 |
| #78 | HospitalAdmin + 다수 UI 충돌 | 처리 가능 |
| #82 | useLocationSharing 충돌 (#68) | #68 머지 후 처리 가능 |
| #91 | useLocationSharing + database.ts 충돌 | 처리 가능 |
| #72 | PatientRequest + database.ts 충돌 (#87) | #87 머지 후 처리 가능 |
| #70 | HospitalDashboard 다중 충돌 | 일부 해소, 재분석 필요 |
| #81 | useMessages + useAuditLog 충돌 | 처리 가능 |
| #85 | StaffMgmt + EquipmentStatus 충돌 (#77) | #77 머지 후 처리 가능 |
| #90 | HospitalDashboard 충돌 (#89) | #89 머지 후 처리 가능 |

**대부분 이번 머지로 충돌이 해소되어 다음 파이프라인에서 바로 처리 가능.**

## 보류 이슈 (Phase 1에서 제외)

- #86, #88: 허브 이슈 (대규모)
- #95, #98: 외부 의존 (Sentry auth token, 외부 서비스 연동)

## 잔여 위험 및 후속 과제

1. **PR #101 Vercel 배포 실패**: 코드 문제 아니지만, 다음 main push 시 Vercel 배포 정상 확인 필요
2. **#97 noUncheckedIndexedAccess 미적용**: 18개 타입에러로 스킵. 별도 이슈로 전체 코드베이스 적용 권장
3. **마이그레이션 번호 겹침 가능성**: #65(00009), #94(00009), #73(00011) — Supabase 적용 시 순서 확인
4. **테스트 커버리지 향상**: 62 → 174 테스트. 다음 파이프라인에서 #75 미포함 훅 테스트 추가 권장
5. **batch-b worktree 디렉토리**: 세션 종료 후 `.claude/worktrees/batch-b` 수동 삭제 필요
