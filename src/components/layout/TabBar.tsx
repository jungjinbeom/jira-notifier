import type { Tab } from "@/types";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  unreadCount: number;
  assignedCount: number;
  unassignedCount: number;
}

interface TabDef {
  id: Tab;
  label: string;
  badge?: number;
}

/** 알림/배정/미배정/설정 탭 전환 바 (배지는 0이면 숨김) */
export const TabBar = ({
  active,
  onChange,
  unreadCount,
  assignedCount,
  unassignedCount,
}: Props) => {
  const tabs: TabDef[] = [
    { id: "notifications", label: "알림", badge: unreadCount },
    { id: "assigned", label: "배정", badge: assignedCount },
    { id: "unassigned", label: "미배정", badge: unassignedCount },
    { id: "settings", label: "설정" },
  ];

  return (
    <div className="tab-bar">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`tab-btn ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.badge !== undefined && t.badge > 0 && (
            <span className="badge">{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
