# 프론트엔드 컴포넌트 SRP 리팩토링 계획 (lead)

대전제: **동작 보존** — DOM 구조/className/props 흐름/IPC 계약 불변. 순수 내부 품질 개선.

## 진단 요약
- 훅 레이어(useJira 파사드 + 도메인 훅 + api.ts + utils)는 이미 SRP 양호 → 대상 아님.
- SRP 위반은 **컴포넌트 4개**에 집중:
  - `App.tsx` (136줄): 헤더 + 탭바 + 콘텐츠 라우팅 + 토스트 + TicketList 설정 인라인 = 5가지 책임.
  - `NotificationList.tsx` / `TicketList.tsx`: 각자 리스트헤더 + 빈상태 + 카드렌더를 인라인. 헤더·빈상태 구조 중복.
  - `Settings.tsx` (140줄): 폼 상태 관리 + 6개 필드 boilerplate 렌더 인라인.

## 우선순위 (임팩트 ÷ 리스크×공수)

### Tier 1 — 저리스크 순수 프리젠테이션 추출
1. **EmptyState 컴포넌트 추출** — NotificationList/TicketList가 공유하는 `empty-state` 블록을 `components/common/EmptyState.tsx`로. props: icon/title/desc.
2. **FormField 컴포넌트 추출** — Settings의 `form-group`(label+input+hint) 6회 반복을 `components/settings/FormField.tsx`로. Settings는 값·검증·구성만 담당.

### Tier 2 — App 분해 + 카드 추출
3. **App.tsx 분해** — `Header`, `TabBar`를 `components/`로 분리. App은 합성 루트(상태 배선 + 레이아웃)만.
4. **TicketList 탭 설정 데이터 분리** — assigned/unassigned의 라벨/아이콘/빈상태 문구를 `components/ticketTabs.ts`(또는 App 내 상수)로 추출해 JSX에서 분리.
5. **NotificationCard / TicketCard 추출** — 각 리스트를 `헤더 + 빈상태 + map(Card)`로. 카드 렌더 책임 분리.

### Tier 3 — 선택
6. **ListHeader 공용화** — 두 리스트의 `notifications-header`(카운트 + 액션 슬롯) 공용 컴포넌트.

## 검증
각 항목 적용 후 `npm run build`(tsc + vite build) 통과로 동작 보존 확인. className/DOM 불변이므로 시각·기능 회귀 없음.
