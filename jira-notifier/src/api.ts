// Tauri 백엔드 커맨드의 타입 안전 래퍼.
// invoke 명령 문자열은 이 파일 안에만 존재한다 → 명령명 오타/변경을 한곳에서 관리.
import { invoke } from "@tauri-apps/api/core";
import type {
  JiraConfig,
  JiraNotification,
  PollingStatus,
  UnassignedTicket,
} from "./types";

export const api = {
  getConfig: () => invoke<JiraConfig>("get_config"),
  saveConfig: (config: JiraConfig) => invoke<string>("save_config", { config }),
  testConnection: (config: JiraConfig) =>
    invoke<string>("test_connection", { config }),

  getNotifications: () => invoke<JiraNotification[]>("get_notifications"),
  markAsRead: (id: string) => invoke<void>("mark_as_read", { id }),
  markAllRead: () => invoke<void>("mark_all_read"),
  clearNotifications: () => invoke<void>("clear_notifications"),

  getStatus: () => invoke<PollingStatus>("get_status"),
  startPolling: () => invoke<string>("start_polling"),
  stopPolling: () => invoke<string>("stop_polling"),

  getUnassigned: () => invoke<UnassignedTicket[]>("get_unassigned"),
  refreshUnassigned: () => invoke<UnassignedTicket[]>("refresh_unassigned"),
  getMyTickets: () => invoke<UnassignedTicket[]>("get_my_tickets"),
  refreshMyTickets: () => invoke<UnassignedTicket[]>("refresh_my_tickets"),
};
