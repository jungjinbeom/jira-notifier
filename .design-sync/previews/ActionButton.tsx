import type { ReactNode } from "react";
import { ActionButton } from "jira-notifier";

// 이 DS는 다크가 기본 테마(:root)다. 미리보기 하네스는 body에 background:#fff를
// 하드코딩하므로, DS의 표면 토큰을 명시적으로 씌워야 실제 앱과 같은 모습이 된다.
const Surface = ({ children, width }: { children: ReactNode; width?: number }) => (
  <div
    style={{
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      padding: 16,
      borderRadius: 8,
      width,
    }}
  >
    {children}
  </div>
);

/** 기본 사용례 — 알림 목록 헤더의 텍스트형 액션. */
export const Default = () => (
  <Surface>
    <div className="notifications-header-actions">
      <ActionButton>모두 읽음</ActionButton>
      <ActionButton>전체 삭제</ActionButton>
    </div>
  </Surface>
);

/** 목록 헤더 안에서의 실제 배치 — 제목과 액션이 양끝으로 나뉜다. */
export const InListHeader = () => (
  <Surface width={380}>
    <div className="notifications-header">
      <span>알림 12</span>
      <div className="notifications-header-actions">
        <ActionButton>모두 읽음</ActionButton>
        <ActionButton>전체 삭제</ActionButton>
      </div>
    </div>
  </Surface>
);

/** 단일 액션 — 티켓 목록의 새로고침(TicketList의 실제 사용례). */
export const SingleAction = () => (
  <Surface>
    <ActionButton>새로고침</ActionButton>
  </Surface>
);

/** 비활성 — 새로고침 진행 중. */
export const Disabled = () => (
  <Surface>
    <div className="notifications-header-actions">
      <ActionButton disabled>새로고침 중…</ActionButton>
      <ActionButton disabled>전체 삭제</ActionButton>
    </div>
  </Surface>
);
