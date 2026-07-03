import type { UnassignedTicket } from "../../types";
import { timeAgo } from "../../utils/time";

interface Props {
  ticket: UnassignedTicket;
  icon: string;
  showReporter: boolean;
  onClick: (ticket: UnassignedTicket) => void;
}

/** 티켓 한 건을 표시하는 카드 (미배정/내 담당 공용) */
export const TicketCard = ({ ticket: t, icon, showReporter, onClick }: Props) => {
  return (
    <div className="notification-card assigned" onClick={() => onClick(t)}>
      <div className="notif-icon assigned">{icon}</div>

      <div className="notif-body">
        <div className="notif-type assigned">
          {t.key}
          {t.status && (
            <span style={{ marginLeft: "6px", opacity: 0.7 }}>· {t.status}</span>
          )}
        </div>
        <div className="notif-message">{t.summary}</div>
        {showReporter && t.reporter && (
          <div className="notif-issue">보고자: {t.reporter}</div>
        )}
      </div>

      <div className="notif-time">{timeAgo(t.updated)}</div>
    </div>
  );
}
