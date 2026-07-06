import { useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { UnassignedTicket } from "@/types";
import { api } from "@/api";
import { queryClient, queryKeys } from "@/queryClient";
import { useTauriEvent } from "./useTauriEvent";
import type { ToastType } from "./useToast";

interface Params {
  showMessage: (text: string, type: ToastType) => void;
}

/** CS 미배정 + 내 담당(진행중) 티켓 목록. 폴링 이벤트로 실시간 갱신 */
export const useTickets = ({ showMessage }: Params) => {
  const { data: unassigned } = useSuspenseQuery({
    queryKey: queryKeys.ticketsUnassigned,
    queryFn: api.getUnassigned,
  });
  const { data: myTickets } = useSuspenseQuery({
    queryKey: queryKeys.ticketsMy,
    queryFn: api.getMyTickets,
  });

  // 폴링 백엔드가 밀어주는 최신 목록을 캐시에 직접 반영한다.
  useTauriEvent<UnassignedTicket[]>("unassigned-updated", (payload) =>
    queryClient.setQueryData(queryKeys.ticketsUnassigned, payload)
  );
  useTauriEvent<UnassignedTicket[]>("my-tickets-updated", (payload) =>
    queryClient.setQueryData(queryKeys.ticketsMy, payload)
  );

  // refresh_* 는 getUnassigned와 다른 백엔드 커맨드(강제 새로고침)라
  // refetch가 아니라 결과를 직접 캐시에 기록한다.
  const refreshUnassigned = useCallback(async () => {
    try {
      const data = await api.refreshUnassigned();
      queryClient.setQueryData(queryKeys.ticketsUnassigned, data);
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }, [showMessage]);

  const refreshMyTickets = useCallback(async () => {
    try {
      const data = await api.refreshMyTickets();
      queryClient.setQueryData(queryKeys.ticketsMy, data);
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }, [showMessage]);

  return { unassigned, myTickets, refreshUnassigned, refreshMyTickets };
};
