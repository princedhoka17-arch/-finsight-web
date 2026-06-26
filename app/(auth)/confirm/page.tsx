"use client";

import { useEffect, useState } from "react";
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

type Status = "verifying" | "success" | "error";

export default function ConfirmPage() {
  const { theme }   = useThemeStore();
  const router      = useRouter();
  const [status,  setStatus]  = useState<Status>("verifying");
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const width    = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    async function verify() {
      const params     = new URLSearchParams(window.location.search);
      const token_hash = params.get("token_hash");
      const type       = params.get("type") as any;

      if (!token_hash || !type) {
        setStatus("error");
        setMessage("Invalid confirmation link. Please request a new one.");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({ token_hash, type });

      if (error) {
        setStatus("error");
        setMessage(error.message ?? "Confirmation failed. The link may have expired.");
        return;
      }

      setStatus("success");

      // Redirect after short delay so user sees the success state
      setTimeout(() => {
        if (type === "recovery") {
          router.push("/reset-password");
        } else {
          router.push("/onboarding");
        }
      }, 2000);
    }

    verify();
  }, [mounted, router]);

  const cardPadding = isMobile ? "1.5rem 1.25rem" : isTablet ? "2rem" : "2.5rem";
  const cardRadius  = isMobile ? "16px" : "20px";
  const cardShadow  = isMobile
    ? `0 0 0 1px ${theme.accent}18, 0 8px 24px rgba(0,0,0,0.25)`
    : `0 0 0 1px ${theme.accent}18, 0 32px 64px rgba(0,0,0,0.4)`;

  const pageStyle: React.CSSProperties = {
    minHeight: "100dvh",
    display: "flex",
    alignItems: isMobile ? "flex-start" : "center",
    justifyContent: "center",
    padding: isMobile ? "2rem 1rem" : "1.5rem",
    background: theme.bg,
    fontFamily: "'Source Serif 4', Georgia, serif",
    position: "relative",
    overflow: "hidden",
  };

  if (!mounted) return null;

  return (
    <div style={pageStyle}>
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
        textAlign: "center",
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

        {/* ── Verifying ── */}
        {status === "verifying" && (
          <>
            <div style={{
              width: isMobile ? "48px" : "56px",
              height: isMobile ? "48px" : "56px",
              background: `${theme.accent}20`,
              border: `1px solid ${theme.accent}40`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <span style={{
                width: "20px", height: "20px",
                border: `2px solid ${theme.accent}40`,
                borderTopColor: theme.accent,
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
                display: "inline-block",
              }} />
            </div>
            <h2 style={{
              fontSize: isMobile ? "1.25rem" : "1.4rem",
              fontWeight: 700, color: theme.text, margin: "0 0 0.75rem",
            }}>
              Confirming your email
            </h2>
            <p style={{
              fontSize: isMobile ? "0.875rem" : "0.9rem",
              color: theme.textMuted, lineHeight: 1.6, margin: 0,
            }}>
              Please wait a moment…
            </p>
          </>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <>
            <div style={{
              width: isMobile ? "48px" : "56px",
              height: isMobile ? "48px" : "56px",
              background: "#EAF3DE",
              border: "1px solid #3B6D1140",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{
              fontSize: isMobile ? "1.25rem" : "1.4rem",
              fontWeight: 700, color: theme.text, margin: "0 0 0.75rem",
            }}>
              Email confirmed!
            </h2>
            <p style={{
              fontSize: isMobile ? "0.875rem" : "0.9rem",
              color: theme.textMuted, lineHeight: 1.6, margin: "0 0 0.5rem",
            }}>
              Your account is verified. Redirecting you now…
            </p>
          </>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <>
            <div style={{
              width: isMobile ? "48px" : "56px",
              height: isMobile ? "48px" : "56px",
              background: "#FAECE7",
              border: "1px solid #B0503F40",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#B0503F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{
              fontSize: isMobile ? "1.25rem" : "1.4rem",
              fontWeight: 700, color: theme.text, margin: "0 0 0.75rem",
            }}>
              Confirmation failed
            </h2>
            <p style={{
              fontSize: isMobile ? "0.875rem" : "0.9rem",
              color: theme.textMuted, lineHeight: 1.6, margin: "0 0 1.5rem",
            }}>
              {message}
            </p>
            <Link href="/login" style={{
              display: "inline-block",
              padding: "0.875rem 1.5rem",
              background: theme.accent,
              border: "none", borderRadius: "10px",
              fontSize: "0.9375rem", fontWeight: 700,
              color: theme.accentText,
              textDecoration: "none",
              fontFamily: "'Source Serif 4', Georgia, serif",
              letterSpacing: "0.02em",
            }}>
              Back to login
            </Link>
          </>
        )}

        <p style={{
          marginTop: "1.75rem", fontSize: "0.6875rem", color: theme.textFaint,
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          letterSpacing: "0.04em", lineHeight: 1.5,
        }}>
          Educational research only. Not financial advice.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}