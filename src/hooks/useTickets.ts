import { useState, useEffect, useCallback } from "react";
import type { UnassignedTicket } from "@/types";
import { api } from "@/api";
import { useTauriEvent } from "./useTauriEvent";
import type { ToastType } from "./useToast";

interface Params {
  showMessage: (text: string, type: ToastType) => void;
}

/** CS 미배정 + 내 담당(진행중) 티켓 목록. 폴링 이벤트로 실시간 갱신 */
export const useTickets = ({ showMessage }: Params) => {
  const [unassigned, setUnassigned] = useState<UnassignedTicket[]>([]);
  const [myTickets, setMyTickets] = useState<UnassignedTicket[]>([]);

  useEffect(() => {
    api
      .getUnassigned()
      .then(setUnassigned)
      .catch((e) => console.error("미배정 티켓 로드 실패:", e));
    api
      .getMyTickets()
      .then(setMyTickets)
      .catch((e) => console.error("배정 티켓 로드 실패:", e));
  }, []);

  useTauriEvent<UnassignedTicket[]>("unassigned-updated", setUnassigned);
  useTauriEvent<UnassignedTicket[]>("my-tickets-updated", setMyTickets);

  const refreshUnassigned = useCallback(async () => {
    try {
      setUnassigned(await api.refreshUnassigned());
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }, [showMessage]);

  const refreshMyTickets = useCallback(async () => {
    try {
      setMyTickets(await api.refreshMyTickets());
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }, [showMessage]);

  return { unassigned, myTickets, refreshUnassigned, refreshMyTickets };
}
