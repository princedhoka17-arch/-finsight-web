"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { authApi, subscriptionsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type Step  = 1 | 2 | 3 | 4;
type Level = "beginner" | "intermediate";
type PlanId = "beginner" | "intermediate" | "pay_per_report";

interface Company { id: string; name: string; ticker: string; sector: string; }

const COMPANIES: Company[] = [
  { id: "1",  name: "Reliance Industries", ticker: "RELIANCE",   sector: "Conglomerate" },
  { id: "2",  name: "TCS",                 ticker: "TCS",        sector: "IT Services"  },
  { id: "3",  name: "HDFC Bank",           ticker: "HDFCBANK",   sector: "Banking"      },
  { id: "4",  name: "Infosys",             ticker: "INFY",       sector: "IT Services"  },
  { id: "5",  name: "Maruti Suzuki",       ticker: "MARUTI",     sector: "Automobiles"  },
  { id: "6",  name: "ITC Limited",         ticker: "ITC",        sector: "FMCG"         },
  { id: "7",  name: "Bajaj Finance",       ticker: "BAJFINANCE", sector: "NBFC"         },
  { id: "8",  name: "Asian Paints",        ticker: "ASIANPAINT", sector: "FMCG"         },
  { id: "9",  name: "ICICI Bank",          ticker: "ICICIBANK",  sector: "Banking"      },
  { id: "10", name: "Wipro",               ticker: "WIPRO",      sector: "IT Services"  },
];

const PLAN_CONFIGS = [
  {
    id: "beginner" as PlanId,
    name: "Beginner", price: "₹249", period: "/month", note: "₹2,499/year",
    highlight: false,
    billingCycle: "monthly" as const,
    features: ["5 reports/month", "20 AI questions/report", "Watchlist — 5 companies", "Beginner summaries"],
  },
  {
    id: "intermediate" as PlanId,
    name: "Intermediate", price: "₹799", period: "/month", note: "₹7,999/year — save 17%",
    highlight: true,
    billingCycle: "monthly" as const,
    features: ["13 reports/month", "Unlimited AI chat", "Watchlist — 15 companies", "Daily updates included"],
  },
  {
    id: "pay_per_report" as PlanId,
    name: "Pay Per Report", price: "₹149", period: "/report", note: "No subscription",
    highlight: false,
    billingCycle: "one_time" as const,
    features: ["Single report — 30 days", "10 AI questions", "No commitment"],
  },
];

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

