"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

export type ThemeName = "cyberpunk" | "glass" | "brutalist" | "organic";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: { id: ThemeName; label: string; description: string }[];
}

const themes = [
  {
    id: "cyberpunk" as ThemeName,
    label: "Cyberpunk Terminal",
    description: "Matrix meets Bloomberg",
  },
  { id: "glass" as ThemeName, label: "Glass Morphism", description: "Frosted glass & gradients" },
  {
    id: "brutalist" as ThemeName,
    label: "Brutalist Data",
    description: "Dense info, high contrast",
  },
  { id: "organic" as ThemeName, label: "Organic Flow", description: "Warm & approachable" },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to get initial theme (handles SSR where localStorage is unavailable)
function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "cyberpunk";
  const saved = localStorage.getItem("agentpay-theme") as ThemeName | null;
  if (saved && themes.some((t) => t.id === saved)) {
    return saved;
  }
  return "cyberpunk";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("agentpay-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
