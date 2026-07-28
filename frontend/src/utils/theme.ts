export type Theme = "dark" | "light" | "system";

const THEME_KEY = "ax-theme";

function resolveEffective(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function applyTheme(theme: Theme): void {
  const effective = resolveEffective(theme);
  const root = document.documentElement;
  root.classList.remove("theme-light");
  if (effective === "light") {
    root.classList.add("theme-light");
  }
}

export function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) || "dark";
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}
