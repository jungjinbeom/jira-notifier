import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/** 저장된 값 → 시스템 설정 → 다크 순으로 초기 테마를 결정한다. */
const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

/** 테마 상태 보유 + html[data-theme] 반영 + localStorage 영속화 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
};
