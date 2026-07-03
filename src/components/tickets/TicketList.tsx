import type { UnassignedTicket } from "@/types";
import { openUrl } from "@/utils/url";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionButton } from "@/components/common/ActionButton";
import { TicketCard } from "./TicketCard";

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

export const TicketList = ({
  tickets,
  onRefresh,
  countLabel,
  cardIcon,
  showReporter = true,
  emptyIcon,
  emptyTitle,
  emptyDesc,
}: Props) => {
  const handleClick = (ticket: UnassignedTicket) => openUrl(ticket.url);

  return (
    <div>
      <div className="notifications-header">
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {countLabel} {tickets.length}건
        </span>
        <div className="notifications-header-actions">
          <ActionButton onClick={onRefresh}>새로고침</ActionButton>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} desc={emptyDesc} />
      ) : (
        tickets.map((t) => (
          <TicketCard
            key={t.key}
            ticket={t}
            icon={cardIcon}
            showReporter={showReporter}
            onClick={handleClick}
          />
        ))
      )}
    </div>
  );
}
