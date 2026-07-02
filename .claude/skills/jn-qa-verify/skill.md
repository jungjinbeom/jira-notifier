---
name: jn-qa-verify
description: jira-notifier 수정 결과를 검증할 때 사용. FE↔BE Tauri IPC 경계(invoke 커맨드명·인자키·이벤트명·직렬화 필드명)를 양쪽 소스에서 동시에 읽어 교차 비교하고, 빌드/런타임 로그로 실제 동작을 확인한다. "검증/QA/동작 확인/경계 점검" 요청이면 반드시 사용.
---

# jn-qa-verify — 경계 교차 검증

이 앱 버그의 대부분은 FE↔BE **경계 불일치**에서 나온다. "존재 확인"이 아니라 **양쪽 shape이 맞물리는지**를 확인한다.

## 1. 빌드 게이트
`jn-build-run` 절차로 `npm run build`(tsc+vite) → `npm run tauri build -- --no-bundle` 통과 확인. 실패 시 원문 로그와 함께 담당 에이전트에 반려.

## 2. 경계 교차 대조표 (핵심)
아래 3종을 **양쪽 소스를 동시에 열어** 표로 대조한다.

### (A) 커맨드
- 프론트: `src/hooks/useJira.ts`의 모든 `invoke("X", { k: ... })`
- 백엔드: `src-tauri/src/lib.rs`의 `#[tauri::command] fn X(k: ...)` **및** `invoke_handler![...]` 등록 여부
- 체크: 명령명 일치? 인자 키 == Rust 파라미터명? handler에 등록됨? 반환 타입이 프론트 `invoke<T>`의 T와 일치?

### (B) 이벤트
- 프론트: `listen("evt")` / 백엔드: `app.emit("evt", payload)`
- 체크: 이벤트명 일치? payload 형태 == 프론트 제네릭 타입?
- 현재 계약: `new-notification`, `unassigned-updated`, `my-tickets-updated`

### (C) 직렬화 필드
- 백엔드 struct(serde 기본=필드명 그대로) ↔ `src/types/index.ts` 인터페이스
- 체크: 모든 필드명(snake_case) 일치? enum 직렬화 == TS 리터럴 유니온? Option<T> == TS `?`/nullable?

## 3. 런타임 확인
`%TEMP%\jira-notifier.log` 초기화 후 실행 → 폴링 사이클/JQL/에러 확인. 예: `[멘션] JQL 반환 이슈 수`, `[배정] 반환 티켓 수`, `Jira API 에러 (4xx)`.

## 4. 판정 & 보고
- `_workspace/03_qa_report.md`에 PASS/FAIL, (A)(B)(C) 대조표, 재현 로그 발췌를 남긴다.
- 불일치는 구체적 실패 시나리오로 기술: "프론트가 `refresh_my_tickets` 호출하나 handler 미등록 → 런타임 invoke 실패".
- FAIL은 원인 에이전트에 반려(1회 재시도 후 재검증).

## 점진적 적용
전체 완료 후 1회가 아니라, FE 또는 BE 모듈 수정 **직후** 그 모듈이 걸친 경계만 즉시 검증한다.
