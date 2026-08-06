# jira-notifier UI — 사용 규약

Jira 멘션·담당자 지정·CS 티켓을 알리는 **트레이 상주형 데스크톱 앱**의 컴포넌트 라이브러리다.
화면은 좁고(약 380–420px 폭) 세로로 긴 패널이며, **UI 문구는 모두 한국어**다. 영어 카피를 쓰지 말 것.

## 1. 감싸기와 테마

**프로바이더가 필요 없다.** 모든 토큰은 스타일시트의 `:root`에 정의돼 있으므로 `styles.css`만 로드하면
컴포넌트가 곧바로 올바른 색으로 렌더된다.

**다크가 기본 테마다** (`:root`). 라이트는 루트 엘리먼트에 속성을 찍어 전환한다:

```html
<html data-theme="light">   <!-- 생략하면 다크 -->
```

**단, 컴포넌트는 자기 배경을 칠하지 않는다.** 이게 이 DS에서 가장 자주 틀리는 지점이다 — 카드·버튼은
투명 배경 위에 그려지므로, 감싸는 표면에 배경과 글자색을 직접 지정해야 실제 앱과 같은 모습이 된다:

```jsx
<div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
  {/* 여기 안에서만 컴포넌트가 제대로 보인다 */}
</div>
```

## 2. 스타일 관용구 — 고정 시맨틱 클래스

유틸리티 클래스 시스템이 **아니다**. 클래스 이름은 고정된 시맨틱 어휘이고, 그 밖의 조정은
`var(--*)` 토큰을 쓴 인라인/자체 CSS로 한다. 새 클래스 이름을 지어내지 말 것.

| 갈래 | 클래스 |
|---|---|
| 레이아웃 | `app` `content` `header` `header-left` `header-actions` `header-logo` `tab-bar` `tab-btn` |
| 버튼 | `btn` + `btn-primary` `btn-secondary` `btn-success` `btn-danger`, `btn-full`, `btn-group` |
| 알림/티켓 카드 | `notification-card` + 수식자 `unread` `mention` `assigned`, 내부 `notif-icon` `notif-body` `notif-type` `notif-message` `notif-issue` `notif-time` |
| 목록 헤더 | `notifications-header` `notifications-header-actions` `notif-action-btn` |
| 빈 상태 | `empty-state` `empty-icon` `empty-title` `empty-desc` |
| 폼 | `form-group` `form-label` `form-input` `form-hint` `form-row` `form-section` `form-section-title` |
| 기타 | `badge` `status-dot` `theme-toggle` `power-btn` `toast` `app-boundary` |

**토큰** (`var(--*)`):
표면 `--bg-primary` `--bg-secondary` `--bg-card` `--bg-hover` `--bg-input` ·
글자 `--text-primary` `--text-secondary` `--text-muted` ·
강조 `--accent-blue` `--accent-blue-hover` `--accent-green` `--accent-orange` `--accent-red` `--accent-purple`
(각각 `-dim` 반투명 짝이 있다: `--accent-blue-dim` 등) ·
그 외 `--border` `--radius`(10px) `--radius-sm`(6px) `--shadow`.

강조색은 의미가 붙어 있다: 담당자 지정 = 주황, 멘션 = 보라, 성공/완료 = 초록, 파괴적 동작 = 빨강.

## 3. 진짜 정의가 있는 곳

- `_ds/<folder>/styles.css` → `_ds_bundle.css`를 `@import`한다. 토큰 원본값과 모든 클래스 규칙이 여기 있다.
  스타일을 손대기 전에 이 파일을 직접 읽을 것.
- 컴포넌트별 `<Name>.prompt.md`와 `<Name>.d.ts` — props 계약.

## 4. 관용적인 예

```jsx
<div className="app" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
  <div className="notifications-header">
    <span>알림 12</span>
    <div className="notifications-header-actions">
      <ActionButton onClick={markAll}>모두 읽음</ActionButton>
      <ActionButton onClick={clearAll}>전체 삭제</ActionButton>
    </div>
  </div>

  <NotificationCard notification={n} onClick={open} />

  <EmptyState icon="🔔" title="새 알림이 없습니다"
              desc="담당자 지정이나 멘션이 생기면 여기에 표시됩니다." />

  <div className="btn-group">
    <Button variant="primary" onClick={save}>설정 저장</Button>
    <Button variant="secondary" onClick={test}>연결 테스트</Button>
  </div>
</div>
```
