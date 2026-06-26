"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useThemeStore } from "@/store/useThemeStore";
import { supabase } from "@/lib/supabase";

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

export default function SignupPage() {
  const { theme } = useThemeStore();

  const width    = useWindowWidth();
  const isMobile = width > 0 && width < 640;

  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [confirmed,       setConfirmed]       = useState(false);
  const [mounted,         setMounted]         = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // ── Password strength ─────────────────────────────────────────
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", theme.danger, "#f59e0b", theme.success, theme.accent][passwordStrength];

  // ── Submit ────────────────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (authError) {
      setError(
        authError.message.toLowerCase().includes("already registered")
          ? "An account with this email already exists. Try signing in."
          : authError.message
      );
      setLoading(false);
      return;
    }

    if (data.user) setConfirmed(true);
    setLoading(false);
  }

  // ── Shared styles ─────────────────────────────────────────────
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${theme.border}`,
    borderRadius: "10px",
    padding: isMobile ? "0.7rem 2.75rem 0.7rem 0.875rem" : "0.75rem 2.75rem 0.75rem 1rem",
    fontSize: isMobile ? "1rem" : "0.9375rem", // 1rem prevents iOS zoom on focus
    color: theme.text,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "'Source Serif 4', Georgia, serif",
    opacity: loading ? 0.5 : 1,
  };

  const labelStyle: React.CSSProperties = {
    ...mono, fontSize: "0.6875rem", color: theme.textMuted,
  };

  const eyeBtn: React.CSSProperties = {
    position: "absolute", right: "0.75rem", top: "50%",
    transform: "translateY(-50%)", background: "none", border: "none",
    color: theme.textMuted, cursor: "pointer",
    padding: "0.25rem", display: "flex", alignItems: "center",
    // Larger tap target on mobile
    minWidth: 32, minHeight: 32, justifyContent: "center",
  };

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  // ── Confirmation screen ───────────────────────────────────────
  if (confirmed) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: theme.bg, fontFamily: "'Source Serif 4', Georgia, serif",
        padding: isMobile ? "1rem" : "1.5rem",
      }}>
        <div style={{
          width: "100%", maxWidth: "420px",
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: isMobile ? "16px" : "20px",
          padding: isMobile ? "2rem 1.5rem" : "2.5rem",
          textAlign: "center",
          boxShadow: `0 0 0 1px ${theme.accent}18, 0 32px 64px rgba(0,0,0,0.4)`,
        }}>
          <div style={{
            width: "56px", height: "56px",
            background: `${theme.accent}20`,
            border: `1px solid ${theme.accent}40`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem", fontSize: "1.5rem", color: theme.accent,
          }}>
            ✦
          </div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: theme.text, margin: "0 0 0.75rem" }}>
            Check your email
          </h1>
          <p style={{ fontSize: "0.875rem", color: theme.textMuted, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            We sent a confirmation link to{" "}
            <strong style={{ color: theme.accent }}>{email}</strong>.
            Click it to activate your account.
          </p>
          <p style={{ ...mono, fontSize: "0.75rem", color: theme.textFaint }}>
            Didn&apos;t receive it? Check your spam folder.
          </p>
          <Link href="/login" style={{
            display: "inline-block", marginTop: "1.5rem",
            color: theme.accent, fontSize: "0.875rem",
            textDecoration: "none", fontWeight: 600,
          }}>
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center",
      // On mobile: align to top with padding so keyboard doesn't push content off-screen
      padding: isMobile ? "1.5rem 1rem 2rem" : "1.5rem",
      background: theme.bg, position: "relative",
      overflow: "hidden", fontFamily: "'Source Serif 4', Georgia, serif",
    }}>
      {/* Background grid — toned down on mobile for perf */}
      {!isMobile && (
        <>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `linear-gradient(${theme.accent}10 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}10 1px, transparent 1px)`,
            backgroundSize: "40px 40px", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: "-20%", left: "50%",
            transform: "translateX(-50%)", width: "600px", height: "400px",
            background: `radial-gradient(ellipse at center, ${theme.accent}20 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
        </>
      )}

      {/* Card — edge-to-edge feel on mobile */}
      <div style={{
        position: "relative", width: "100%", maxWidth: "420px",
        background: theme.bgSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: isMobile ? "16px" : "20px",
        padding: isMobile ? "1.75rem 1.25rem" : "2.5rem",
        boxShadow: isMobile
          ? "none"
          : `0 0 0 1px ${theme.accent}18, 0 32px 64px rgba(0,0,0,0.4)`,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.75rem" }}>
          <div style={{
            width: "30px", height: "30px", background: theme.accent,
            borderRadius: "7px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "10px", fontWeight: 700,
            color: theme.accentText, ...mono,
          }}>
            FS
          </div>
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: theme.text, letterSpacing: "0.08em", ...mono }}>
            FIN<span style={{ color: theme.accent }}>SIGHT</span>
          </span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: isMobile ? "1.4rem" : "1.6rem",
            fontWeight: 700, color: theme.text, margin: "0 0 0.35rem",
          }}>
            Create your account
          </h1>
          <p style={{ fontSize: "0.875rem", color: theme.textMuted, margin: 0 }}>
            Start exploring financial reports for free
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input
              type="email" autoComplete="email" required
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={loading}
              style={{ ...inputStyle, padding: isMobile ? "0.7rem 0.875rem" : "0.75rem 1rem" }}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password" required
                placeholder="Min. 8 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                disabled={loading} style={inputStyle}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={eyeBtn}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {/* Strength bar */}
            {password && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.2rem" }}>
                <div style={{ display: "flex", gap: "4px", flex: 1 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      height: "3px", flex: 1, borderRadius: "2px",
                      background: i <= passwordStrength ? strengthColor : "rgba(255,255,255,0.08)",
                      transition: "background 0.2s",
                    }} />
                  ))}
                </div>
                <span style={{ ...mono, fontSize: "0.6875rem", color: strengthColor, minWidth: "36px" }}>
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>CONFIRM PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password" required
                placeholder="Re-enter your password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
                style={{
                  ...inputStyle,
                  borderColor: confirmPassword && confirmPassword !== password
                    ? theme.danger : undefined,
                }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeBtn}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <span style={{ ...mono, fontSize: "0.6875rem", color: theme.danger }}>
                Passwords do not match
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.5rem",
              background: `${theme.danger}18`, border: `1px solid ${theme.danger}40`,
              borderRadius: "8px", padding: "0.65rem 0.875rem",
              ...mono, fontSize: "0.75rem", color: theme.danger,
            }}>
              <svg style={{ flexShrink: 0, marginTop: 1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password || !confirmPassword}
            style={{
              width: "100%",
              padding: isMobile ? "0.9rem" : "0.875rem",
              background: theme.accent, border: "none", borderRadius: "10px",
              fontSize: "0.9375rem", fontWeight: 700, color: theme.accentText,
              cursor: loading || !email || !password || !confirmPassword ? "not-allowed" : "pointer",
              opacity: loading || !email || !password || !confirmPassword ? 0.5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              fontFamily: "'Source Serif 4', Georgia, serif",
              transition: "opacity 0.15s", marginTop: "0.25rem",
              // Larger tap target on mobile
              minHeight: isMobile ? "48px" : "auto",
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
                Creating account…
              </>
            ) : "Create account →"}
          </button>

          <p style={{
            textAlign: "center", ...mono, fontSize: "0.6875rem",
            color: theme.textFaint, margin: 0, lineHeight: 1.6,
          }}>
            By signing up you agree to our{" "}
            <Link href="/terms" style={{ color: theme.accent, textDecoration: "none" }}>Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" style={{ color: theme.accent, textDecoration: "none" }}>Privacy Policy</Link>
          </p>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: theme.textMuted }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: theme.accent, textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>

        <p style={{
          marginTop: "1rem", textAlign: "center",
          ...mono, fontSize: "0.625rem", color: theme.textFaint, lineHeight: 1.5,
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