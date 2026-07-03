/** TicketList 탭(배정/미배정)의 표시 설정 데이터. App JSX에서 분리. */
export interface TicketTabConfig {
  countLabel: string;
  cardIcon: string;
  showReporter: boolean;
  emptyIcon: string;
  emptyTitle: string;
  emptyDesc: string;
}

export const ASSIGNED_TAB: TicketTabConfig = {
  countLabel: "내 담당(진행중)",
  cardIcon: "🙋",
  showReporter: true,
  emptyIcon: "✅",
  emptyTitle: "진행 중인 담당 티켓이 없습니다",
  emptyDesc:
    "CS 워크스페이스에서 내가 담당이고 '해야 할 일/진행 중'인 티켓이 여기에 표시됩니다",
};

export const UNASSIGNED_TAB: TicketTabConfig = {
  countLabel: "CS 미배정",
  cardIcon: "🎫",
  showReporter: true,
  emptyIcon: "✅",
  emptyTitle: "미배정 티켓이 없습니다",
  emptyDesc: "CS 워크스페이스의 담당자 미지정 티켓이 여기에 표시됩니다",
};
