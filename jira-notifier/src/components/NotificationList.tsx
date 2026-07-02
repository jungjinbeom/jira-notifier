import type { JiraNotification } from "../types";
import { timeAgo } from "../utils/time";
import { openUrl } from "../utils/url";

interface Props {
  notifications: JiraNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
}

export function NotificationList({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClear,
}: Props) {
  const handleClick = (notification: JiraNotification) => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    openUrl(notification.url);
  };

  if (notifications.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔔</div>
        <div className="empty-title">알림이 없습니다</div>
        <div className="empty-desc">
          Jira 멘션이나 담당자 지정 시 여기에 표시됩니다
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="notifications-header">
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          총 {notifications.length}건
        </span>
        <div className="notifications-header-actions">
          <button className="notif-action-btn" onClick={onMarkAllRead}>
            모두 읽음
          </button>
          <button className="notif-action-btn" onClick={onClear}>
            전체 삭제
          </button>
        </div>
      </div>

      {notifications.map((n) => {
        const isMention = n.notification_type === "Mention";
        const typeClass = isMention ? "mention" : "assigned";

        return (
          <div
            key={n.id}
            className={`notification-card ${!n.read ? "unread" : ""} ${typeClass}`}
            onClick={() => handleClick(n)}
          >
            <div className={`notif-icon ${typeClass}`}>
              {isMention ? "💬" : "👤"}
            </div>

            <div className="notif-body">
              <div className={`notif-type ${typeClass}`}>
                {isMention ? "멘션" : "담당자 지정"}
              </div>
              <div className="notif-message">{n.message}</div>
              <div className="notif-issue">{n.summary}</div>
            </div>

            <div className="notif-time">{timeAgo(n.timestamp)}</div>
          </div>
        );
      })}
    </div>
  );
}
