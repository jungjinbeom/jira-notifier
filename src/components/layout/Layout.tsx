import type { ReactNode } from "react";
import type { Tab } from "@/types";
import type { Toast } from "@/hooks/useToast";
import { Header } from "./Header";
import { TabBar } from "./TabBar";

interface Props {
  // 헤더
  isActive: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
  // 탭바
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  unreadCount: number;
  assignedCount: number;
  unassignedCount: number;
  // 토스트
  message: Toast | null;
  // 콘텐츠
  children: ReactNode;
}

/** 앱의 시각적 셸: 헤더 + 탭바 + 콘텐츠 영역 + 토스트 배치를 담당한다. */
export const Layout = ({
  isActive,
  loading,
  onStart,
  onStop,
  tab,
  onTabChange,
  unreadCount,
  assignedCount,
  unassignedCount,
  message,
  children,
}: Props) => {
  return (
    <div className="app">
      <Header
        isActive={isActive}
        loading={loading}
        onStart={onStart}
        onStop={onStop}
      />

      <TabBar
        active={tab}
        onChange={onTabChange}
        unreadCount={unreadCount}
        assignedCount={assignedCount}
        unassignedCount={unassignedCount}
      />

      <div className="content">{children}</div>

      {message && <div className={`toast ${message.type}`}>{message.text}</div>}
    </div>
  );
}
