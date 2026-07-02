# useJira 리팩토링 계획 (감독자 종합)

대상: `jira-notifier/src/hooks/useJira.ts` (277줄) 및 관련 컴포넌트.
절대 제약: **동작 보존** — 기능/렌더/IPC 계약(invoke 명령명·인자키·이벤트명) 불변.
핵심 기법: `useJira`를 **동일한 반환 객체 shape을 유지하는 얇은 파사드**로 남기면 `App.tsx`·컴포넌트는 손대지 않아도 된다.

주의: 서브에이전트 파일접근 장애로 감독자가 직접 분석·종합함.

---

## 결합 지점 (리스크 근거)
- `markAsRead`/`markAllRead`/`clearNotifications`(219~256) 와 `new-notification` 리스너(46~59)가 `status.unread_count`/`notification_count`를 함께 변경한다.
- 즉 notifications 도메인과 status 도메인이 카운트로 얽혀 있어, 이 둘의 완전 분리는 고리스크 → Tier 3에서 파사드 조합으로 처리.

---

## Tier 1 — 저리스크·고효용 (권장, 즉시)
### R1. `useToast` 훅 추출
- 현재: `message`, `showMessage`, `setTimeout` (31~34, 95~101).
- 개선: `hooks/useToast.ts`로 분리. useJira가 내부에서 사용하고 `message`를 계속 반환 → 반환 계약 불변.
- 리스크: 매우 낮음. 검증: `npm run build` + 토스트 표시 동작.

### R2. `useTauriEvent<T>(name, handler)` 헬퍼
- 현재: 동일 `listen/unlisten` 블록 3회 반복 (46~59, 62~73, 76~87).
- 개선: `hooks/useTauriEvent.ts` 한 줄 훅으로 통합. 약 25~30줄 보일러플레이트 제거.
- 주의: handler는 함수형 setState만 사용(현재도 그러함)해 stale closure 회피. 의존성 배열 동작 불변.
- 리스크: 낮음. 검증: 빌드 + 세 이벤트(new-notification/unassigned-updated/my-tickets-updated) 수신 확인(로그).

### R3. 컴포넌트 중복 유틸 추출
- 현재: `timeAgo`가 NotificationList·TicketList에 중복. `open(url) catch window.open`도 중복.
- 개선: `utils/time.ts`(timeAgo), `utils/url.ts`(openUrl). 두 컴포넌트가 import.
- 리스크: 낮음. 검증: 빌드 + 시간 표기/클릭 열기 동작.

---

## Tier 2 — 중효용·중리스크 (선택)
### R4. `api.ts` 타입 안전 IPC 래퍼
- 현재: `invoke("...")` 문자열 12곳 분산 (명령명 오타를 컴파일러가 못 잡음).
- 개선: `src/api.ts`에 `api.getConfig()`, `api.saveConfig(c)`, `api.refreshUnassigned()` 등 얇은 타입 래퍼 집중. 훅들은 이를 호출.
- 효용: 계약 한곳 관리, 리팩토링/이름변경 안전성↑. 백엔드 커맨드명은 그대로(래퍼 내부 문자열만).
- 리스크: 중(기계적이나 12곳 치환). 검증: 빌드 + 각 커맨드 1회 호출 경로 확인.

---

## Tier 3 — 고효용·고리스크 (점진 필수, 승인 시 단계별)
### R5. 도메인 훅 분해 + useJira 파사드화
- `useConfig` (config/saveConfig/testConnection/loadConfig)
- `useTickets` (unassigned+myTickets는 동일 패턴 → 파라미터화한 하나 또는 두 인스턴스)
- `useNotifications` (notifications + 읽음/삭제 + new-notification), **단 status 카운트 결합**은 파사드에서 setStatus 주입 또는 카운트를 notifications 훅으로 이관해 해소.
- `usePollingStatus` (status/loadStatus/startPolling/stopPolling/5s interval)
- `useJira`는 위를 조합해 **기존과 동일한 객체를 반환**하는 파사드로 축소 → App 불변.
- 단계: ①useConfig ②useTickets ③usePollingStatus ④useNotifications(카운트 결합 처리) — 각 단계 빌드 검증·롤백 가능.
- 리스크: 높음(특히 ④). 근거 있는 점진 적용 필수.

---

## 성능(fe-performance 관점, 종합 반영)
- `setInterval(loadStatus, 5000)`(90~93)로 5초마다 App 리렌더 발생하나, 트리가 얕고 항목이 적어 **체감 비용 낮음** → 단독 최적화 불필요.
- 리렌더 격리/`React.memo`/`useCallback`은 Tier 3 분해의 **부수효과**로만 취함. 근거 없는 선제 최적화는 하지 않음.
- 결론: 성능 목적의 독립 항목 없음.

## 우선순위 요약 (임팩트 ÷ 리스크×공수)
1. R1 useToast · R2 useTauriEvent · R3 유틸추출 → 즉시 (안전, 라인수·중복 크게 감소)
2. R4 api.ts → 선택 (유지보수성↑)
3. R5 도메인 훅 분해 → 승인 시 단계별 (구조 근본 개선, 고리스크)
