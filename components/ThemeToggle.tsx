"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f2f4f8" : "#05070d");
    try {
      localStorage.setItem("qiongzhi-theme", next);
    } catch {}
    setTheme(next);
  }

  const label = theme === "light" ? "切换到深色主题" : "切换到浅色主题";

  return (
    <button
      id="themeToggle"
      type="button"
      className="icon-btn theme-toggle"
      onClick={toggle}
      aria-label={label}
      title="切换明暗主题"
    >
      <Icon name="i-sun" className="icon theme-icon-sun" />
      <Icon name="i-moon" className="icon theme-icon-moon" />
    </button>
  );
}
