---
name: jn-frontend
description: jira-notifier의 React + TypeScript 프론트엔드(src/)를 수정할 때 사용. 탭 추가, 컴포넌트/훅 작성, Tauri invoke/listen 연동, 타입 정의 변경 등 프론트 코드 작업이면 반드시 이 스킬의 컨벤션을 따를 것.
---

# jn-frontend — 프론트엔드 컨벤션 (React/TS)

경로: `jira-notifier/src/`

## 구조
- `App.tsx` — 탭 바 + 각 탭 콘텐츠 렌더링. 탭 상태는 `useState<Tab>`.
- `hooks/useJira.ts` — **모든 백엔드 연동의 단일 지점.** 상태(useState) + `invoke` 래퍼 + `listen` 이벤트 구독 + 반환 객체.
- `components/` — 프레젠테이션 컴포넌트(`NotificationList`, `TicketList`, `Settings`). props로 데이터/콜백 수신.
- `types/index.ts` — 공용 타입. 백엔드 직렬화 형태와 1:1로 맞춘다.

## 백엔드 호출 패턴 (useJira 안에서)
- 명령 호출: `await invoke<반환타입>("command_name", { argKey: value })`
  - argKey는 Rust 커맨드의 **파라미터명과 동일**해야 한다.
- 이벤트 구독: `useEffect`에서 `listen<Payload>("event-name", e => setState(e.payload))`, 반환에서 `unlisten.then(fn => fn())`로 해제.
- 초기 로드: 마운트 `useEffect`에서 `get_*` 커맨드로 캐시 로드, 이벤트로 실시간 갱신.

## 탭 추가 절차 (실전 예시)
1. `types/index.ts`의 `Tab` 유니온에 새 값 추가, 필요한 데이터 인터페이스 정의.
2. `useJira.ts`에 상태 + `load*`(캐시) + `refresh*`(즉시) 함수 + `listen("*-updated")` 구독 추가 후 반환 객체에 노출.
3. `App.tsx`에 탭 버튼(배지 포함)과 콘텐츠 블록 추가.
4. 목록형 화면은 `components/TicketList.tsx`(제네릭)를 재사용 — props: tickets, onRefresh, countLabel, cardIcon, empty*.

## 타입 일치 규칙 (급소)
백엔드 struct 필드는 serde 기본 직렬화(필드명 그대로, snake_case)로 내려온다. TS 인터페이스 필드명을 **그대로** 맞춘다. 예: `JiraNotification { notification_type, issue_key, ... }`, enum은 문자열 리터럴 유니온(`"Mention" | "Assigned"`).

## 검증
- 타입체크: `npm run build`(tsc 단계)로 통과 확인. 실행 확인은 `jn-build-run` 스킬 절차.
- invoke 명령명/인자키·이벤트명·필드명을 바꿨다면 백엔드와 반드시 동기화(jn-be-dev).
