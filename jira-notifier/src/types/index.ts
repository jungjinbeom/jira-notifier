export interface JiraConfig {
  base_url: string;
  email: string;
  api_token: string;
  username: string;
  display_name: string;
  poll_interval_secs: number;
}

export type NotificationType = "Mention" | "Assigned";

export interface JiraNotification {
  id: string;
  issue_key: string;
  summary: string;
  notification_type: NotificationType;
  message: string;
  timestamp: string;
  url: string;
  read: boolean;
}

export interface PollingStatus {
  is_active: boolean;
  last_check: string | null;
  notification_count: number;
  unread_count: number;
}

export interface UnassignedTicket {
  key: string;
  summary: string;
  status: string;
  reporter: string;
  updated: string;
  url: string;
}

export type Tab = "notifications" | "assigned" | "unassigned" | "settings";
