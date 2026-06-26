"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "ledger-light" | "ledger-dark" | "dark-white" | "classic-dark";

export interface Theme {
  id: ThemeId;
  name: string;
  // Surfaces
  bg: string;
  bgSecondary: string;
  // Accent (primary — gold/copper)
  accent: string;
  accentHover: string;
  accentText: string;
  // Accent 2 (secondary — blue/teal)
  accent2: string;
  accent2Text: string;
  // Ink
  text: string;
  textMuted: string;
  textFaint: string;
  // Borders
  border: string;
  borderHover: string;
  // Semantic
  success: string;
  danger: string;
  info: string;
  // Font overrides (Ledger themes only)
  fontSans?: string;
  fontSerif?: string;
  fontMono?: string;
  // Surface tokens (mirrors globals.css vars)
  surfaceBase?: string;
  surfaceRaised?: string;
  surfaceOverlay?: string;
  surfaceBorder?: string;
  surfaceSubtle?: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  // ── Classic dark — original navy theme ───────────────────────
  "classic-dark": {
    id: "classic-dark",
    name: "Classic",
    bg:              "#080b10",
    bgSecondary:     "#0d1117",
    accent:          "#e8c547",
    accentHover:     "#f0d050",
    accentText:      "#080b10",
    accent2:         "#2dd4bf",
    accent2Text:     "#080b10",
    text:            "#eef2f7",
    textMuted:       "#8a96a8",
    textFaint:       "rgba(238,242,247,0.3)",
    border:          "#1e2733",
    borderHover:     "rgba(255,255,255,0.15)",
    success:         "#4ade80",
    danger:          "#f87171",
    info:            "#60a5fa",
    surfaceBase:     "#080b10",
    surfaceRaised:   "#0d1117",
    surfaceOverlay:  "#131920",
    surfaceBorder:   "#1e2733",
    surfaceSubtle:   "#1a2230",
  },

  // ── Dark White ────────────────────────────────────────────────
  "dark-white": {
    id: "dark-white",
    name: "Dark White",
    bg:              "#0e0e0e",
    bgSecondary:     "rgba(255,255,255,0.04)",
    accent:          "#ffffff",
    accentHover:     "#e5e5e5",
    accentText:      "#0e0e0e",
    accent2:         "#7F77DD",
    accent2Text:     "#0e0e0e",
    text:            "#ffffff",
    textMuted:       "rgba(255,255,255,0.55)",
    textFaint:       "rgba(255,255,255,0.25)",
    border:          "rgba(255,255,255,0.10)",
    borderHover:     "rgba(255,255,255,0.20)",
    success:         "#5DCAA5",
    danger:          "#E24B4A",
    info:            "#7F77DD",
    surfaceBase:     "#0e0e0e",
    surfaceRaised:   "#141414",
    surfaceOverlay:  "#1a1a1a",
    surfaceBorder:   "rgba(255,255,255,0.10)",
    surfaceSubtle:   "#1f1f1f",
  },

  // ── Ledger Light — paper/editorial theme ──────────────────────
  "ledger-light": {
    id: "ledger-light",
    name: "Ledger",
    bg:              "#F7F4ED",
    bgSecondary:     "#FFFFFF",
    accent:          "#A8703D",
    accentHover:     "#BD8047",
    accentText:      "#FFFFFF",
    accent2:         "#3C6E8F",
    accent2Text:     "#FFFFFF",
    text:            "#2B2924",
    textMuted:       "#75705F",
    textFaint:       "rgba(43,41,36,0.42)",
    border:          "#E8E2D5",
    borderHover:     "#D6BD93",
    success:         "#3C7A5F",
    danger:          "#B0503F",
    info:            "#C18A2E",
    fontSans:        "'IBM Plex Mono', monospace",
    fontSerif:       "'Source Serif 4', Georgia, serif",
    fontMono:        "'IBM Plex Mono', monospace",
    surfaceBase:     "#F7F4ED",
    surfaceRaised:   "#FFFFFF",
    surfaceOverlay:  "#F0EDE4",
    surfaceBorder:   "#E8E2D5",
    surfaceSubtle:   "#EBE7DE",
  },

