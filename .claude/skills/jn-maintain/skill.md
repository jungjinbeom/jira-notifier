---
name: jn-maintain
description: jira-notifier 앱의 버그 수정·기능 추가를 에이전트 팀으로 처리하는 오케스트레이터. "jira-notifier 고쳐줘/기능 추가해줘/이 앱 유지보수" 같은 요청이면 반드시 이 스킬로 팀을 구성해 탐색→계획→구현(FE/BE)→검증 파이프라인을 돌린다. 단순 질문이 아니라 코드 변경이 필요한 작업이면 사용.
---

# jn-maintain — jira-notifier 유지보수 오케스트레이터

실행 모드: **에이전트 팀** (파이프라인 + 생성-검증). 앱 루트는 `jira-notifier/`.

## 팀 구성
| 에이전트 | 타입 | 역할 |
|---------|------|------|
| jn-explorer | general-purpose | 탐색·재현·원인 특정 |
| jn-fe-dev | (정의 파일) | React/TS 구현 |
| jn-be-dev | (정의 파일) | Rust/Tauri 구현 |
| jn-qa | general-purpose | 빌드·실행·경계 교차 검증 |

모든 에이전트는 `model: "opus"`로 스폰한다. 규모가 작은 변경(예: 문구 수정)이면 explorer 없이 dev 1명 + qa로 축소할 수 있다.

## 워크플로우
1. **탐색** — jn-explorer가 원인/범위를 `_workspace/01_explorer_findings.md`에 작성. IPC 계약 변경 여부를 명시.
2. **분배** — 리더가 TaskCreate로 FE/BE 작업을 나눠 할당. 의존관계(계약 변경은 BE 선행 등)를 설정.
3. **구현(병렬 가능)** — jn-fe-dev / jn-be-dev가 각자 스킬(jn-frontend/jn-backend/jn-build-run)로 최소 수정. **계약이 바뀌면 서로 즉시 SendMessage로 동기화.**
4. **점진 검증** — 각 모듈 완료 직후 jn-qa가 `jn-qa-verify`로 해당 경계를 즉시 검증. FAIL은 원인 에이전트에 반려.
5. **통합 검증 & 종합** — 전체 빌드/실행 통과 + 경계 대조표 PASS 확인 후 리더가 결과를 사용자에게 요약. 필요 시 설치본(`npm run tauri build`) 생성.

## 데이터 전달 프로토콜
- 조율: TaskCreate/TaskUpdate (진행·의존)
- 실시간 소통: SendMessage (특히 IPC 계약 변경)
- 산출물: 파일 기반. 중간물은 `_workspace/{phase}_{agent}_{artifact}.md`에 보존, 최종 코드만 소스에 반영.

## 에러 핸들링
- 빌드/검증 실패: 1회 반려 후 재시도, 재실패면 해당 결과 없이 진행하되 보고서에 누락 명시.
- 상충 정보: 삭제하지 않고 출처 병기.
- 재현 불가: 추측 금지, "확인 필요"로 명시하고 사용자에 입력 요청.

## 테스트 시나리오
- **정상 흐름**: "미배정 탭에 담당자 필터를 추가" → explorer가 FE(TicketList/App/useJira)·BE(jira.rs JQL/lib.rs 커맨드) 지점 특정 → be-dev가 커맨드/JQL 추가+handler 등록, fe-dev가 타입/훅/탭 추가(계약 동기화) → qa가 invoke↔command·event·필드 대조 + 로그로 반환 수 확인 → PASS 후 요약.
- **에러 흐름**: fe-dev가 `invoke("refresh_x")` 추가했으나 be-dev가 handler 등록 누락 → qa의 (A)커맨드 대조에서 "handler 미등록 → 런타임 실패" 검출 → be-dev에 반려 → 등록 후 재검증 PASS.
