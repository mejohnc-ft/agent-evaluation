// Theme choice (System, Light, Dark). "system" removes data-theme so the CSS follows the OS.
// localStorage can throw (privacy modes, blocked storage), so every access is guarded.
export type Theme = "system" | "light" | "dark";

const THEME_KEY = "cadre-theme";
const CHANGE_EVENT = "cadre-theme-change";
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

// Runs inline in <head> before first paint, so a stored theme never flashes the OS one.
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export const nextTheme = (theme: Theme) => NEXT[theme];

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not persisted; the choice still applies to this page.
  }
  setRootTheme(theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function setRootTheme(theme: Theme) {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

// Also follows a change made in another tab.
export function subscribeTheme(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY && e.key !== null) return;
    setRootTheme(readTheme());
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
