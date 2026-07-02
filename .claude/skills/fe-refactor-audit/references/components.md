# 재사용성 · 가독성 감사 (fe-component)

jira-notifier 프론트의 컴포넌트/유틸 냄새와 개선 방향. 모든 제안은 동작 보존.

## 1. 중복 유틸: timeAgo
`components/NotificationList.tsx`와 `components/TicketList.tsx`에 `timeAgo`가 동일 복붙되어 있다.
- **냄새**: DRY 위반 → 포맷 규칙 변경 시 두 곳 수정, 불일치 위험.
- **개선**: `src/utils/time.ts`(또는 `lib/format.ts`)로 추출해 두 컴포넌트가 import. 저리스크·고효용의 대표 항목.

## 2. 반복되는 URL 열기
두 컴포넌트의 `try { await open(url) } catch { window.open(url) }` 패턴 중복.
- **개선**: `openUrl(url)` 유틸로 추출(`utils/`), 클릭 핸들러에서 호출.

## 3. 반복되는 이벤트 구독/에러 처리 (useJira)
`useEffect` + `listen<T>(evt, e => setX(e.payload))` + `unlisten.then(fn=>fn())` 블록이 이벤트마다 반복. `try/catch + console.error` 로더도 반복.
- **개선**: 커스텀 훅 `useTauriEvent<T>(name, handler)`로 구독 보일러플레이트 제거. 로더의 에러 로깅은 작은 헬퍼로 통일. (이 항목은 fe-architect의 god-hook 분해와 겹치므로 상충 조율 필요 — 분리 훅 안에서 useTauriEvent 사용하는 형태로 합의)

## 4. 컴포넌트 분해/책임
- `TicketList`는 이미 제네릭 props(countLabel·cardIcon·empty*)로 재사용 중 → **좋은 사례, 유지**.
- `NotificationList`도 카드 렌더가 유사 → 공통 카드(`Card`/`ListRow`) 프리미티브 추출 여지 검토(단, 알림은 read/타입 뱃지 등 추가 요소가 있어 억지 통합 금지).
- `Settings.tsx`: 폼 필드 반복이 많으면 `Field` 프리미티브로 가독성↑ 가능(반복 3회+일 때만).

## 5. 가독성/죽은 코드
- 매직 문자열(이벤트명·명령명)·인라인 스타일 반복 → 상수화/클래스화 검토.
- 미사용 import/변수, 사용되지 않는 export 확인.
- 이름이 의도를 드러내는지(예: `loadX` 캐시 로드 vs `refreshX` 강제 조회 구분은 현재 양호).

## 판단 기준
- 즉시 채택(저리스크): timeAgo·openUrl 유틸 추출, 죽은 코드 제거.
- 조율 필요: useTauriEvent 훅(구조 변경과 맞물림) → fe-architect와 합의.
- 조건부: 카드 프리미티브·Field 추출(실제 반복도가 임계 이상일 때).
