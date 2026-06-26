"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useThemeStore } from "@/store/useThemeStore";

// ─── Window width hook ────────────────────────────────────────────
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

// ─── Ticker data ──────────────────────────────────────────────────
const TICKERS = [
  { symbol: "RELIANCE",    change: "+2.4%", price: "₹2,847",  up: true  },
  { symbol: "TCS",         change: "+1.1%", price: "₹3,412",  up: true  },
  { symbol: "HDFC BANK",   change: "-0.3%", price: "₹1,623",  up: false },
  { symbol: "INFOSYS",     change: "+0.8%", price: "₹1,789",  up: true  },
  { symbol: "WIPRO",       change: "+1.9%", price: "₹456",    up: true  },
  { symbol: "BAJAJ FIN",   change: "+3.2%", price: "₹6,721",  up: true  },
  { symbol: "ICICI BANK",  change: "+0.6%", price: "₹1,234",  up: true  },
  { symbol: "MARUTI",      change: "-1.2%", price: "₹12,340", up: false },
  { symbol: "ITC",         change: "+0.5%", price: "₹487",    up: true  },
  { symbol: "ASIAN PAINTS",change: "-0.7%", price: "₹3,102",  up: false },
];

// ─── Plans ────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Beginner",
    price: "₹249", period: "/month", yearlyNote: "₹2,499/year",
    highlight: false,
    features: [
      "5 reports per month",
      "20 AI questions per report",
      "Watchlist — 5 companies",
      "Beginner-friendly summaries",
      "Risk level badges",
    ],
    cta: "Get started", href: "/signup",
  },
  {
    name: "Intermediate",
    price: "₹799", period: "/month", yearlyNote: "₹7,999/year — save 17%",
    highlight: true,
    features: [
      "13 reports per month",
      "Unlimited AI chat",
      "Watchlist — 15 companies",
      "Daily updates — 3 companies",
      "Full financial analysis",
      "Earnings call summaries",
    ],
    cta: "Get started", href: "/signup",
  },
  {
    name: "Pay Per Report",
    price: "₹149", period: "/report", yearlyNote: "No subscription required",
    highlight: false,
    features: [
      "Single report — 30-day access",
      "10 AI questions included",
      "Risk analysis included",
      "No commitment needed",
    ],
    cta: "Buy a report", href: "/signup",
  },
];

// ─── How it works ─────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Our team reads the reports",
    desc: "We read dense 300-page annual reports, earnings calls and investor presentations so you don't have to.",
  },
  {
    step: "02",
    title: "AI creates a simple summary",
    desc: "GPT-4o extracts the key information — financials, risks, growth drivers — and explains it in plain English.",
  },
  {
    step: "03",
    title: "You read, ask, and decide",
    desc: "Browse structured summaries, ask the AI anything about the report, and form your own view.",
  },
];

// ─── User types ───────────────────────────────────────────────────
const USER_TYPES = [
  {
    icon: "◎",
    title: "First-time investors",
    desc: "You've heard of stocks but find annual reports intimidating. FinSight translates financial jargon into plain English.",
  },
  {
    icon: "◈",
    title: "Self-directed investors",
    desc: "You follow markets but don't have time to read every filing. Get the key facts in 5 minutes.",
  },
  {
    icon: "◉",
    title: "Finance students",
    desc: "Use FinSight as a study tool — compare companies, understand business models, track sector trends.",
  },
];

