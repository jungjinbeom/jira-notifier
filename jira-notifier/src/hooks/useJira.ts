import { useState } from "react";
import { useToast } from "./useToast";
import { useConfig } from "./useConfig";
import { useNotifications } from "./useNotifications";
import { useTickets } from "./useTickets";
import { usePolling } from "./usePolling";

/**
 * 도메인 훅들을 조합하는 파사드.
 * 반환 shape은 기존과 동일하므로 App/컴포넌트는 변경할 필요가 없다.
 * loading은 설정·폴링이 공유하는 플래그라 파사드가 보유하고 주입한다.
 * status는 usePolling이 보유하되, 알림 카운트를 useNotifications가 함께 갱신한다.
 */
export const useJira = () => {
  const { message, showMessage } = useToast();
  const [loading, setLoading] = useState(false);

  const { status, setStatus, startPolling, stopPolling } = usePolling({
    setLoading,
    showMessage,
  });
  const { notifications, markAsRead, markAllRead, clearNotifications } =
    useNotifications({ setStatus });
  const { config, saveConfig, testConnection } = useConfig({
    setLoading,
    showMessage,
  });
  const { unassigned, myTickets, refreshUnassigned, refreshMyTickets } =
    useTickets({ showMessage });

  return {
    config,
    notifications,
    unassigned,
    myTickets,
    status,
    loading,
    message,
    saveConfig,
    testConnection,
    startPolling,
    stopPolling,
    markAsRead,
    markAllRead,
    clearNotifications,
    refreshUnassigned,
    refreshMyTickets,
  };
}
