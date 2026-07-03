import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Tab } from "@/types";
import { useJira } from "@/hooks/useJira";
import {
  NavContext,
  BadgesContext,
  HeaderContext,
  ToastContext,
  NotificationsContext,
  TicketsContext,
  ConfigContext,
} from "./contexts";

/**
 * 전역 상태 프로바이더. useJira로 도메인 상태를 모은 뒤,
 * 재렌더 빈도별로 나눈 메모이즈드 컨텍스트로 하위에 공급한다.
 * children은 부모(main)에서 만든 안정적인 엘리먼트라 이 컴포넌트의
 * 재렌더가 children을 재렌더시키지 않는다 — 소비처는 구독한 컨텍스트가
 * 바뀔 때만 재렌더된다.
 */
export const JiraProvider = ({ children }: { children: ReactNode }) => {
  const [tab, setTab] = useState<Tab>("notifications");

  const {
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
  } = useJira();

  const navValue = useMemo(() => ({ tab, setTab }), [tab]);

  const badgesValue = useMemo(
    () => ({
      unreadCount: status.unread_count,
      assignedCount: myTickets.length,
      unassignedCount: unassigned.length,
    }),
    [status.unread_count, myTickets.length, unassigned.length]
  );

  const headerValue = useMemo(
    () => ({
      isActive: status.is_active,
      loading,
      onStart: startPolling,
      onStop: stopPolling,
    }),
    [status.is_active, loading, startPolling, stopPolling]
  );

  const toastValue = useMemo(() => ({ message }), [message]);

  const notificationsValue = useMemo(
    () => ({
      notifications,
      onMarkRead: markAsRead,
      onMarkAllRead: markAllRead,
      onClear: clearNotifications,
    }),
    [notifications, markAsRead, markAllRead, clearNotifications]
  );

  const ticketsValue = useMemo(
    () => ({
      unassigned,
      myTickets,
      refreshUnassigned,
      refreshMyTickets,
    }),
    [unassigned, myTickets, refreshUnassigned, refreshMyTickets]
  );

  const configValue = useMemo(
    () => ({
      config,
      loading,
      onSave: saveConfig,
      onTest: testConnection,
    }),
    [config, loading, saveConfig, testConnection]
  );

  return (
    <NavContext.Provider value={navValue}>
      <BadgesContext.Provider value={badgesValue}>
        <HeaderContext.Provider value={headerValue}>
          <ToastContext.Provider value={toastValue}>
            <NotificationsContext.Provider value={notificationsValue}>
              <TicketsContext.Provider value={ticketsValue}>
                <ConfigContext.Provider value={configValue}>
                  {children}
                </ConfigContext.Provider>
              </TicketsContext.Provider>
            </NotificationsContext.Provider>
          </ToastContext.Provider>
        </HeaderContext.Provider>
      </BadgesContext.Provider>
    </NavContext.Provider>
  );
};
