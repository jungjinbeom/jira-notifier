import { useState } from "react";
import { useJira } from "./hooks/useJira";
import { Settings } from "./components/Settings";
import { NotificationList } from "./components/NotificationList";
import { TicketList } from "./components/TicketList";
import type { Tab } from "./types";

export default function App() {
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

  const unread = status.unread_count;

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <span className={`status-dot ${status.is_active ? "active" : ""}`} />
          <span className="header-logo">
            <span>Jira</span> Notifier
          </span>
        </div>

        <button
          className={`power-btn ${status.is_active ? "active" : ""}`}
          onClick={status.is_active ? stopPolling : startPolling}
          disabled={loading}
          title={status.is_active ? "모니터링 중지" : "모니터링 시작"}
        >
          {status.is_active ? "⏸" : "▶"}
        </button>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "notifications" ? "active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          알림
          {unread > 0 && <span className="badge">{unread}</span>}
        </button>
        <button
          className={`tab-btn ${tab === "assigned" ? "active" : ""}`}
          onClick={() => setTab("assigned")}
        >
          배정
          {myTickets.length > 0 && (
            <span className="badge">{myTickets.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${tab === "unassigned" ? "active" : ""}`}
          onClick={() => setTab("unassigned")}
        >
          미배정
          {unassigned.length > 0 && (
            <span className="badge">{unassigned.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
        >
          설정
        </button>
      </div>

      {/* Content */}
      <div className="content">
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
            countLabel="내 담당(진행중)"
            cardIcon="🙋"
            showReporter={true}
            emptyIcon="✅"
            emptyTitle="진행 중인 담당 티켓이 없습니다"
            emptyDesc="CS 워크스페이스에서 내가 담당이고 '해야 할 일/진행 중'인 티켓이 여기에 표시됩니다"
          />
        )}
        {tab === "unassigned" && (
          <TicketList
            tickets={unassigned}
            onRefresh={refreshUnassigned}
            countLabel="CS 미배정"
            cardIcon="🎫"
            showReporter={true}
            emptyIcon="✅"
            emptyTitle="미배정 티켓이 없습니다"
            emptyDesc="CS 워크스페이스의 담당자 미지정 티켓이 여기에 표시됩니다"
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
      </div>

      {/* Toast */}
      {message && <div className={`toast ${message.type}`}>{message.text}</div>}
    </div>
  );
}
