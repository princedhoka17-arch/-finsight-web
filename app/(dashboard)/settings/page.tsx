"use client";

import { useState, useEffect } from "react";
import { useThemeStore, THEMES, type ThemeId, type Theme } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { authApi } from "@/lib/api";

// ── Responsive hook ───────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    function update() { setWidth(window.innerWidth); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

// ── Constants ────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  free:           "Free",
  beginner:       "Beginner",
  intermediate:   "Intermediate",
  pay_per_report: "Pay-per-report",
};

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  free:           { bg: "#E6F1FB", text: "#185FA5" },
  beginner:       { bg: "#EAF3DE", text: "#3B6D11" },
  intermediate:   { bg: "#FAEEDA", text: "#854F0B" },
  pay_per_report: { bg: "#FAECE7", text: "#993C1D" },
};

// ── Types ────────────────────────────────────────────────────────

type ThemeObj = Theme;

// ── SectionCard ──────────────────────────────────────────────────

function SectionCard({
  icon, title, children, theme, isMobile,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  theme: ThemeObj;
  isMobile?: boolean;
}) {
  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: isMobile ? 10 : 12,
    }}>
      <div style={{
        padding: isMobile ? "10px 14px" : "12px 16px",
        borderBottom: `0.5px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{ fontSize: 13, color: theme.textMuted }}>{icon}</span>
        <span style={{
          fontFamily: "IBM Plex Mono, monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.07em",
          color: theme.text,
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── SettingsRow ──────────────────────────────────────────────────

function SettingsRow({
  label, sub, theme, children, last = false, isMobile,
}: {
  label: string;
  sub?: string;
  theme: ThemeObj;
  children?: React.ReactNode;
  last?: boolean;
  isMobile?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: isMobile ? "11px 14px" : "12px 16px",
      borderBottom: last ? "none" : `0.5px solid ${theme.border}`,
      gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? 12 : 13,
          fontFamily: "'Source Serif 4', Georgia, serif",
          color: theme.text,
        }}>
          {label}
        </div>
        {sub && (
          <div style={{
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 10,
            color: theme.textFaint,
            marginTop: 2,
            letterSpacing: "0.03em",
          }}>
            {sub}
          </div>
        )}
      </div>
      {children && (
        <div style={{ flexShrink: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Toggle ───────────────────────────────────────────────────────

function Toggle({
  on, onChange, theme,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  theme: ThemeObj;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 34,
        height: 20,
        borderRadius: 999,
        flexShrink: 0,
        border: `0.5px solid ${on ? "#3C7A5F" : theme.border}`,
        background: on ? "#3C7A5F" : theme.bg,
        cursor: "pointer",
        position: "relative",
        transition: "background 0.18s, border-color 0.18s",
        padding: 0,
        outline: "none",
      }}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: on ? 17 : 3,
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.18s",
        display: "block",
        boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
      }} />
    </button>
  );
}

// ── ThemeButton ──────────────────────────────────────────────────

function ThemeButton({
  id, active, theme: t, onClick,
}: {
  id: ThemeId;
  active: boolean;
  theme: ThemeObj;
  onClick: () => void;
}) {
  const th = THEMES[id];
  return (
    <button
      onClick={onClick}
      title={th.name}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 10px",
        borderRadius: 8,
        cursor: "pointer",
        border: active
          ? `1.5px solid ${t.accent}`
          : `0.5px solid ${t.border}`,
        background: active ? `${t.accent}18` : "transparent",
        alignItems: "center",
        flex: 1,
        minWidth: 60,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{
        width: 34,
        height: 20,
        borderRadius: 4,
        background: th.bg,
        border: `0.5px solid ${t.border}`,
        display: "flex",
        overflow: "hidden",
      }}>
        <div style={{ flex: 1, background: th.bgSecondary }} />
        <div style={{ width: 9, background: th.accent, opacity: 0.9 }} />
      </div>
      <span style={{
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: 9,
        color: active ? t.accent : t.textMuted,
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}>
        {th.name}
      </span>
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, themeId, setTheme } = useThemeStore();
  const { user, plan } = useAppStore();

  const width    = useWindowWidth();
  const isMobile = width > 0 && width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [notifs, setNotifs] = useState({
    highAlerts:   true,
    dailyDigest:  true,
    newReport:    false,
    mediumAlerts: false,
  });

  const [compact, setCompact] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(user?.full_name ?? "");
  const [nameSaving,  setNameSaving]  = useState(false);
  const [nameError,   setNameError]   = useState("");
  const [nameSaved,   setNameSaved]   = useState(false);

  useEffect(() => {
    setNameInput(user?.full_name ?? "");
  }, [user?.full_name]);

  async function saveName() {
    if (!nameInput.trim()) { setNameError("Name cannot be empty."); return; }
    setNameSaving(true);
    setNameError("");
    try {
      await authApi.updateProfile({ full_name: nameInput.trim() });
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch (_err) {
      setNameError("Could not save — try again.");
    } finally {
      setNameSaving(false);
    }
  }

  function cancelEdit() {
    setEditingName(false);
    setNameInput(user?.full_name ?? "");
    setNameError("");
  }

  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.free;

  const initials = (user?.full_name ?? "U")
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const mono: React.CSSProperties = {
    fontFamily: "IBM Plex Mono, monospace",
    letterSpacing: "0.04em",
  };

  // ── Account card inner content (shared) ──────────────────────
  const AccountCardContent = (
    <>
      {/* Avatar + name */}
      <div style={{
        padding: isMobile ? "14px 14px 12px" : "16px 16px 14px",
        borderBottom: `0.5px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: isMobile ? 40 : 44,
          height: isMobile ? 40 : 44,
          borderRadius: "50%",
          flexShrink: 0,
          background: "#FAEEDA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...mono,
          fontSize: isMobile ? 13 : 15,
          fontWeight: 500,
          color: "#854F0B",
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") cancelEdit();
                }}
                autoFocus
                placeholder="Your name"
                style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.text,
                  background: theme.bg,
                  border: `0.5px solid ${theme.borderHover}`,
                  borderRadius: 5,
                  padding: "5px 8px",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              {nameError && (
                <div style={{ ...mono, fontSize: 10, color: theme.danger }}>
                  {nameError}
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={saveName}
                  disabled={nameSaving}
                  style={{
                    ...mono, fontSize: 10,
                    color: theme.accentText,
                    background: theme.accent,
                    border: "none",
                    borderRadius: 5,
                    padding: "4px 12px",
                    cursor: nameSaving ? "not-allowed" : "pointer",
                    opacity: nameSaving ? 0.6 : 1,
                  }}
                >
                  {nameSaving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    ...mono, fontSize: 10,
                    color: theme.textMuted,
                    background: "none",
                    border: `0.5px solid ${theme.border}`,
                    borderRadius: 5,
                    padding: "4px 12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 500,
                  color: theme.text,
                }}>
                  {user?.full_name ?? "Investor"}
                </span>
                {nameSaved && (
                  <span style={{ ...mono, fontSize: 9, color: theme.success }}>✓ saved</span>
                )}
                <button
                  onClick={() => setEditingName(true)}
                  style={{
                    ...mono, fontSize: 9,
                    color: theme.textFaint,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 4px",
                  }}
                >
                  edit
                </button>
              </div>
              <div style={{ ...mono, fontSize: 10, color: theme.textFaint, marginTop: 2 }}>
                {user?.email ?? ""}
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingsRow label="Plan" theme={theme} isMobile={isMobile}>
        <span style={{
          ...mono, fontSize: 10,
          borderRadius: 999,
          padding: "2px 9px",
          background: planStyle.bg,
          color: planStyle.text,
        }}>
          {PLAN_LABELS[plan] ?? "Free"}
        </span>
      </SettingsRow>

      <SettingsRow label="Language" theme={theme} last isMobile={isMobile}>
        <span style={{ ...mono, fontSize: 11, color: theme.textMuted }}>
          English (India)
        </span>
      </SettingsRow>
    </>
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: isMobile ? "16px 14px" : "20px",
      paddingBottom: isMobile ? 88 : 20,
      color: theme.text,
    }}>

      {/* Breadcrumb — hidden on mobile */}
      {!isMobile && (
        <div style={{
          ...mono, fontSize: 10,
          color: theme.textFaint,
          display: "flex", alignItems: "center", gap: 5,
          marginBottom: 18,
        }}>
          <span>Home</span>
          <span style={{ fontSize: 9 }}>›</span>
          <span style={{ color: theme.text }}>Settings</span>
        </div>
      )}

      {/* Mobile page title */}
      {isMobile && (
        <h1 style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: 20, fontWeight: 600, color: theme.text,
          margin: "0 0 16px",
        }}>
          Settings
        </h1>
      )}

      {/* ── MOBILE: single column ─────────────────────────────── */}
      {isMobile && (
        <div>
          {/* Account */}
          <SectionCard icon="👤" title="ACCOUNT" theme={theme} isMobile>
            {AccountCardContent}
          </SectionCard>

          {/* Notifications */}
          <SectionCard icon="🔔" title="NOTIFICATIONS" theme={theme} isMobile>
            <SettingsRow label="High severity alerts" sub="Push + email" theme={theme} isMobile>
              <Toggle on={notifs.highAlerts} onChange={v => setNotifs(n => ({ ...n, highAlerts: v }))} theme={theme} />
            </SettingsRow>
            <SettingsRow label="Daily update digest" sub="Sent at 8:00 AM IST" theme={theme} isMobile>
              <Toggle on={notifs.dailyDigest} onChange={v => setNotifs(n => ({ ...n, dailyDigest: v }))} theme={theme} />
            </SettingsRow>
            <SettingsRow label="New report published" sub="Email only" theme={theme} isMobile>
              <Toggle on={notifs.newReport} onChange={v => setNotifs(n => ({ ...n, newReport: v }))} theme={theme} />
            </SettingsRow>
            <SettingsRow label="Medium alerts" sub="Email only" theme={theme} last isMobile>
              <Toggle on={notifs.mediumAlerts} onChange={v => setNotifs(n => ({ ...n, mediumAlerts: v }))} theme={theme} />
            </SettingsRow>
          </SectionCard>

          {/* Theme — scrollable row on mobile */}
          <SectionCard icon="🎨" title="THEME" theme={theme} isMobile>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ ...mono, fontSize: 10, color: theme.textFaint, marginBottom: 10 }}>
                Choose your colour scheme
              </div>
              <div style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                // hide scrollbar but keep scrollability
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              } as React.CSSProperties}>
                {(Object.keys(THEMES) as ThemeId[]).map(id => (
                  <ThemeButton key={id} id={id} active={themeId === id} theme={theme} onClick={() => setTheme(id)} />
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Display */}
          <SectionCard icon="🖥" title="DISPLAY" theme={theme} isMobile>
            <SettingsRow label="Compact view" sub="Denser lists and cards" theme={theme} last isMobile>
              <Toggle on={compact} onChange={setCompact} theme={theme} />
            </SettingsRow>
          </SectionCard>

          {/* Data & Privacy */}
          <SectionCard icon="🔒" title="DATA & PRIVACY" theme={theme} isMobile>
            <SettingsRow label="Research data" sub="Reports read, watchlist, alerts" theme={theme} isMobile>
              <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>secured</span>
            </SettingsRow>
            <SettingsRow label="Export my data" sub="Download a copy of your data" theme={theme} last isMobile>
              <button style={{
                ...mono, fontSize: 10,
                color: theme.textMuted,
                background: "none",
                border: `0.5px solid ${theme.border}`,
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
              }}>
                Request →
              </button>
            </SettingsRow>
          </SectionCard>

          {/* About */}
          <SectionCard icon="ℹ" title="ABOUT" theme={theme} isMobile>
            <SettingsRow label="Version" theme={theme} isMobile>
              <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>1.0.0</span>
            </SettingsRow>
            <SettingsRow label="Purpose" sub="Educational research only" theme={theme} last isMobile>
              <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>not advice</span>
            </SettingsRow>
          </SectionCard>
        </div>
      )}

      {/* ── TABLET + DESKTOP: two-column grid ─────────────────── */}
      {!isMobile && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr 1fr" : "1fr 1fr",
          gap: 14,
          alignItems: "start",
        }}>

          {/* LEFT COLUMN */}
          <div>
            {/* Notifications */}
            <SectionCard icon="🔔" title="NOTIFICATIONS" theme={theme}>
              <SettingsRow label="High severity alerts" sub="Push + email" theme={theme}>
                <Toggle on={notifs.highAlerts} onChange={v => setNotifs(n => ({ ...n, highAlerts: v }))} theme={theme} />
              </SettingsRow>
              <SettingsRow label="Daily update digest" sub="Sent at 8:00 AM IST" theme={theme}>
                <Toggle on={notifs.dailyDigest} onChange={v => setNotifs(n => ({ ...n, dailyDigest: v }))} theme={theme} />
              </SettingsRow>
              <SettingsRow label="New report published" sub="Email only" theme={theme}>
                <Toggle on={notifs.newReport} onChange={v => setNotifs(n => ({ ...n, newReport: v }))} theme={theme} />
              </SettingsRow>
              <SettingsRow label="Medium alerts" sub="Email only" theme={theme} last>
                <Toggle on={notifs.mediumAlerts} onChange={v => setNotifs(n => ({ ...n, mediumAlerts: v }))} theme={theme} />
              </SettingsRow>
            </SectionCard>

            {/* Theme */}
            <SectionCard icon="🎨" title="THEME" theme={theme}>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ ...mono, fontSize: 10, color: theme.textFaint, marginBottom: 10 }}>
                  Choose your colour scheme
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(Object.keys(THEMES) as ThemeId[]).map(id => (
                    <ThemeButton key={id} id={id} active={themeId === id} theme={theme} onClick={() => setTheme(id)} />
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Display */}
            <SectionCard icon="🖥" title="DISPLAY" theme={theme}>
              <SettingsRow label="Compact view" sub="Denser lists and cards" theme={theme} last>
                <Toggle on={compact} onChange={setCompact} theme={theme} />
              </SettingsRow>
            </SectionCard>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Account */}
            <SectionCard icon="👤" title="ACCOUNT" theme={theme}>
              {AccountCardContent}
            </SectionCard>

            {/* Data & Privacy */}
            <SectionCard icon="🔒" title="DATA & PRIVACY" theme={theme}>
              <SettingsRow label="Research data" sub="Reports read, watchlist, alerts" theme={theme}>
                <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>stored securely</span>
              </SettingsRow>
              <SettingsRow label="Export my data" sub="Download a copy of your account data" theme={theme} last>
                <button style={{
                  ...mono, fontSize: 10,
                  color: theme.textMuted,
                  background: "none",
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}>
                  Request →
                </button>
              </SettingsRow>
            </SectionCard>

            {/* About */}
            <SectionCard icon="ℹ" title="ABOUT" theme={theme}>
              <SettingsRow label="Version" theme={theme}>
                <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>1.0.0</span>
              </SettingsRow>
              <SettingsRow label="Purpose" sub="Educational research only" theme={theme} last>
                <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>not financial advice</span>
              </SettingsRow>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}