  // ── Ledger Dark — dark editorial theme ───────────────────────
  "ledger-dark": {
    id: "ledger-dark",
    name: "Ledger Dark",
    bg:              "#16140F",
    bgSecondary:     "#1F1C16",
    accent:          "#C9A45E",
    accentHover:     "#D9B873",
    accentText:      "#16140F",
    accent2:         "#6FA8C4",
    accent2Text:     "#16140F",
    text:            "#EDE8DC",
    textMuted:       "#A39C8C",
    textFaint:       "rgba(237,232,220,0.35)",
    border:          "#332E24",
    borderHover:     "#433C2E",
    success:         "#6FAE8E",
    danger:          "#C97A6E",
    info:            "#C9A45E",
    fontSans:        "'IBM Plex Mono', monospace",
    fontSerif:       "'Source Serif 4', Georgia, serif",
    fontMono:        "'IBM Plex Mono', monospace",
    surfaceBase:     "#16140F",
    surfaceRaised:   "#1F1C16",
    surfaceOverlay:  "#252016",
    surfaceBorder:   "#332E24",
    surfaceSubtle:   "#2A2519",
  },
};

// ── Apply theme to DOM ────────────────────────────────────────────
export function applyThemeToDom(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme.id);

  // Surface tokens
  root.style.setProperty("--surface-base",    theme.surfaceBase    ?? theme.bg);
  root.style.setProperty("--surface-raised",  theme.surfaceRaised  ?? theme.bgSecondary);
  root.style.setProperty("--surface-overlay", theme.surfaceOverlay ?? theme.bgSecondary);
  root.style.setProperty("--surface-border",  theme.surfaceBorder  ?? theme.border);
  root.style.setProperty("--surface-subtle",  theme.surfaceSubtle  ?? theme.bgSecondary);

  // Ink tokens
  root.style.setProperty("--ink-primary",   theme.text);
  root.style.setProperty("--ink-secondary", theme.textMuted);
  root.style.setProperty("--ink-muted",     theme.textFaint);
  root.style.setProperty("--ink-inverse",   theme.accentText);

  // Brand tokens
  root.style.setProperty("--brand-gold",      theme.accent);
  root.style.setProperty("--brand-gold-dim",  theme.accentHover);
  root.style.setProperty("--brand-gold-glow", `${theme.accent}22`);
  root.style.setProperty("--brand-teal",      theme.accent2);
  root.style.setProperty("--brand-teal-dim",  theme.accent2);

  // Semantic
  root.style.setProperty("--success", theme.success);
  root.style.setProperty("--danger",  theme.danger);
  root.style.setProperty("--info",    theme.info);

  // Typography — Ledger themes swap fonts
  if (theme.fontSans)  root.style.setProperty("--font-sans",  theme.fontSans);
  if (theme.fontSerif) root.style.setProperty("--font-serif", theme.fontSerif);
  if (theme.fontMono)  root.style.setProperty("--font-mono",  theme.fontMono);

  // Reset fonts for non-Ledger themes
  if (!theme.fontSans) {
    root.style.setProperty("--font-sans",  "'DM Sans', sans-serif");
    root.style.setProperty("--font-serif", "'DM Serif Display', serif");
    root.style.removeProperty("--font-mono");
  }
}

// ── Persist theme_id to backend (fire-and-forget) ────────────────
// Dynamically imported so this file stays free of a hard axios
// dependency — avoids circular imports and SSR issues.
async function syncThemeToBackend(id: ThemeId): Promise<void> {
  try {
    const { authApi } = await import("@/lib/api");
    await authApi.updateProfile({ theme_id: id });
  } catch {
    // Silently ignore — localStorage already holds the value.
    // The user's theme choice is never lost, it just won't sync
    // across devices until the next successful save.
  }
}

// ── Store ─────────────────────────────────────────────────────────
interface ThemeState {
  themeId: ThemeId;
  theme: Theme;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: "classic-dark",
      theme:   THEMES["classic-dark"],

      setTheme: (id) => {
        const theme = THEMES[id];
        // 1. Update store + localStorage immediately (no flicker)
        set({ themeId: id, theme });
        // 2. Apply CSS vars to DOM
        if (typeof window !== "undefined") {
          applyThemeToDom(theme);
          // 3. Persist to backend in background (won't block the UI)
          syncThemeToBackend(id);
        }
      },
    }),
    {
      name: "finsight-theme",
      // Always rehydrate from THEMES — never trust the persisted theme
      // object directly since fields change between versions.
      merge: (persisted: any, current) => {
        const id: ThemeId =
          persisted?.themeId in THEMES
            ? (persisted.themeId as ThemeId)
            : "classic-dark";
        return { ...current, themeId: id, theme: THEMES[id] };
      },
    }
  )
);