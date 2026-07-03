import type { JiraNotification } from "../../types";
import { timeAgo } from "../../utils/time";

interface Props {
  notification: JiraNotification;
  onClick: (notification: JiraNotification) => void;
}

/** 알림 한 건을 표시하는 카드 */
export function NotificationCard({ notification: n, onClick }: Props) {
  const isMention = n.notification_type === "Mention";
  const typeClass = isMention ? "mention" : "assigned";

  return (
    <div
      className={`notification-card ${!n.read ? "unread" : ""} ${typeClass}`}
      onClick={() => onClick(n)}
    >
      <div className={`notif-icon ${typeClass}`}>{isMention ? "💬" : "👤"}</div>

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
}
