import type { UnassignedTicket } from "@/types";
import { openUrl } from "@/utils/url";
import { useTicketsCtx } from "@/context/contexts";
import type { TicketTabConfig } from "./ticketTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { ActionButton } from "@/components/common/ActionButton";
import { TicketCard } from "./TicketCard";

/** 표시 설정은 props(정적 config)로, 목록 데이터는 source에 맞춰 컨텍스트에서 소비한다. */
export const TicketList = ({
  source,
  countLabel,
  cardIcon,
  showReporter = true,
  emptyIcon,
  emptyTitle,
  emptyDesc,
}: TicketTabConfig) => {
  const ctx = useTicketsCtx();
  const tickets = source === "assigned" ? ctx.myTickets : ctx.unassigned;
  const onRefresh =
    source === "assigned" ? ctx.refreshMyTickets : ctx.refreshUnassigned;

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
