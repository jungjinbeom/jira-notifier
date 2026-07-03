import { useState, useEffect } from "react";
import type { PollingStatus } from "../types";
import { api } from "../api";
import type { ToastType } from "./useToast";

interface Params {
  setLoading: (v: boolean) => void;
  showMessage: (text: string, type: ToastType) => void;
}

const INITIAL_STATUS: PollingStatus = {
  is_active: false,
  last_check: null,
  notification_count: 0,
  unread_count: 0,
};

/** 폴링 상태(status) 보유 + 시작/중지 + 5초 주기 갱신 */
export const usePolling = ({ setLoading, showMessage }: Params) => {
  const [status, setStatus] = useState<PollingStatus>(INITIAL_STATUS);

  const loadStatus = async () => {
    try {
      setStatus(await api.getStatus());
    } catch (e) {
      console.error("상태 로드 실패:", e);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const startPolling = async () => {
    setLoading(true);
    try {
      const result = await api.startPolling();
      showMessage(result, "success");
      await loadStatus();
    } catch (e) {
      showMessage(`${e}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const stopPolling = async () => {
    setLoading(true);
    try {
      const result = await api.stopPolling();
      showMessage(result, "info");
      await loadStatus();
    } catch (e) {
      showMessage(`${e}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // status/setStatus는 알림 카운트 갱신을 위해 상위(파사드)에서 useNotifications로 전달된다
  return { status, setStatus, startPolling, stopPolling };
}
