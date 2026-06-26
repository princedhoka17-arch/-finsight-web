"use client";

import { useState, useEffect } from "react";
import { useThemeStore, THEMES, type ThemeId } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

// ─── Responsive hook ──────────────────────────────────────────────
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

// ─── Theme option button ──────────────────────────────────────────
function ThemeOption({
  id, label, active, bg, accent, onSelect,
}: {
  id: ThemeId; label: string; active: boolean;
  bg: string; accent: string; onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px", width: "100%", textAlign: "left",
        background: active ? `${accent}10` : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? accent + "60" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 32, height: 22, borderRadius: 4, flexShrink: 0,
        background: bg, border: "1px solid rgba(255,255,255,0.12)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", bottom: 4, left: 4,
          width: 10, height: 10, borderRadius: "50%",
          background: accent,
        }} />
      </div>
      <span style={{
        fontFamily: "Georgia, serif", fontSize: 13,
        color: active ? accent : "rgba(232,230,223,0.7)",
      }}>
        {label}
      </span>
      {active && (
        <span style={{ marginLeft: "auto", color: accent, fontSize: 13 }}>✓</span>
      )}
    </button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────
function Section({ title, children, theme, isMobile }: {
  title: string; children: React.ReactNode; theme: any; isMobile?: boolean;
}) {
  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 12,
      padding: isMobile ? "16px 14px" : "24px",
      marginBottom: isMobile ? 12 : 20,
    }}>
      <h2 style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
        letterSpacing: "0.1em", color: theme.accent,
        textTransform: "uppercase", margin: "0 0 16px",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
      <label style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
        letterSpacing: "0.08em", color: "rgba(232,230,223,0.5)",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function ProfilePage() {
  const { theme, themeId, setTheme } = useThemeStore();
  const { user, setUser }            = useAppStore();
  const { loading: authLoading, requireAuth } = useAuth();

  const width    = useWindowWidth();
  const isMobile = width > 0 && width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [mounted,   setMounted]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const [fullName,  setFullName]  = useState("");
  const [country,   setCountry]   = useState("");
  const [phone,     setPhone]     = useState("");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) requireAuth(); }, [mounted]);
  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setCountry((user as any).country ?? "");
      setPhone((user as any).phone ?? "");
    }
  }, [user]);

  if (!mounted) return null;

  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: `0.5px solid ${theme.border}`, borderRadius: 8,
    padding: isMobile ? "10px 12px" : "0.75rem 1rem",
    fontSize: isMobile ? "0.875rem" : "0.9375rem",
    color: theme.text, outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Source Serif 4', Georgia, serif",
    opacity: saving ? 0.5 : 1,
  };

  const readOnlyStyle: React.CSSProperties = {
    ...inputStyle,
    opacity: 0.4, cursor: "not-allowed",
    background: "rgba(255,255,255,0.02)",
  };

  async function handleSave() {
    if (!fullName.trim()) { setError("Full name cannot be empty."); return; }
    setSaving(true); setError(null); setSuccess(false);
    try {
      await supabase.auth.updateUser({ data: { full_name: fullName.trim(), country, phone } });
      await authApi.updateProfile({ full_name: fullName.trim() });
      if (user) setUser({ ...user, full_name: fullName.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = fullName
    ? fullName.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const planLabel: Record<string, string> = {
    free:           "Free",
    beginner:       "Beginner — ₹249/mo",
    intermediate:   "Intermediate — ₹799/mo",
    pay_per_report: "Pay Per Report",
  };

  return (
    <div style={{
      color: theme.text,
      fontFamily: "'Source Serif 4', Georgia, serif",
      padding: isMobile ? "16px 14px" : "20px",
      paddingBottom: isMobile ? 88 : 20,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Breadcrumb — hidden on mobile */}
        {!isMobile && (
          <div style={{ ...mono, fontSize: 10, color: theme.textFaint, display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
            Home <span>›</span> <span style={{ color: theme.text }}>Profile</span>
          </div>
        )}

        {/* Page header */}
        <div style={{ marginBottom: isMobile ? 16 : 28 }}>
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: isMobile ? 20 : 26,
            fontWeight: 600, color: theme.text, margin: "0 0 4px",
          }}>
            Profile
          </h1>
          {!isMobile && (
            <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: 0 }}>
              Manage your account and preferences
            </p>
          )}
        </div>

        {/* Two-column layout on tablet/desktop */}
        <div style={{
          display: isMobile || isTablet ? "block" : "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 20,
          alignItems: "start",
        }}>

          {/* ── Left column ── */}
          <div>

            {/* Account section */}
            <Section title="Account" theme={theme} isMobile={isMobile}>
              <div style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                gap: isMobile ? 14 : 20,
                marginBottom: 20,
              }}>
                {/* Avatar */}
                <div style={{
                  width: isMobile ? 52 : 64,
                  height: isMobile ? 52 : 64,
                  borderRadius: 12, flexShrink: 0,
                  background: `${theme.accent}20`,
                  border: `2px solid ${theme.accent}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...mono, fontSize: isMobile ? 16 : 20,
                  fontWeight: 700, color: theme.accent,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: isMobile ? 16 : 18,
                    color: theme.text, marginBottom: 3,
                  }}>
                    {fullName || user?.full_name || "—"}
                  </div>
                  <div style={{ ...mono, fontSize: 11, color: theme.textMuted }}>
                    {user?.email}
                  </div>
                  <div style={{
                    display: "inline-block", marginTop: 6,
                    ...mono, fontSize: 9,
                    color: theme.accent, background: `${theme.accent}15`,
                    border: `0.5px solid ${theme.accent}30`,
                    padding: "2px 8px", borderRadius: 4,
                    letterSpacing: "0.06em",
                  }}>
                    {planLabel[user?.plan ?? "free"]}
                  </div>
                </div>
              </div>

              <Field label="EMAIL ADDRESS">
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    value={user?.email ?? ""}
                    readOnly
                    style={readOnlyStyle}
                  />
                  {!isMobile && (
                    <span style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)",
                      ...mono, fontSize: 9,
                      color: theme.textFaint, letterSpacing: "0.06em",
                    }}>
                      READ ONLY
                    </span>
                  )}
                </div>
              </Field>
            </Section>

            {/* Personal info */}
            <Section title="Personal Information" theme={theme} isMobile={isMobile}>
              {/* On mobile: 1 col. On tablet+: can use 2-col for name/country */}
              <div style={{
                display: !isMobile ? "grid" : "block",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}>
                <Field label="FULL NAME">
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    disabled={saving}
                    style={inputStyle}
                  />
                </Field>
                <Field label="COUNTRY">
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    disabled={saving}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="PHONE NUMBER (OPTIONAL)">
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={saving}
                  style={inputStyle}
                />
              </Field>

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: `${theme.danger}15`,
                  border: `0.5px solid ${theme.danger}30`,
                  borderRadius: 8, padding: "10px 14px",
                  ...mono, fontSize: 12, color: theme.danger,
                  marginBottom: 16,
                }}>
                  <span>⚠</span> {error}
                </div>
              )}
              {success && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#EAF3DE",
                  border: "0.5px solid #3B6D1140",
                  borderRadius: 8, padding: "10px 14px",
                  ...mono, fontSize: 12, color: "#3B6D11",
                  marginBottom: 16,
                }}>
                  <span>✓</span> Profile saved successfully
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || authLoading}
                style={{
                  width: isMobile ? "100%" : "auto",
                  padding: "11px 28px",
                  background: theme.accent, border: "none",
                  borderRadius: 8,
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 14, fontWeight: 600, color: theme.accentText,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  display: "flex", alignItems: "center",
                  justifyContent: isMobile ? "center" : "flex-start",
                  gap: 8,
                  transition: "opacity 0.15s",
                }}
              >
                {saving ? (
                  <>
                    <span style={{
                      width: 14, height: 14,
                      border: `2px solid ${theme.accentText}40`,
                      borderTopColor: theme.accentText,
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                      display: "inline-block",
                    }} />
                    Saving…
                  </>
                ) : "Save changes"}
              </button>
            </Section>

            {/* Account actions — on mobile, inline with main column */}
            {isMobile && (
              <Section title="Account Actions" theme={theme} isMobile={isMobile}>
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 13,
                  color: theme.textMuted, margin: "0 0 14px", lineHeight: 1.6,
                }}>
                  Sign out of your account on this device.
                </p>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/login";
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 20px",
                    background: "transparent",
                    border: `0.5px solid ${theme.danger}40`,
                    borderRadius: 8,
                    ...mono, fontSize: 12, letterSpacing: "0.04em",
                    color: theme.danger, cursor: "pointer",
                  }}
                >
                  Sign out →
                </button>
              </Section>
            )}
          </div>

          {/* ── Right column (tablet/desktop) or inline (mobile) ── */}
          <div>

            {/* Appearance */}
            <Section title="Appearance" theme={theme} isMobile={isMobile}>
              <p style={{
                fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 13,
                color: theme.textMuted, margin: "0 0 14px", lineHeight: 1.6,
              }}>
                Choose how FinSight looks. Saved automatically.
              </p>
              {/* On mobile: 2-col theme grid to save space */}
              <div style={{
                display: isMobile ? "grid" : "flex",
                gridTemplateColumns: "1fr 1fr",
                flexDirection: "column",
                gap: 8,
              }}>
                {(Object.keys(THEMES) as ThemeId[]).map(id => (
                  <ThemeOption
                    key={id}
                    id={id}
                    label={THEMES[id].name}
                    active={themeId === id}
                    bg={THEMES[id].bg}
                    accent={THEMES[id].accent}
                    onSelect={() => setTheme(id)}
                  />
                ))}
              </div>
            </Section>

            {/* Subscription */}
            <Section title="Subscription" theme={theme} isMobile={isMobile}>
              <div style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                gap: 12,
              }}>
                <div>
                  <div style={{
                    fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15,
                    color: theme.text, marginBottom: 4,
                  }}>
                    {planLabel[user?.plan ?? "free"]}
                  </div>
                  <div style={{ ...mono, fontSize: 11, color: theme.textMuted }}>
                    {user?.plan === "free"
                      ? "Upgrade to access full reports and AI chat"
                      : user?.plan_expires_at
                      ? `Renews ${new Date(user.plan_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                      : "Active subscription"}
                  </div>
                </div>
                <a
                  href="/subscribe"
                  style={{
                    display: "inline-block",
                    width: isMobile ? "100%" : "auto",
                    textAlign: "center",
                    background: user?.plan === "free" ? theme.accent : "transparent",
                    color: user?.plan === "free" ? theme.accentText : theme.accent,
                    border: `0.5px solid ${theme.accent}`,
                    ...mono, fontSize: 11, letterSpacing: "0.04em",
                    padding: "9px 18px",
                    borderRadius: 6, textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.plan === "free" ? "Upgrade →" : "Manage plan →"}
                </a>
              </div>
            </Section>

            {/* Account actions — desktop/tablet only */}
            {!isMobile && (
              <Section title="Account Actions" theme={theme}>
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 13,
                  color: theme.textMuted, margin: "0 0 16px", lineHeight: 1.6,
                }}>
                  Sign out of your account on this device.
                </p>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/login";
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: `0.5px solid ${theme.danger}40`,
                    borderRadius: 8,
                    ...mono, fontSize: 11, letterSpacing: "0.04em",
                    color: theme.danger, cursor: "pointer",
                  }}
                >
                  Sign out →
                </button>
              </Section>
            )}
          </div>
        </div>

        {/* Legal */}
        <p style={{
          ...mono, fontSize: 10, color: theme.textFaint,
          textAlign: "center", letterSpacing: "0.04em",
          paddingTop: 16, marginTop: 8,
          borderTop: `0.5px solid ${theme.border}`,
        }}>
          Educational research only. Not financial advice.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${theme.textFaint}; }
        input:focus { border-color: ${theme.accent}80 !important; }
      `}</style>
    </div>
  );
}