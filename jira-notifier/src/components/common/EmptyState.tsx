import type { ReactNode } from "react";

interface Props {
  icon: string;
  title: string;
  desc: ReactNode;
}

/** 목록이 비었을 때 보여주는 안내 블록 (알림/티켓 공용) */
export function EmptyState({ icon, title, desc }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{desc}</div>
    </div>
  );
}
