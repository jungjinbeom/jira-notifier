import { useHeader } from "@/context/contexts";
import { ThemeToggle } from "./ThemeToggle";

/** 앱 상단 헤더: 상태 표시등 + 로고 + 모니터링 시작/중지 버튼 */
export const Header = () => {
  const { isActive, loading, onStart, onStop } = useHeader();

  return (
    <div className="header">
      <div className="header-left">
        <span className={`status-dot ${isActive ? "active" : ""}`} />
        <span className="header-logo">
          <span>Jira</span> Notifier
        </span>
      </div>

      <div className="header-actions">
        <ThemeToggle />
        <button
          className={`power-btn ${isActive ? "active" : ""}`}
          onClick={isActive ? onStop : onStart}
          disabled={loading}
          title={isActive ? "모니터링 중지" : "모니터링 시작"}
        >
          {isActive ? "⏸︎" : "▶︎"}
        </button>
      </div>
    </div>
  );
}
