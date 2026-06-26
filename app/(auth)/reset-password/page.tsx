"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useThemeStore } from "@/store/useThemeStore";
import { supabase } from "@/lib/supabase";

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

export default function ResetPasswordPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const width    = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  useEffect(() => { setMounted(true); }, []);

  // Redirect to dashboard after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push("/dashboard"), 2500);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (!mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  // Shared responsive values
  const cardPadding     = isMobile ? "1.5rem 1.25rem" : isTablet ? "2rem" : "2.5rem";
  const cardRadius      = isMobile ? "16px" : "20px";
  const cardShadow      = isMobile
    ? `0 0 0 1px ${theme.accent}18, 0 8px 24px rgba(0,0,0,0.25)`
    : `0 0 0 1px ${theme.accent}18, 0 32px 64px rgba(0,0,0,0.4)`;
  const headingSize     = isMobile ? "1.35rem" : "1.6rem";
  const inputFontSize   = isMobile ? "1rem" : "0.9375rem";
  const inputPadding    = isMobile ? "0.8rem 1rem" : "0.75rem 1rem";
  const inputMinHeight  = isMobile ? "48px" : undefined;
  const submitMinHeight = isMobile ? "50px" : undefined;

  const pageStyle: React.CSSProperties = {
    minHeight: "100dvh",
    display: "flex",
    alignItems: isMobile ? "flex-start" : "center",
    justifyContent: "center",
    padding: isMobile ? "2rem 1rem" : "1.5rem",
    background: theme.bg,
    fontFamily: "'Source Serif 4', Georgia, serif",
  };

  // ── Success state ──────────────────────────────────────────────
  if (success) {
    return (
      <div style={pageStyle}>
        <div style={{
          width: "100%", maxWidth: "420px",
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: cardRadius,
          padding: cardPadding,
          textAlign: "center",
          boxShadow: cardShadow,
        }}>
          <div style={{
            width: isMobile ? "48px" : "56px",
            height: isMobile ? "48px" : "56px",
            background: `${theme.success}20`,
            border: `1px solid ${theme.success}40`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke={theme.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 style={{
            fontSize: isMobile ? "1.25rem" : "1.4rem",
            fontWeight: 700, color: theme.text, margin: "0 0 0.75rem",
          }}>
            Password updated
          </h2>
          <p style={{
            fontSize: isMobile ? "0.875rem" : "0.9rem",
            color: theme.textMuted, lineHeight: 1.6, margin: "0 0 1.5rem",
          }}>
            Your password has been changed successfully. Redirecting you to the dashboard…
          </p>

          <Link href="/dashboard" style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: "0.8125rem", color: theme.accent,
            textDecoration: "none", letterSpacing: "0.04em",
            display: "inline-block", padding: isMobile ? "0.5rem 0" : 0,
          }}>
            Go to dashboard →
          </Link>

          <p style={{
            marginTop: "1.5rem", fontSize: "0.6875rem", color: theme.textFaint,
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            letterSpacing: "0.04em", lineHeight: 1.5,
          }}>
            Educational research only. Not financial advice.
          </p>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────
  return (
    <div style={{
      ...pageStyle,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${theme.accent}10 1px, transparent 1px),
          linear-gradient(90deg, ${theme.accent}10 1px, transparent 1px)`,
        backgroundSize: "40px 40px", pointerEvents: "none",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute", top: "-20%", left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? "280px" : "600px",
        height: isMobile ? "220px" : "400px",
        background: `radial-gradient(ellipse at center, ${theme.accent}20 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        position: "relative", width: "100%", maxWidth: "420px",
        background: theme.bgSecondary, border: `1px solid ${theme.border}`,
        borderRadius: cardRadius, padding: cardPadding,
        backdropFilter: "blur(12px)", boxShadow: cardShadow,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: isMobile ? "1.5rem" : "2rem" }}>
          <div style={{
            width: "32px", height: "32px", background: theme.accent,
            borderRadius: "8px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "11px", fontWeight: 700,
            color: theme.accentText, letterSpacing: "0.05em",
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            flexShrink: 0,
          }}>FS</div>
          <span style={{
            fontSize: "1rem", fontWeight: 700, color: theme.text,
            letterSpacing: "0.08em",
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          }}>
            FIN<span style={{ color: theme.accent }}>SIGHT</span>
          </span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: isMobile ? "1.5rem" : "2rem" }}>
          <h1 style={{
            fontSize: headingSize, fontWeight: 700, color: theme.text,
            letterSpacing: "-0.03em", margin: "0 0 0.4rem", lineHeight: 1.2,
          }}>
            Set new password
          </h1>
          <p style={{ fontSize: isMobile ? "0.8125rem" : "0.875rem", color: theme.textMuted, margin: 0 }}>
            Choose a strong password for your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{
          display: "flex", flexDirection: "column",
          gap: isMobile ? "1rem" : "1.25rem",
        }}>
          {/* New password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{
              fontSize: "0.75rem", fontWeight: 500, color: theme.textMuted,
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              letterSpacing: "0.04em",
            }}>
              NEW PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                autoFocus={!isMobile}
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  padding: inputPadding,
                  paddingRight: "2.75rem",
                  fontSize: inputFontSize,
                  color: theme.text,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  opacity: loading ? 0.5 : 1,
                  minHeight: inputMinHeight,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: theme.textMuted, padding: "0.25rem",
                  display: "flex", alignItems: "center",
                }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{
              fontSize: "0.75rem", fontWeight: 500, color: theme.textMuted,
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              letterSpacing: "0.04em",
            }}>
              CONFIRM PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    confirmPassword && confirmPassword !== password
                      ? theme.danger
                      : theme.border
                  }`,
                  borderRadius: "10px",
                  padding: inputPadding,
                  paddingRight: "2.75rem",
                  fontSize: inputFontSize,
                  color: theme.text,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  opacity: loading ? 0.5 : 1,
                  minHeight: inputMinHeight,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: theme.textMuted, padding: "0.25rem",
                  display: "flex", alignItems: "center",
                }}
              >
                {showConfirm ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p style={{
                fontSize: "0.75rem", color: theme.danger,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.03em", margin: 0,
              }}>
                Passwords don't match
              </p>
            )}
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.5rem",
              background: `${theme.danger}18`, border: `1px solid ${theme.danger}40`,
              borderRadius: "8px", padding: "0.65rem 0.875rem",
              fontSize: isMobile ? "0.75rem" : "0.8125rem", color: theme.danger,
              lineHeight: 1.5,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: "2px" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            style={{
              width: "100%",
              padding: isMobile ? "0.9375rem" : "0.875rem",
              background: theme.accent, border: "none", borderRadius: "10px",
              fontSize: "0.9375rem", fontWeight: 700, color: theme.accentText,
              cursor: loading || !password || !confirmPassword ? "not-allowed" : "pointer",
              opacity: loading || !password || !confirmPassword ? 0.5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", fontFamily: "'Source Serif 4', Georgia, serif",
              letterSpacing: "0.02em", transition: "opacity 0.15s",
              marginTop: "0.25rem", minHeight: submitMinHeight,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: "14px", height: "14px",
                  border: `2px solid ${theme.accentText}40`,
                  borderTopColor: theme.accentText, borderRadius: "50%",
                  animation: "spin 0.6s linear infinite", display: "inline-block",
                }} />
                Updating…
              </>
            ) : "Update password"}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          marginTop: isMobile ? "1.25rem" : "1.75rem",
          textAlign: "center",
          fontSize: isMobile ? "0.8125rem" : "0.875rem",
          color: theme.textMuted,
        }}>
          Remember your password?{" "}
          <Link href="/login" style={{ color: theme.accent, textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>

        <p style={{
          marginTop: "1rem", textAlign: "center", fontSize: "0.6875rem",
          color: theme.textFaint, lineHeight: 1.5,
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          letterSpacing: "0.04em",
        }}>
          Educational research only. Not financial advice.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${theme.textFaint}; }
        input:focus { border-color: ${theme.accent}80 !important; }
        a:hover { opacity: 0.8; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}