// ─── Floating report card ─────────────────────────────────────────
function FloatingReportCard({
  accent, border, bg, text, textMuted, textFaint, success, danger, compact,
}: {
  accent: string; border: string; bg: string; text: string;
  textMuted: string; textFaint: string; success: string; danger: string;
  compact?: boolean;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${border}`,
      borderRadius: 16,
      padding: compact ? "16px" : "20px",
      width: "100%",
      maxWidth: compact ? 340 : 320,
      boxShadow: `0 0 0 1px ${accent}18, 0 24px 48px rgba(0,0,0,0.5)`,
      backdropFilter: "blur(12px)",
    }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `${accent}20`, border: `1px solid ${accent}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          fontSize: 11, fontWeight: 700, color: accent,
        }}>
          TCS
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 13, color: text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Tata Consultancy Services
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, color: textFaint }}>
            Annual Report FY2024
          </div>
        </div>
        <div style={{
          background: `${success}18`, border: `1px solid ${success}30`,
          borderRadius: 4, padding: "2px 8px", flexShrink: 0,
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, color: success,
        }}>
          Low Risk
        </div>
      </div>

      {/* AI Score */}
      <div style={{
        background: `${accent}08`, border: `1px solid ${accent}20`,
        borderRadius: 8, padding: "10px 12px", marginBottom: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, letterSpacing: "0.08em", color: textMuted }}>
            AI SCORE
          </span>
          <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, color: accent }}>8.4</span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: border, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: "84%", height: "100%", background: accent, borderRadius: 2 }} />
        </div>
      </div>

      {/* Metrics */}
      {[
        { label: "Revenue Growth",    value: "+18.3%", color: success },
        { label: "Net Profit Margin", value: "26.1%",  color: success },
        { label: "Debt-to-Equity",    value: "0.04",   color: success },
        { label: "EPS Growth",        value: "+12.8%", color: success },
      ].map(row => (
        <div key={row.label} style={{
          display: "flex", justifyContent: "space-between",
          padding: "5px 0", borderBottom: `1px solid ${border}`,
        }}>
          <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, color: textMuted }}>
            {row.label}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, color: row.color, fontWeight: 700 }}>
            {row.value}
          </span>
        </div>
      ))}

      {/* AI chat preview — hidden on very compact */}
      {!compact && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            background: "rgba(255,255,255,0.03)", border: `1px solid ${border}`,
            borderRadius: 8, padding: "10px 12px",
          }}>
            <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 11, color: textMuted, marginBottom: 6 }}>
              💬 &ldquo;What are TCS&apos;s biggest revenue risks?&rdquo;
            </div>
            <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 11, color: text, lineHeight: 1.6 }}>
              TCS earns 54% of revenue from North America. A slowdown in US tech spending directly impacts growth…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  const width    = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const { bg, bgSecondary, accent, accentText, text, textMuted, textFaint, border, success, danger } = theme;

  const sectionPad = isMobile ? "64px 16px" : isTablet ? "72px 24px" : "96px 32px";
  const h2Size = isMobile ? "22px" : isTablet ? "28px" : "clamp(24px, 4vw, 38px)";

  return (
    <div style={{ background: bg, color: text, fontFamily: "'Source Serif 4', Georgia, serif", overflowX: "hidden" }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 16px" : "0 32px", height: 56,
        background: `${bg}e8`, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${border}`,
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", color: text,
          }}>
            FIN<span style={{ color: accent }}>SIGHT</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 13,
              color: textMuted, textDecoration: "none", letterSpacing: "0.04em",
              padding: "7px 16px", borderRadius: 7, border: "1px solid transparent",
            }}>
              Sign in
            </Link>
            <Link href="/signup" style={{
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 13,
              color: accentText, textDecoration: "none", letterSpacing: "0.04em",
              padding: "7px 18px", borderRadius: 7,
              background: accent, border: `1px solid ${accent}`, fontWeight: 700,
            }}>
              Get started →
            </Link>
          </div>
        )}

        {/* Mobile: compact CTA only */}
        {isMobile && (
          <Link href="/signup" style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 12,
            color: accentText, textDecoration: "none", letterSpacing: "0.04em",
            padding: "6px 14px", borderRadius: 7,
            background: accent, fontWeight: 700,
          }}>
            Start free →
          </Link>
        )}
      </nav>

      {/* ── Ticker bar ──────────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 56, left: 0, right: 0, zIndex: 99,
        background: `${bg}f0`, borderBottom: `1px solid ${border}`,
        overflow: "hidden", height: 30,
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          animation: `ticker ${isMobile ? "20s" : "30s"} linear infinite`,
          whiteSpace: "nowrap",
        }}>
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <div key={i} style={{
              display: "inline-flex", alignItems: "center", gap: isMobile ? 6 : 8,
              padding: isMobile ? "0 16px" : "0 28px", height: 30,
              borderRight: `1px solid ${border}`, flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 10 : 11, color: textMuted, letterSpacing: "0.06em" }}>
                {t.symbol}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 10 : 11, color: text, fontWeight: 600 }}>
                {t.price}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 10 : 11, color: t.up ? success : danger, fontWeight: 700 }}>
                {t.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100dvh",
        paddingTop: isMobile ? 110 : 116,
        paddingBottom: isMobile ? 48 : 80,
        paddingLeft: isMobile ? 16 : isTablet ? 24 : 32,
        paddingRight: isMobile ? 16 : isTablet ? 24 : 32,
        display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(${accent}0d 1px, transparent 1px), linear-gradient(90deg, ${accent}0d 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />
        {/* Glow */}
        <div style={{
          position: "absolute",
          top: isMobile ? "5%" : "10%",
          left: isMobile ? "0%" : "30%",
          width: isMobile ? "100%" : 600,
          height: isMobile ? 300 : 500,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at center, ${accent}18 0%, transparent 65%)`,
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative" }}>
          {/* Mobile/tablet: stacked; desktop: side-by-side */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr auto",
            gap: isMobile ? 40 : isTablet ? 48 : 60,
            alignItems: "center",
          }}>

            {/* Left — text */}
            <div style={{ maxWidth: isMobile ? "100%" : 600 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: `${accent}12`, border: `1px solid ${accent}30`,
                borderRadius: 20, padding: "5px 14px", marginBottom: isMobile ? 20 : 28,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: isMobile ? 10 : 11, color: accent, letterSpacing: "0.08em",
                }}>
                  AI-POWERED FINANCIAL RESEARCH
                </span>
              </div>

              <h1 style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: isMobile ? "28px" : isTablet ? "38px" : "clamp(32px, 5vw, 56px)",
                fontWeight: "normal", lineHeight: 1.2, color: text,
                margin: "0 0 16px", letterSpacing: "-0.02em",
              }}>
                Annual reports,{" "}
                <span style={{ color: accent }}>simplified</span>{" "}
                for every investor
              </h1>

              <p style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: isMobile ? 15 : 18, color: textMuted,
                lineHeight: 1.7, margin: "0 0 28px",
                maxWidth: isMobile ? "100%" : 520,
              }}>
                We read dense financial filings so you don&apos;t have to. Get AI-powered summaries,
                risk analysis, and ask any question about any report.
              </p>

              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                flexDirection: isMobile ? "column" : "row",
                flexWrap: "wrap",
              }}>
                <Link href="/signup" style={{
                  background: accent, color: accentText, textDecoration: "none",
                  fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, fontWeight: 700,
                  padding: isMobile ? "14px 28px" : "13px 28px", borderRadius: 9,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: isMobile ? "100%" : undefined,
                  minHeight: isMobile ? 50 : undefined,
                }}>
                  Start reading for free →
                </Link>
                <Link href="/login" style={{
                  color: textMuted, textDecoration: "none",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, letterSpacing: "0.04em",
                  padding: isMobile ? "13px 24px" : "13px 24px", borderRadius: 9,
                  border: `1px solid ${border}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: isMobile ? "100%" : undefined,
                  minHeight: isMobile ? 48 : undefined,
                }}>
                  Sign in
                </Link>
              </div>

              <p style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: textFaint,
                letterSpacing: "0.04em", marginTop: 14,
                textAlign: isMobile ? "center" : "left",
              }}>
                No credit card required · Cancel anytime · Educational research only
              </p>
            </div>

            {/* Right — floating card; hidden on mobile to reduce scroll depth */}
            {!isMobile && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <FloatingReportCard
                  accent={accent} border={border} bg={bg}
                  text={text} textMuted={textMuted} textFaint={textFaint}
                  success={success} danger={danger}
                  compact={isTablet}
                />
              </div>
            )}
          </div>

          {/* Mobile: show card below hero text, smaller */}
          {isMobile && (
            <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
              <FloatingReportCard
                accent={accent} border={border} bg={bg}
                text={text} textMuted={textMuted} textFaint={textFaint}
                success={success} danger={danger}
                compact={true}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <section style={{
        borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
        padding: isMobile ? "24px 16px" : "28px 32px",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "grid",
          // 2×2 on mobile, 4-col on tablet+
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? "20px 16px" : 24,
        }}>
          {[
            { value: "500+",     label: "Companies covered" },
            { value: "10k+",     label: "Reports processed" },
            { value: "BSE & NSE",label: "Both exchanges"    },
            { value: "Daily",    label: "Updates published" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: isMobile ? 22 : 28, color: accent, marginBottom: 4,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: isMobile ? 10 : 11, color: textMuted, letterSpacing: "0.06em",
              }}>
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section style={{ padding: sectionPad }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 60 }}>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              color: accent, letterSpacing: "0.1em", marginBottom: 12,
            }}>
              HOW IT WORKS
            </p>
            <h2 style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: h2Size, fontWeight: "normal", color: text, margin: 0,
            }}>
              From 300-page filing to 5-minute read
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
            gap: isMobile ? 16 : 28,
          }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: isMobile ? "20px 18px" : "28px 24px",
                position: "relative",
              }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: isMobile ? 32 : 40, fontWeight: 700,
                  color: `${accent}25`, lineHeight: 1, marginBottom: 12,
                }}>
                  {step.step}
                </div>
                <h3 style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: isMobile ? 16 : 18, color: text,
                  margin: "0 0 8px", fontWeight: "normal",
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: isMobile ? 13 : 14, color: textMuted, lineHeight: 1.7, margin: 0,
                }}>
                  {step.desc}
                </p>
                {/* Arrow connector — only on desktop (between cards) */}
                {i < HOW_IT_WORKS.length - 1 && !isMobile && (
                  <div style={{
                    position: "absolute", right: -16, top: "50%",
                    transform: "translateY(-50%)",
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 20,
                    color: textFaint, zIndex: 1,
                  }}>
                    →
                  </div>
                )}
                {/* Vertical connector on mobile */}
                {i < HOW_IT_WORKS.length - 1 && isMobile && (
                  <div style={{
                    textAlign: "center", marginTop: 12,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 16, color: textFaint,
                  }}>
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who is this for ──────────────────────────────────────── */}
      <section style={{
        padding: sectionPad,
        background: "rgba(255,255,255,0.015)",
        borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 60 }}>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              color: accent, letterSpacing: "0.1em", marginBottom: 12,
            }}>
              WHO IS THIS FOR
            </p>
            <h2 style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: h2Size, fontWeight: "normal", color: text, margin: 0,
            }}>
              Built for every kind of investor
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
            gap: isMobile ? 12 : 24,
          }}>
            {USER_TYPES.map((u, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: isMobile ? "20px 18px" : "28px 24px",
                // On mobile, show as a more compact horizontal-ish card
                display: isMobile ? "flex" : "block",
                gap: isMobile ? 16 : 0,
                alignItems: isMobile ? "flex-start" : undefined,
              }}>
                <div style={{
                  fontSize: isMobile ? 24 : 28,
                  color: accent,
                  marginBottom: isMobile ? 0 : 14,
                  flexShrink: 0,
                  marginTop: isMobile ? 2 : 0,
                }}>
                  {u.icon}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: isMobile ? 15 : 18, color: text,
                    margin: isMobile ? "0 0 6px" : "0 0 10px", fontWeight: "normal",
                  }}>
                    {u.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: isMobile ? 13 : 14, color: textMuted, lineHeight: 1.7, margin: 0,
                  }}>
                    {u.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section style={{ padding: sectionPad }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 60 }}>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              color: accent, letterSpacing: "0.1em", marginBottom: 12,
            }}>
              PRICING
            </p>
            <h2 style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: h2Size, fontWeight: "normal", color: text, margin: "0 0 12px",
            }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: isMobile ? 14 : 16, color: textMuted, margin: 0 }}>
              All plans include AI-powered summaries. Cancel anytime.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: isMobile ? 12 : 24,
          }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? `${accent}06` : "rgba(255,255,255,0.02)",
                border: `1px solid ${plan.highlight ? accent + "55" : border}`,
                borderRadius: 16,
                padding: isMobile ? "24px 20px" : "32px 28px",
                display: "flex", flexDirection: "column",
                position: "relative",
                boxShadow: plan.highlight ? `0 0 0 1px ${accent}22, 0 16px 40px rgba(0,0,0,0.3)` : "none",
                // Highlighted plan needs margin-top on mobile for the badge
                marginTop: plan.highlight && isMobile ? 12 : 0,
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: accent, color: accentText,
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700,
                    padding: "3px 14px", borderRadius: 20, letterSpacing: "0.08em", whiteSpace: "nowrap",
                  }}>
                    MOST POPULAR
                  </div>
                )}

                {/* Plan header — horizontal on mobile */}
                <div style={{
                  display: "flex",
                  flexDirection: isMobile ? "row" : "column",
                  alignItems: isMobile ? "center" : "flex-start",
                  justifyContent: "space-between",
                  marginBottom: isMobile ? 12 : 0,
                }}>
                  <h3 style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: isMobile ? 17 : 20,
                    color: plan.highlight ? accent : text, margin: 0,
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{ textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 0 : 12, marginBottom: isMobile ? 0 : 20 }}>
                    <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: isMobile ? 24 : 36, color: text }}>
                      {plan.price}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: textMuted, marginLeft: 3 }}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  color: success, margin: isMobile ? "0 0 14px" : "0 0 6px",
                }}>
                  {plan.yearlyNote}
                </p>

                <div style={{ flex: 1, marginBottom: isMobile ? 16 : 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
                      <span style={{ color: success, fontSize: 11, flexShrink: 0, marginTop: 2 }}>✓</span>
                      <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: isMobile ? 12 : 13, color: text, lineHeight: 1.5 }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                <Link href={plan.href} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: isMobile ? "13px" : "12px", borderRadius: 8, textDecoration: "none",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, letterSpacing: "0.04em",
                  background: plan.highlight ? accent : "transparent",
                  border: `1px solid ${plan.highlight ? accent : accent + "66"}`,
                  color: plan.highlight ? accentText : accent,
                  fontWeight: 700, transition: "opacity 0.15s",
                  minHeight: isMobile ? 46 : undefined,
                }}>
                  {plan.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "36px 16px" : "48px 32px",
        background: "rgba(255,255,255,0.015)",
        borderTop: `1px solid ${border}`,
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            color: accent, letterSpacing: "0.08em", marginBottom: 12,
          }}>
            IMPORTANT DISCLAIMER
          </p>
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: isMobile ? 13 : 14, color: textMuted, lineHeight: 1.8, margin: 0,
          }}>
            FinSight provides simplified educational financial research only. Nothing on this platform
            constitutes financial advice, investment recommendations, or SEBI-registered research.
            Always consult a qualified financial advisor before making investment decisions.
            Past performance does not guarantee future results.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${border}`,
        padding: isMobile ? "32px 16px" : "40px 32px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 20 : 20,
            marginBottom: 24,
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", color: text,
            }}>
              FIN<span style={{ color: accent }}>SIGHT</span>
            </span>
            <div style={{ display: "flex", gap: isMobile ? 20 : 24 }}>
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms",   href: "/terms"   },
                { label: "Contact", href: "mailto:hello@finsight.in" },
              ].map(link => (
                <Link key={link.label} href={link.href} style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: isMobile ? 13 : 12, color: textMuted,
                  textDecoration: "none", letterSpacing: "0.04em",
                  // Taller tap target on mobile
                  padding: isMobile ? "4px 0" : 0,
                  display: "inline-block",
                }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
            color: textFaint, textAlign: "center", letterSpacing: "0.04em",
          }}>
            © {new Date().getFullYear()} FinSight. Educational research only. Not financial advice.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        a:hover { opacity: 0.8; }
        button { -webkit-tap-highlight-color: transparent; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}