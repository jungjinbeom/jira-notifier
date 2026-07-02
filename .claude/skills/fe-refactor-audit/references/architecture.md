# 유지보수성 · 확장성 감사 (fe-architect)

jira-notifier 프론트의 구조적 냄새와 개선 방향. 모든 제안은 동작 보존.

## 1. God-hook: useJira.ts
`hooks/useJira.ts`는 설정·알림·미배정·내담당·상태·폴링제어·토스트를 한 훅에 모은다(수백 줄, 다수의 useState/useEffect/invoke).
- **냄새**: 단일 책임 위반 → 한 기능 수정이 무관한 상태에 영향, 테스트/이해 어려움, 재사용 불가.
- **개선(점진)**: 도메인별 훅으로 분리 — `useConfig`, `useNotifications`, `useUnassigned`, `useMyTickets`, `usePollingStatus`. 공통 토스트는 `useToast`로. App에서 필요한 훅만 조합.
- **단계 예**: ① 순수 추출이 쉬운 것부터(useToast, usePollingStatus) → ② 티켓 훅 → ③ 알림/설정. 한 단계마다 빌드 검증.
- **경계**: invoke 명령명·인자키, listen 이벤트명은 그대로 유지(백엔드 계약 불변).

## 2. IPC 호출 분산
`invoke("save_config", ...)`, `invoke("get_unassigned")` 등 문자열 명령이 훅 전반에 흩어짐.
- **냄새**: 명령명 오타/변경 시 컴파일러가 못 잡음, 계약이 코드 곳곳에 암묵.
- **개선**: `src/api.ts`(또는 `lib/tauri.ts`)에 타입 안전 래퍼 집중 — 예: `api.getUnassigned(): Promise<UnassignedTicket[]>`. 명령명/반환타입을 한곳에서 관리 → 유지보수·리팩토링 안전성↑.
- **주의**: 과설계 금지. 단순 위임 래퍼 수준으로.

## 3. 탭 추가 비용 (확장성)
탭 하나 추가에 `types.Tab`, `useJira`, `App.tsx`, 컴포넌트 4곳 수정 필요.
- **개선(선택)**: 탭 메타(키·라벨·배지 소스·렌더)를 배열/레지스트리로 정의해 App의 탭 바/콘텐츠를 map으로 렌더. 신규 탭 = 배열 1항목 + 데이터 훅.
- **트레이드오프**: 탭이 3~4개로 적으면 과한 추상화일 수 있음 → 감독자가 향후 확장 계획과 함께 판단.

## 4. 폴더/의존 구조
- 현재 `components/ hooks/ types/`로 이미 관심사 분리는 양호.
- 확인: 의존이 단방향(components→hooks→types)인지, 순환/역방향이 없는지. api 모듈 도입 시 위치(`src/api.ts` 또는 `src/lib/`)와 배럴 여부 제안.

## 판단 기준
- 저리스크·고효용: IPC 래퍼 집중, useToast/usePollingStatus 추출.
- 고효용·중리스크(점진 필수): god-hook 분해.
- 조건부: 탭 레지스트리(확장 예정일 때만).
