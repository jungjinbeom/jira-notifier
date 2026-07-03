import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { JiraNotification, PollingStatus } from "@/types";
import { api } from "@/api";
import { useTauriEvent } from "./useTauriEvent";

interface Params {
  // status의 카운트(notification_count/unread_count)를 알림 액션이 함께 갱신한다
  setStatus: Dispatch<SetStateAction<PollingStatus>>;
}

/** 알림 목록 + 읽음/삭제 + 실시간 수신. status 카운트도 함께 갱신 */
export const useNotifications = ({ setStatus }: Params) => {
  const [notifications, setNotifications] = useState<JiraNotification[]>([]);

  useEffect(() => {
    api
      .getNotifications()
      .then(setNotifications)
      .catch((e) => console.error("알림 로드 실패:", e));
  }, []);

  useTauriEvent<JiraNotification>("new-notification", (payload) => {
    setNotifications((prev) => [payload, ...prev]);
    setStatus((prev) => ({
      ...prev,
      notification_count: prev.notification_count + 1,
      unread_count: prev.unread_count + 1,
    }));
  });

  const markAsRead = async (id: string) => {
    try {
      await api.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setStatus((prev) => ({
        ...prev,
        unread_count: Math.max(0, prev.unread_count - 1),
      }));
    } catch (e) {
      console.error("읽음 처리 실패:", e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setStatus((prev) => ({ ...prev, unread_count: 0 }));
    } catch (e) {
      console.error("읽음 처리 실패:", e);
    }
  };

  const clearNotifications = async () => {
    try {
      await api.clearNotifications();
      setNotifications([]);
      setStatus((prev) => ({
        ...prev,
        notification_count: 0,
        unread_count: 0,
      }));
    } catch (e) {
      console.error("삭제 실패:", e);
    }
  };

  return { notifications, markAsRead, markAllRead, clearNotifications };
}
