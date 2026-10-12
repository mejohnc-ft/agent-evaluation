"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, nextTheme, readTheme, subscribeTheme, type Theme } from "../theme";
import { IconButton } from "./icon-button";
import { Monitor, Moon, Sun } from "./icons";

const ICON = { system: Monitor, light: Sun, dark: Moon } as const;
const ACTION: Record<Theme, string> = {
  system: "Use system theme",
  light: "Switch to light theme",
  dark: "Switch to dark theme",
};

// Cycles System → Light → Dark. The icon shows the current theme; the label names the next one.
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as const);
  const Current = ICON[theme];
  return (
    <IconButton label={ACTION[nextTheme(theme)]} data-theme-state={theme} onClick={() => applyTheme(nextTheme(theme))}>
      <Current className="size-[1.125rem]" />
    </IconButton>
  );
}
