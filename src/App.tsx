import { useState } from "react";
import { useJira } from "@/hooks/useJira";
import { Layout } from "@/components/layout/Layout";
import { Settings } from "@/components/settings/Settings";
import { NotificationList } from "@/components/notifications/NotificationList";
import { TicketList } from "@/components/tickets/TicketList";
import { ASSIGNED_TAB, UNASSIGNED_TAB } from "@/components/tickets/ticketTabs";
import type { Tab } from "@/types";

const App = () => {
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

  return (
    <Layout
      isActive={status.is_active}
      loading={loading}
      onStart={startPolling}
      onStop={stopPolling}
      tab={tab}
      onTabChange={setTab}
      unreadCount={status.unread_count}
      assignedCount={myTickets.length}
      unassignedCount={unassigned.length}
      message={message}
    >
      {tab === "notifications" && (
        <NotificationList
          notifications={notifications}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllRead}
          onClear={clearNotifications}
        />
      )}
      {tab === "assigned" && (
        <TicketList
          tickets={myTickets}
          onRefresh={refreshMyTickets}
          {...ASSIGNED_TAB}
        />
      )}
      {tab === "unassigned" && (
        <TicketList
          tickets={unassigned}
          onRefresh={refreshUnassigned}
          {...UNASSIGNED_TAB}
        />
      )}
      {tab === "settings" && (
        <Settings
          config={config}
          loading={loading}
          onSave={saveConfig}
          onTest={testConnection}
        />
      )}
    </Layout>
  );
};

export default App;
