import type { JiraNotification } from "../../types";
import { openUrl } from "../../utils/url";
import { EmptyState } from "../common/EmptyState";
import { ActionButton } from "../common/ActionButton";
import { NotificationCard } from "./NotificationCard";

interface Props {
  notifications: JiraNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
}

export const NotificationList = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClear,
}: Props) => {
  const handleClick = (notification: JiraNotification) => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    openUrl(notification.url);
  };

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon="🔔"
        title="알림이 없습니다"
        desc="Jira 멘션이나 담당자 지정 시 여기에 표시됩니다"
      />
    );
  }

  return (
    <div>
      <div className="notifications-header">
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          총 {notifications.length}건
        </span>
        <div className="notifications-header-actions">
          <ActionButton onClick={onMarkAllRead}>모두 읽음</ActionButton>
          <ActionButton onClick={onClear}>전체 삭제</ActionButton>
        </div>
      </div>

      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} onClick={handleClick} />
      ))}
    </div>
  );
}
