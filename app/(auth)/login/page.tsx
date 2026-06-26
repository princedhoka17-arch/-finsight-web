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

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useThemeStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const width = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email first. Check your inbox for the confirmation link.");
      } else if (authError.message.toLowerCase().includes("invalid login credentials")) {
        setError("Incorrect email or password.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    if (data.session) {
      router.refresh();
      router.push("/dashboard");
    } else {
      setError("Login succeeded but no session was returned. Please try again.");
      setLoading(false);
    }
  }

  // Responsive values
  const cardPadding = isMobile ? "1.5rem" : isTablet ? "2rem" : "2.5rem";
  const cardMaxWidth = isMobile ? "100%" : "420px";
  const cardBorderRadius = isMobile ? "16px" : "20px";
  const headingSize = isMobile ? "1.35rem" : "1.6rem";
  const inputFontSize = isMobile ? "1rem" : "0.9375rem"; // 16px on mobile prevents iOS zoom
  const inputPadding = isMobile ? "0.8rem 1rem" : "0.75rem 1rem";
  const submitPadding = isMobile ? "0.9375rem" : "0.875rem";

  return (
    <div style={{
      minHeight: "100dvh", // use dynamic viewport height on mobile
      display: "flex",
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "center",
      padding: isMobile ? "1rem" : isTablet ? "1.5rem" : "1.5rem",
      paddingTop: isMobile ? "2rem" : undefined,
      paddingBottom: isMobile ? "2rem" : undefined,
      background: theme.bg,
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Source Serif 4', Georgia, serif",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(${theme.accent}10 1px, transparent 1px),
          linear-gradient(90deg, ${theme.accent}10 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Glow — smaller on mobile */}
      <div style={{
        position: "absolute",
        top: "-20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? "300px" : "600px",
        height: isMobile ? "250px" : "400px",
        background: `radial-gradient(ellipse at center, ${theme.accent}25 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: cardMaxWidth,
        background: theme.bgSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: cardBorderRadius,
        padding: cardPadding,
        backdropFilter: "blur(12px)",
        boxShadow: isMobile
          ? `0 0 0 1px ${theme.accent}18, 0 8px 32px rgba(0,0,0,0.25)`
          : `0 0 0 1px ${theme.accent}18, 0 32px 64px rgba(0,0,0,0.4)`,
      }}>
        {/* Brand */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: isMobile ? "1.5rem" : "2rem",
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            background: theme.accent,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: theme.accentText,
            letterSpacing: "0.05em",
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            flexShrink: 0,
          }}>
            FS
          </div>
          <span style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: theme.text,
            letterSpacing: "0.08em",
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          }}>
            FIN<span style={{ color: theme.accent }}>SIGHT</span>
          </span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: isMobile ? "1.5rem" : "2rem" }}>
          <h1 style={{
            fontSize: headingSize,
            fontWeight: 700,
            color: theme.text,
            letterSpacing: "-0.03em",
            margin: "0 0 0.4rem",
            lineHeight: 1.2,
          }}>
            Welcome back
          </h1>
          <p style={{
            fontSize: isMobile ? "0.8125rem" : "0.875rem",
            color: theme.textMuted,
            margin: 0,
          }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} noValidate style={{
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "1rem" : "1.25rem",
        }}>
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: theme.textMuted,
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              letterSpacing: "0.04em",
            }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              autoComplete="email"
              autoFocus={!isMobile} // avoid keyboard pop on mobile page load
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${theme.border}`,
                borderRadius: "10px",
                padding: inputPadding,
                fontSize: inputFontSize, // 16px on mobile prevents iOS zoom-on-focus
                color: theme.text,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'Source Serif 4', Georgia, serif",
                opacity: loading ? 0.5 : 1,
                // Improve tap target on mobile
                minHeight: isMobile ? "48px" : undefined,
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <label style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: theme.textMuted,
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                letterSpacing: "0.04em",
              }}>
                PASSWORD
              </label>
              <Link href="/forgot-password" style={{
                fontSize: isMobile ? "0.75rem" : "0.8125rem",
                color: theme.accent,
                textDecoration: "none",
                // Larger tap target
                padding: isMobile ? "0.25rem 0" : undefined,
              }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  padding: isMobile ? "0.8rem 3rem 0.8rem 1rem" : "0.75rem 2.75rem 0.75rem 1rem",
                  fontSize: inputFontSize,
                  color: theme.text,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  opacity: loading ? 0.5 : 1,
                  minHeight: isMobile ? "48px" : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: theme.textMuted,
                  cursor: "pointer",
                  // Bigger tap target on mobile
                  padding: isMobile ? "0.5rem" : "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: isMobile ? "44px" : undefined,
                  minHeight: isMobile ? "44px" : undefined,
                }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              background: `${theme.danger}18`,
              border: `1px solid ${theme.danger}40`,
              borderRadius: "8px",
              padding: "0.65rem 0.875rem",
              fontSize: isMobile ? "0.75rem" : "0.8125rem",
              color: theme.danger,
              lineHeight: 1.5,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: "100%",
              padding: submitPadding,
              background: theme.accent,
              border: "none",
              borderRadius: "10px",
              fontSize: isMobile ? "0.9375rem" : "0.9375rem",
              fontWeight: 700,
              color: theme.accentText,
              cursor: loading || !email || !password ? "not-allowed" : "pointer",
              opacity: loading || !email || !password ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontFamily: "'Source Serif 4', Georgia, serif",
              letterSpacing: "0.02em",
              transition: "opacity 0.15s",
              marginTop: "0.25rem",
              // Tall enough for comfortable tap
              minHeight: isMobile ? "50px" : undefined,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: "14px",
                  height: "14px",
                  border: `2px solid ${theme.accentText}40`,
                  borderTopColor: theme.accentText,
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                  display: "inline-block",
                }} />
                Signing in…
              </>
            ) : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          marginTop: isMobile ? "1.25rem" : "1.75rem",
          textAlign: "center",
          fontSize: isMobile ? "0.8125rem" : "0.875rem",
          color: theme.textMuted,
        }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{
            color: theme.accent,
            textDecoration: "none",
            fontWeight: 600,
          }}>
            Create one free
          </Link>
        </p>

        {/* Legal */}
        <p style={{
          marginTop: "1rem",
          textAlign: "center",
          fontSize: "0.6875rem",
          color: theme.textFaint,
          lineHeight: 1.5,
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
        /* Remove tap highlight on mobile buttons */
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}