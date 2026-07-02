---
name: jn-backend
description: jira-notifier의 Rust + Tauri v2 백엔드(src-tauri/)를 수정할 때 사용. Tauri 커맨드 추가, 폴링 로직, Jira REST/JQL 호출, AppState 상태 관리, 파일 영속화, 로깅 작업이면 반드시 이 스킬의 컨벤션을 따를 것.
---

# jn-backend — 백엔드 컨벤션 (Rust/Tauri)

경로: `jira-notifier/src-tauri/src/` — `lib.rs`(앱/커맨드/폴링/영속화), `jira.rs`(Jira 클라이언트), `main.rs`(진입점).

## Tauri 커맨드 추가 절차 (급소)
1. `#[tauri::command] async fn name(state: State<'_, AppState>, ...) -> Result<T, String>` 작성. 반환 T는 `Serialize` 여야 프론트로 전달된다.
2. **`invoke_handler![...]`에 함수명 등록** — 빼먹으면 프론트 invoke가 런타임 실패한다.
3. 프론트 `invoke("name", { argKey })`의 argKey는 파라미터명과 동일해야 한다.

## 상태 관리
- `AppState`의 공유 필드는 `Arc<Mutex<...>>`(tokio Mutex). 락은 짧게 잡고, 폴링 태스크에는 `state.field.clone()`한 Arc를 넘긴다.
- 폴링은 `tokio::spawn` 루프. 매 사이클: 담당자/멘션/미배정/내담당 조회 → 새 항목 emit + 알림 → sleep(interval).

## 프론트로 이벤트 보내기
- `app.emit("event-name", payload)` (payload는 Serialize). 프론트 `listen("event-name")`과 이름·형태를 맞춘다.

## Jira REST / JQL (jira.rs)
- 검색 엔드포인트는 **`/rest/api/2/search/jql`** (구 `/rest/api/2/search`는 410 폐기). 응답에 `total` 없음 → 파싱 구조체에서 optional/default 처리.
- 담당자 조회는 이메일 대신 `assignee = currentUser()` (Cloud 제한 회피).
- 상태 필터는 상태명 대신 `statusCategory IN ("To Do","In Progress")` (언어/워크플로 무관).
- 코멘트 body는 wiki 마크업 문자열, 멘션은 `[~accountid:...]`. 시각은 `+0900`(콜론 없음) → rfc3339 파싱 실패하므로 `%z` 포맷으로 재시도.
- 인증: Basic (email:token base64), 헤더에 Accept/Content-Type application/json.

## 영속화 & 로깅
- 파일 영속화 패턴: `%APPDATA%\jira-notifier\`에 JSON 저장(`config.json`, `seen.json`). serde_json 사용, 시작 시 load, 변경 시 save.
- 로깅: `log::info!/error!`, env_logger를 **파일 타깃**으로 초기화(`%TEMP%\jira-notifier.log`). 릴리스는 콘솔이 없으므로 파일이 유일한 확인 수단.

## 검증
- 컴파일/실행은 `jn-build-run` 스킬 절차(재빌드 전 앱 종료, raw cargo 금지 아님—cargo 컴파일 체크는 가능하나 실행 검증은 tauri CLI 빌드로).
- 커맨드명/이벤트명/struct 필드명 변경 시 프론트(jn-fe-dev)와 반드시 동기화.
