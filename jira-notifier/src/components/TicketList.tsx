import type { UnassignedTicket } from "../types";
import { timeAgo } from "../utils/time";
import { openUrl } from "../utils/url";

interface Props {
  tickets: UnassignedTicket[];
  onRefresh: () => void;
  countLabel: string;
  cardIcon: string;
  showReporter?: boolean;
  emptyIcon: string;
  emptyTitle: string;
  emptyDesc: string;
}

export function TicketList({
  tickets,
  onRefresh,
  countLabel,
  cardIcon,
  showReporter = true,
  emptyIcon,
  emptyTitle,
  emptyDesc,
}: Props) {
  const handleClick = (ticket: UnassignedTicket) => openUrl(ticket.url);

  return (
    <div>
      <div className="notifications-header">
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {countLabel} {tickets.length}건
        </span>
        <div className="notifications-header-actions">
          <button className="notif-action-btn" onClick={onRefresh}>
            새로고침
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{emptyIcon}</div>
          <div className="empty-title">{emptyTitle}</div>
          <div className="empty-desc">{emptyDesc}</div>
        </div>
      ) : (
        tickets.map((t) => (
          <div
            key={t.key}
            className="notification-card assigned"
            onClick={() => handleClick(t)}
          >
            <div className="notif-icon assigned">{cardIcon}</div>

            <div className="notif-body">
              <div className="notif-type assigned">
                {t.key}
                {t.status && (
                  <span style={{ marginLeft: "6px", opacity: 0.7 }}>
                    · {t.status}
                  </span>
                )}
              </div>
              <div className="notif-message">{t.summary}</div>
              {showReporter && t.reporter && (
                <div className="notif-issue">보고자: {t.reporter}</div>
              )}
            </div>

            <div className="notif-time">{timeAgo(t.updated)}</div>
          </div>
        ))
      )}
    </div>
  );
}
