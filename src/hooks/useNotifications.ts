import { useCallback } from "react";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import type { JiraNotification, PollingStatus } from "@/types";
import { api } from "@/api";
import { queryClient, queryKeys } from "@/queryClient";
import { useTauriEvent } from "./useTauriEvent";

/**
 * 알림 목록 + 읽음/삭제 + 실시간 수신.
 * status 카운트(notification_count/unread_count)도 캐시에 직접 반영한다
 * → usePolling으로부터 setStatus를 주입받던 결합이 사라진다.
 */

/** ['status'] 캐시의 카운트를 보정한다. total은 새 값, unread는 새 값을 반환하는 updater */
const patchStatusCounts = (
  next: (prev: PollingStatus) => Partial<PollingStatus>
) => {
  queryClient.setQueryData<PollingStatus>(queryKeys.status, (prev) => {
    if (!prev) return prev;
    return { ...prev, ...next(prev) };
  });
};

export const useNotifications = () => {
  const { data: notifications } = useSuspenseQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.getNotifications,
  });

  useTauriEvent<JiraNotification>("new-notification", (payload) => {
    queryClient.setQueryData<JiraNotification[]>(
      queryKeys.notifications,
      (prev) => [payload, ...(prev ?? [])]
    );
    patchStatusCounts((prev) => ({
      notification_count: prev.notification_count + 1,
      unread_count: prev.unread_count + 1,
    }));
  });

  // 읽은 알림은 목록에서 제거한다(이후 다시 표시되지 않음).
  const markAsReadMutation = useMutation({
    mutationFn: api.markAsRead,
    onSuccess: (_r, id) => {
      queryClient.setQueryData<JiraNotification[]>(
        queryKeys.notifications,
        (prev) => (prev ?? []).filter((n) => n.id !== id)
      );
      patchStatusCounts((prev) => ({
        notification_count: Math.max(0, prev.notification_count - 1),
        unread_count: Math.max(0, prev.unread_count - 1),
      }));
    },
    onError: (e) => console.error("읽음 처리 실패:", e),
  });

  const markAllReadMutation = useMutation({
    mutationFn: api.markAllRead,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.notifications, []);
      patchStatusCounts(() => ({ notification_count: 0, unread_count: 0 }));
    },
    onError: (e) => console.error("읽음 처리 실패:", e),
  });

  const clearMutation = useMutation({
    mutationFn: api.clearNotifications,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.notifications, []);
      patchStatusCounts(() => ({ notification_count: 0, unread_count: 0 }));
    },
    onError: (e) => console.error("삭제 실패:", e),
  });

  const markAsRead = useCallback(
    (id: string) => markAsReadMutation.mutate(id),
    [markAsReadMutation]
  );
  const markAllRead = useCallback(
    () => markAllReadMutation.mutate(),
    [markAllReadMutation]
  );
  const clearNotifications = useCallback(
    () => clearMutation.mutate(),
    [clearMutation]
  );

  return { notifications, markAsRead, markAllRead, clearNotifications };
};