// ─── Razorpay SDK loader ──────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Progress indicator ───────────────────────────────────────────
function ProgressIndicator({
  current, total, theme, isMobile,
}: {
  current: Step; total: number; theme: any; isMobile: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: isMobile ? 28 : 40 }}>
      {Array.from({ length: total }, (_, i) => {
        const num = (i + 1) as Step;
        const done   = num < current;
        const active = num === current;
        const size   = isMobile ? 26 : 30;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < total - 1 ? 1 : undefined }}>
            <div style={{
              width: size, height: size, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: done || active ? theme.accent : "transparent",
              border: `2px solid ${done || active ? theme.accent : theme.border}`,
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: isMobile ? 10 : 11, fontWeight: 700,
              color: done || active ? theme.accentText : theme.textFaint,
              transition: "all 0.25s",
            }}>
              {done ? "✓" : num}
            </div>
            {i < total - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 2px",
                background: done ? theme.accent : theme.border,
                transition: "background 0.25s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { theme } = useThemeStore();

  const width     = useWindowWidth();
  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;

  const [mounted,      setMounted]      = useState(false);
  const [step,         setStep]         = useState<Step>(1);
  const [fullName,     setFullName]     = useState("");
  const [country,      setCountry]      = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [level,        setLevel]        = useState<Level | null>(null);
  const [picks,        setPicks]        = useState<string[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const { bg, accent, accentText, text, textMuted, textFaint, border, success, danger } = theme;

  // ── Shared styles ──────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${border}`,
    borderRadius: 10,
    padding: isMobile ? "13px 14px" : "12px 16px",
    // 16px prevents iOS zoom-on-focus
    fontSize: isMobile ? 16 : 15,
    color: text,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Source Serif 4', Georgia, serif",
    minHeight: isMobile ? 48 : undefined,
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontSize: isMobile ? 10 : 11,
    letterSpacing: "0.08em",
    color: textMuted,
    display: "block",
    marginBottom: 6,
  };
  const primaryBtn = (disabled: boolean): React.CSSProperties => ({
    background: disabled ? "rgba(255,255,255,0.05)" : accent,
    color: disabled ? textFaint : accentText,
    border: `1px solid ${disabled ? border : accent}`,
    borderRadius: 9,
    padding: isMobile ? "14px 24px" : "12px 28px",
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: isMobile ? 15 : 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity 0.15s",
    minHeight: isMobile ? 50 : undefined,
    width: isMobile ? "100%" : undefined,
  });
  const ghostBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    color: textMuted,
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontSize: 12,
    letterSpacing: "0.06em",
    cursor: "pointer",
    padding: isMobile ? "10px 0" : 0,
    minHeight: isMobile ? 44 : undefined,
  };

  // Page wrapper — mobile is top-aligned, desktop centered
  const pageWrap: React.CSSProperties = {
    minHeight: "100dvh",
    background: bg,
    color: text,
    fontFamily: "'Source Serif 4', Georgia, serif",
    display: "flex",
    alignItems: isMobile ? "flex-start" : "center",
    justifyContent: "center",
    padding: isMobile ? "24px 16px 80px" : isTablet ? "40px 24px" : "40px 20px",
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 520,
    background: "rgba(255,255,255,0.02)",
    border: `1px solid ${border}`,
    borderRadius: isMobile ? 16 : 20,
    padding: isMobile ? "24px 20px" : isTablet ? "32px 28px" : "40px 36px",
    boxShadow: isMobile
      ? `0 0 0 1px ${accent}10, 0 8px 24px rgba(0,0,0,0.25)`
      : `0 0 0 1px ${accent}10, 0 24px 48px rgba(0,0,0,0.4)`,
  };

  const logo = (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      fontSize: 15, fontWeight: 700, letterSpacing: "0.1em",
      color: text, marginBottom: isMobile ? 24 : 32,
    }}>
      FIN<span style={{ color: accent }}>SIGHT</span>
    </div>
  );

  const spinner = (color: string) => (
    <span style={{
      width: 14, height: 14,
      border: `2px solid ${color}40`, borderTopColor: color,
      borderRadius: "50%", animation: "spin 0.6s linear infinite",
      display: "inline-block", flexShrink: 0,
    }} />
  );

  const stepLabel = (n: number, total: number) => (
    <p style={{
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      fontSize: isMobile ? 10 : 11,
      letterSpacing: "0.1em", color: accent, marginBottom: 8,
    }}>
      STEP {n} OF {total}
    </p>
  );

  const legalNote = (
    <p style={{
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      fontSize: 10, color: textFaint,
      textAlign: "center", marginTop: 28, letterSpacing: "0.04em",
    }}>
      Educational research only. Not financial advice.
    </p>
  );

  // ── Finish onboarding ──────────────────────────────────────────
  async function finish(overrideLevel?: Level, overridePicks?: string[]) {
    setLoading(true);
    try {
      await supabase.auth.updateUser({
        data: { full_name: fullName, country, onboarding_completed: true },
      });
      await authApi.completeOnboarding({
        level: overrideLevel ?? level ?? "beginner",
        selected_companies: overridePicks ?? picks,
      });
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
      router.push("/dashboard");
    }
  }

  // ── Razorpay payment ───────────────────────────────────────────
  async function handlePlanSelect(planConfig: typeof PLAN_CONFIGS[number]) {
    setSelectedPlan(planConfig.id);
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Please check your connection.");

      const { data: orderData } = await subscriptionsApi.createOrder({
        plan: planConfig.id,
        billing_cycle: planConfig.billingCycle as any,
      });

      await new Promise<void>((resolve, reject) => {
        const isSubscription = planConfig.id !== "pay_per_report";
        const options: any = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency ?? "INR",
          name: "FinSight",
          description: `${planConfig.name} plan`,
          prefill: { name: fullName },
          theme: { color: accent },
          modal: { ondismiss: () => reject(new Error("cancelled")) },
        };
        if (isSubscription) {
          options.subscription_id = orderData.order_id;
        } else {
          options.order_id = orderData.order_id;
        }
        options.handler = async (response: any) => {
          try {
            await subscriptionsApi.verify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_subscription_id ?? response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan: planConfig.id,
              billing_cycle: planConfig.billingCycle as any,
            });
            resolve();
          } catch (verifyErr: any) {
            reject(new Error(verifyErr?.response?.data?.detail ?? "Payment verification failed."));
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          reject(new Error(resp?.error?.description ?? "Payment failed."));
        });
        rzp.open();
      });

      setStep(3);
    } catch (err: any) {
      if (err?.message !== "cancelled") {
        setError(err?.message ?? "Payment failed. Please try again.");
      }
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  }

  // ── Level select ───────────────────────────────────────────────
  async function handleLevelSelect(l: Level) {
    setLevel(l);
    if (l === "intermediate") {
      setLoading(true);
      try {
        await supabase.auth.updateUser({
          data: { full_name: fullName, country, onboarding_completed: true },
        });
        await authApi.completeOnboarding({ level: "intermediate", selected_companies: [] });
      } catch { /* non-blocking */ }
      setLoading(false);
      router.push("/dashboard");
    } else {
      setStep(4);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // STEP 1 — Welcome + Name
  // ────────────────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={pageWrap}>
      <div style={card}>
        {logo}
        <ProgressIndicator current={1} total={4} theme={theme} isMobile={isMobile} />
        {stepLabel(1, 4)}
        <h1 style={{
          fontSize: isMobile ? 22 : 28,
          fontWeight: "normal", color: text,
          margin: "0 0 8px", lineHeight: 1.25,
        }}>
          Welcome to FinSight
        </h1>
        <p style={{ fontSize: isMobile ? 13 : 14, color: textMuted, margin: "0 0 28px", lineHeight: 1.7 }}>
          Let&apos;s personalise your experience. This takes under 2 minutes.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 20, marginBottom: isMobile ? 24 : 32 }}>
          <div>
            <label style={labelStyle}>YOUR FULL NAME</label>
            <input
              type="text"
              autoFocus={!isMobile}
              placeholder="e.g. Priya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fullName.trim() && setStep(2)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              COUNTRY <span style={{ color: textFaint }}>(OPTIONAL)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: isMobile ? "stretch" : "flex-end" }}>
          <button
            style={primaryBtn(!fullName.trim())}
            disabled={!fullName.trim()}
            onClick={() => setStep(2)}
          >
            Continue →
          </button>
        </div>
        {legalNote}
      </div>
      <style>{`
        input::placeholder { color: ${textFaint}; }
        input:focus { border-color: ${accent}80 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );

  // ────────────────────────────────────────────────────────────────
  // STEP 2 — Plan + Payment
  // ────────────────────────────────────────────────────────────────
  if (step === 2) {
    // Mobile: stacked cards; tablet: 1×3 row; desktop: auto-fit
    const planGrid: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : isTablet
        ? "repeat(3, 1fr)"
        : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: isMobile ? 12 : 16,
      marginBottom: isMobile ? 20 : 28,
    };

    return (
      <div style={{
        ...pageWrap,
        alignItems: isMobile ? "flex-start" : "flex-start",
        paddingTop: isMobile ? 24 : 60,
      }}>
        <div style={{ width: "100%", maxWidth: 760 }}>
          {logo}
          <ProgressIndicator current={2} total={4} theme={theme} isMobile={isMobile} />
          {stepLabel(2, 4)}
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: "normal", color: text, margin: "0 0 8px" }}>
            Choose your plan
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 14, color: textMuted, margin: "0 0 24px", lineHeight: 1.7 }}>
            All plans include AI-powered summaries. You can upgrade or cancel anytime.
          </p>

          {error && (
            <div style={{
              background: `${danger}15`, border: `1px solid ${danger}30`,
              borderRadius: 8, padding: "12px 16px", marginBottom: 16,
              fontSize: isMobile ? 12 : 13, color: danger,
              fontFamily: "'Source Serif 4', Georgia, serif",
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={planGrid}>
            {PLAN_CONFIGS.map((plan) => {
              const isThisLoading = loading && selectedPlan === plan.id;
              return (
                <div key={plan.id} style={{
                  background: plan.highlight ? `${accent}07` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${plan.highlight ? accent + "55" : border}`,
                  borderRadius: 14,
                  // Mobile: horizontal layout for non-highlighted; vertical for all on tablet+
                  padding: isMobile ? "18px 16px" : "24px 20px",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "column",
                  position: "relative",
                  boxShadow: plan.highlight ? `0 0 0 1px ${accent}18` : "none",
                  // Highlighted plan gets a subtle top margin on mobile to make room for badge
                  marginTop: plan.highlight && isMobile ? 12 : 0,
                }}>
                  {plan.highlight && (
                    <div style={{
                      position: "absolute", top: -11, left: "50%",
                      transform: "translateX(-50%)",
                      background: accent, color: accentText,
                      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                      fontSize: 9, fontWeight: 700,
                      padding: "2px 14px", borderRadius: 20,
                      letterSpacing: "0.08em", whiteSpace: "nowrap",
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
                    gap: isMobile ? 8 : 0,
                  }}>
                    <h3 style={{
                      fontFamily: "'Source Serif 4', Georgia, serif",
                      fontSize: isMobile ? 16 : 18,
                      color: plan.highlight ? accent : text,
                      margin: 0,
                    }}>
                      {plan.name}
                    </h3>
                    <div style={{ textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 0 : 10, marginBottom: isMobile ? 0 : 16 }}>
                      <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: isMobile ? 22 : 28, color: text }}>
                        {plan.price}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: textMuted, marginLeft: 3 }}>
                        {plan.period}
                      </span>
                      {!isMobile && (
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: success, margin: "5px 0 0" }}>
                          {plan.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Note row on mobile */}
                  {isMobile && (
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: success, margin: "0 0 12px" }}>
                      {plan.note}
                    </p>
                  )}

                  {/* Features */}
                  <div style={{ flex: 1, marginBottom: isMobile ? 14 : 18 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: "flex", gap: 8, padding: "3px 0" }}>
                        <span style={{ color: success, fontSize: 11, flexShrink: 0, marginTop: 2 }}>✓</span>
                        <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: isMobile ? 12 : 12, color: text, lineHeight: 1.5 }}>
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: isMobile ? "13px" : "11px",
                      background: plan.highlight ? accent : "transparent",
                      border: `1px solid ${plan.highlight ? accent : accent + "66"}`,
                      borderRadius: 8,
                      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                      fontSize: 12, letterSpacing: "0.04em",
                      color: plan.highlight ? accentText : accent,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading && !isThisLoading ? 0.4 : 1,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 8, fontWeight: 700,
                      minHeight: isMobile ? 46 : undefined,
                    }}
                  >
                    {isThisLoading
                      ? <>{spinner(plan.highlight ? accentText : accent)} Processing…</>
                      : `Choose ${plan.name} →`}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column-reverse" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 8 : 0,
          }}>
            <button style={ghostBtn} onClick={() => setStep(1)}>← Back</button>
            <button
              style={{
                ...ghostBtn,
                color: textFaint, fontSize: 11,
                border: `1px solid ${border}`,
                borderRadius: 7,
                padding: isMobile ? "12px 16px" : "8px 16px",
                textAlign: "center",
              }}
              onClick={() => setStep(3)}
            >
              Skip for now →
            </button>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } button { -webkit-tap-highlight-color: transparent; }`}</style>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // STEP 3 — Knowledge Level
  // ────────────────────────────────────────────────────────────────
  if (step === 3) {
    const options = [
      { id: "beginner" as Level,     icon: "◎", label: "Beginner",     desc: "I'm new to investing. I want simple explanations and beginner-friendly summaries." },
      { id: "intermediate" as Level, icon: "◈", label: "Intermediate", desc: "I understand the basics. I want detailed financial analysis and deeper insights." },
    ];
    return (
      <div style={pageWrap}>
        <div style={card}>
          {logo}
          <ProgressIndicator current={3} total={4} theme={theme} isMobile={isMobile} />
          {stepLabel(3, 4)}
          <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight: "normal", color: text, margin: "0 0 8px", lineHeight: 1.25 }}>
            What&apos;s your investing knowledge level?
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 14, color: textMuted, margin: "0 0 24px", lineHeight: 1.7 }}>
            This determines how reports are explained to you. You can change this later.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 12, marginBottom: isMobile ? 24 : 32 }}>
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleLevelSelect(opt.id)}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: isMobile ? 12 : 16,
                  padding: isMobile ? "16px 14px" : "18px 20px",
                  textAlign: "left", width: "100%",
                  background: level === opt.id ? `${accent}10` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${level === opt.id ? accent + "60" : border}`,
                  borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1, transition: "all 0.15s",
                  minHeight: isMobile ? 72 : undefined,
                }}
              >
                <span style={{ fontSize: isMobile ? 22 : 26, color: accent, flexShrink: 0 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: isMobile ? 14 : 16, color: text, marginBottom: 4 }}>{opt.label}</div>
                  <div style={{ fontSize: isMobile ? 12 : 13, color: textMuted, lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
                {loading && level === opt.id
                  ? spinner(accent)
                  : <span style={{ fontSize: 18, color: textFaint, flexShrink: 0 }}>→</span>}
              </button>
            ))}
          </div>

          <button style={ghostBtn} onClick={() => setStep(2)}>← Back</button>
          {legalNote}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } button { -webkit-tap-highlight-color: transparent; }`}</style>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // STEP 4 — Company Picks (Beginner only)
  // ────────────────────────────────────────────────────────────────
  if (step === 4) {
    const maxPicks = 4;

    // Company grid: 1-col mobile, 2-col tablet, auto-fit desktop
    const companyGrid: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : isTablet
        ? "repeat(2, 1fr)"
        : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: isMobile ? 8 : 10,
      marginBottom: isMobile ? 0 : 32,
      // On mobile, leave room for the sticky footer
      paddingBottom: isMobile ? 96 : 0,
    };

    return (
      <div style={{
        ...pageWrap,
        alignItems: "flex-start",
        paddingTop: isMobile ? 24 : 60,
        // On mobile, don't add extra padding — sticky footer handles spacing
        paddingBottom: isMobile ? 0 : 40,
      }}>
        <div style={{ width: "100%", maxWidth: 720 }}>
          {logo}
          <ProgressIndicator current={4} total={4} theme={theme} isMobile={isMobile} />

          {/* Header row */}
          <div style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "flex-start",
            justifyContent: "space-between",
            marginBottom: 8, gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              {stepLabel(4, 4)}
              <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight: "normal", color: text, margin: "0 0 8px" }}>
                Pick companies to track
              </h1>
              <p style={{ fontSize: isMobile ? 13 : 14, color: textMuted, margin: "0 0 20px", lineHeight: 1.7 }}>
                Select up to {maxPicks} companies. You can always change these from your watchlist.
              </p>
            </div>
            {/* Skip button — top-right on tablet/desktop, hidden on mobile (shown in sticky footer) */}
            {!isMobile && (
              <button
                style={{
                  ...ghostBtn, color: textFaint, fontSize: 12,
                  border: `1px solid ${border}`, borderRadius: 7,
                  padding: "8px 16px", flexShrink: 0, marginTop: 28,
                }}
                onClick={() => finish("beginner", [])}
              >
                Skip →
              </button>
            )}
          </div>

          {/* Selection counter */}
          <div style={{ marginBottom: isMobile ? 14 : 20 }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: 12, color: accent,
              background: `${accent}15`, border: `1px solid ${accent}30`,
              padding: "5px 14px", borderRadius: 4, letterSpacing: "0.06em",
            }}>
              {picks.length} / {maxPicks} selected
            </span>
          </div>

          {/* Company grid */}
          <div style={companyGrid}>
            {COMPANIES.map((c) => {
              const isSelected = picks.includes(c.id);
              const isDisabled = !isSelected && picks.length >= maxPicks;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (!isDisabled) {
                      setPicks((prev) =>
                        isSelected ? prev.filter((p) => p !== c.id) : [...prev, c.id]
                      );
                    }
                  }}
                  style={{
                    display: "flex", alignItems: "center",
                    gap: isMobile ? 12 : 10,
                    padding: isMobile ? "14px 12px" : "14px",
                    textAlign: "left", width: "100%",
                    background: isSelected ? `${accent}08` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? accent + "55" : border}`,
                    borderRadius: 9,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.35 : 1,
                    transition: "all 0.15s",
                    minHeight: isMobile ? 60 : undefined,
                  }}
                >
                  <div style={{
                    width: isMobile ? 36 : 34, height: isMobile ? 36 : 34,
                    borderRadius: 6, flexShrink: 0,
                    background: `${accent}15`, border: `1px solid ${accent}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                    fontSize: 10, fontWeight: 700, color: accent,
                  }}>
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? 13 : 13, color: text, marginBottom: 2, lineHeight: 1.3 }}>
                      {c.name}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, color: textFaint }}>
                      {c.ticker} · {c.sector}
                    </div>
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: 14, color: accent, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div style={{
              background: `${danger}15`, border: `1px solid ${danger}30`,
              borderRadius: 8, padding: "12px 16px",
              marginTop: isMobile ? 0 : 0, marginBottom: isMobile ? 0 : 20,
              fontSize: isMobile ? 12 : 13, color: danger,
            }}>
              {error}
            </div>
          )}

          {/* Desktop/tablet footer nav */}
          {!isMobile && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <button style={ghostBtn} onClick={() => setStep(3)}>← Back</button>
              <button style={primaryBtn(loading)} disabled={loading} onClick={() => finish("beginner", picks)}>
                {loading ? <>{spinner(accentText)} Saving…</> : "Go to Dashboard →"}
              </button>
            </div>
          )}

          {!isMobile && legalNote}
        </div>

        {/* Mobile sticky footer */}
        {isMobile && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: bg,
            borderTop: `1px solid ${border}`,
            padding: "12px 16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 50,
          }}>
            <button style={primaryBtn(loading)} disabled={loading} onClick={() => finish("beginner", picks)}>
              {loading ? <>{spinner(accentText)} Saving…</> : "Go to Dashboard →"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button style={{ ...ghostBtn, fontSize: 12 }} onClick={() => setStep(3)}>← Back</button>
              <button
                style={{ ...ghostBtn, color: textFaint, fontSize: 11 }}
                onClick={() => finish("beginner", [])}
              >
                Skip →
              </button>
            </div>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } } button { -webkit-tap-highlight-color: transparent; }`}</style>
      </div>
    );
  }

  return null;
}