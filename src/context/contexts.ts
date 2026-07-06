import { createContext, useContext } from "react";
import type {
  JiraConfig,
  JiraNotification,
  Tab,
  UnassignedTicket,
} from "@/types";
import type { Toast } from "@/hooks/useToast";

/**
 * 전역 상태를 재렌더 빈도·도메인별로 쪼갠 컨텍스트 모음.
 * 각 컨텍스트 value는 JiraProvider에서 메모이즈되므로, 한 도메인의 변화가
 * 무관한 소비처를 재렌더하지 않는다(예: 5초 폴링은 Header/Badges만 갱신).
 */

/** 컨텍스트 + Provider 밖 사용 시 던지는 가드 훅을 함께 생성한다. */
function createSafeContext<T>(name: string) {
  const ctx = createContext<T | undefined>(undefined);
  const useSafe = (): T => {
    const value = useContext(ctx);
    if (value === undefined) {
      throw new Error(
        `use${name}는 <JiraProvider> 안에서만 사용할 수 있습니다`,
      );
    }
    return value;
  };
  return [ctx, useSafe] as const;
}

/** 현재 탭 + 전환. 사용자 탭 클릭 시에만 변한다. */
export interface NavValue {
  tab: Tab;
  setTab: (tab: Tab) => void;
}
export const [NavContext, useNav] = createSafeContext<NavValue>("Nav");

/** 탭바 뱃지 카운트. 폴링·이벤트로 변한다. */
export interface BadgesValue {
  unreadCount: number;
  assignedCount: number;
  unassignedCount: number;
}
export const [BadgesContext, useBadges] = createSafeContext<BadgesValue>("Badges");

/** 헤더: 모니터링 상태 + 시작/중지. */
export interface HeaderValue {
  isActive: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
}
export const [HeaderContext, useHeader] =
  createSafeContext<HeaderValue>("Header");

/** 토스트 메시지. */
export interface ToastValue {
  message: Toast | null;
}
export const [ToastContext, useToastMessage] =
  createSafeContext<ToastValue>("Toast");

/** 알림 목록 + 읽음/삭제. */
export interface NotificationsValue {
  notifications: JiraNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
}
export const [NotificationsContext, useNotificationsCtx] =
  createSafeContext<NotificationsValue>("Notifications");

/** 배정/미배정 티켓 목록 + 새로고침. */
export interface TicketsValue {
  unassigned: UnassignedTicket[];
  myTickets: UnassignedTicket[];
  refreshUnassigned: () => void;
  refreshMyTickets: () => void;
}
export const [TicketsContext, useTicketsCtx] =
  createSafeContext<TicketsValue>("Tickets");

/** Jira 설정 + 저장/연결테스트. */
export interface ConfigValue {
  config: JiraConfig;
  loading: boolean;
  onSave: (config: JiraConfig) => void;
  onTest: (config: JiraConfig) => void;
}
export const [ConfigContext, useConfigCtx] =
  createSafeContext<ConfigValue>("Config");
