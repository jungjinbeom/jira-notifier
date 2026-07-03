import { useTheme } from "@/hooks/useTheme";

/** 다크/라이트 테마 전환 버튼. 테마 상태를 스스로 소유한다. */
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
};
