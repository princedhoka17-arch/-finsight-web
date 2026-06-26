"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { subscriptionsApi } from "@/lib/api";
import { PLAN_PRICES, PLAN_LIMITS, type PlanType } from "@/types";

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

// ─── hex → rgb ────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return "255,255,255";
  return `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`;
}

// ─── Types ────────────────────────────────────────────────────────
type Billing = "monthly" | "yearly";

interface PlanConfig {
  id: PlanType;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  perReportPrice?: number;
  features: string[];
  limits: string[];
  highlight: boolean;
}

// ─── Plan configs ─────────────────────────────────────────────────
const PLANS: PlanConfig[] = [
  {
    id: "beginner",
    name: "Beginner",
    tagline: "Start your investment journey",
    monthlyPrice: PLAN_PRICES.beginner.monthly,
    yearlyPrice: PLAN_PRICES.beginner.yearly,
    highlight: false,
    features: [
      "5 reports per month",
      "4 company picks by you",
      "1 platform-curated pick",
      "AI chat — 20 questions/report",
      "Watchlist — up to 5 companies",
      "Beginner-friendly summaries",
      "Risk level badges",
    ],
    limits: [
      "Daily updates — ₹79/company/month add-on",
      "No intermediate reports",
    ],
  },
  {
    id: "intermediate",
    name: "Intermediate",
    tagline: "For serious investors",
    monthlyPrice: PLAN_PRICES.intermediate.monthly,
    yearlyPrice: PLAN_PRICES.intermediate.yearly,
    highlight: true,
    features: [
      "13 reports per month",
      "11 company picks by you",
      "2 platform-curated picks",
      "Unlimited AI chat per report",
      "Watchlist — up to 15 companies",
      "Daily updates — 3 companies included",
      "Full financial analysis",
      "Earnings call summaries",
    ],
    limits: [`Additional daily updates — ₹${PLAN_PRICES.intermediate ? 39 : 79}/company/month`],
  },
  {
    id: "pay_per_report",
    name: "Pay Per Report",
    tagline: "No commitment needed",
    monthlyPrice: 0,
    yearlyPrice: 0,
    perReportPrice: PLAN_PRICES.pay_per_report.one_time,
    highlight: false,
    features: [
      "₹149 per report",
      "AI chat — 10 questions included",
      "No subscription required",
      "Full report access for 30 days",
      "Risk analysis included",
    ],
    limits: ["No watchlist", "No daily updates", "No platform picks"],
  },
];

// ─── Razorpay loader ──────────────────────────────────────────────
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

// ─── Feature row ─────────────────────────────────────────────────
function FeatureRow({ text, included, theme }: { text: string; included: boolean; theme: any }) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0" }}>
      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 2, color: included ? "#3B6D11" : theme.textFaint }}>
        {included ? "✓" : "·"}
      </span>
      <span style={{ ...mono, fontSize: 12, color: included ? theme.text : theme.textFaint, lineHeight: 1.5 }}>
        {text}
      </span>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────
function PlanCard({
  plan, billing, current, loading, onSelect, theme, isMobile,
}: {
  plan: PlanConfig;
  billing: Billing;
  current: PlanType;
  loading: string | null;
  onSelect: (id: PlanType) => void;
  theme: any;
  isMobile: boolean;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const isCurrent   = plan.id === current;
  const isLoading   = loading === plan.id;
  const isPerReport = plan.id === "pay_per_report";

  const price = isPerReport
    ? plan.perReportPrice!
    : billing === "monthly"
    ? plan.monthlyPrice
    : Math.round(plan.yearlyPrice / 12);

  const yearlySaving = isPerReport
    ? 0
    : Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100);

  return (
    <div style={{
      background: plan.highlight ? `rgba(${hexToRgb(theme.accent)},0.06)` : theme.bgSecondary,
      border: `0.5px solid ${plan.highlight ? theme.accent + "55" : theme.border}`,
      borderRadius: 12,
      padding: isMobile ? "20px 16px" : "24px 22px",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      {plan.highlight && (
        <div style={{
          position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
          background: "#B0503F", color: "#fff",
          ...mono, fontSize: 9, fontWeight: 700,
          padding: "3px 12px", borderRadius: 20, letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}>
          MOST POPULAR
        </div>
      )}

      {/* On mobile: header + price side by side */}
      {isMobile ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 8 }}>
          <div>
            <h2 style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: 16, color: plan.highlight ? "#B0503F" : theme.text, margin: "0 0 4px",
              fontWeight: 600,
            }}>
              {plan.name}
            </h2>
            <p style={{ ...mono, fontSize: 10, color: theme.textMuted, margin: 0 }}>
              {plan.tagline}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {isPerReport ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, color: theme.text }}>₹{price}</span>
                  <span style={{ ...mono, fontSize: 10, color: theme.textMuted }}>/report</span>
                </div>
                <p style={{ ...mono, fontSize: 9, color: theme.textFaint, marginTop: 2 }}>No charges</p>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, color: theme.text }}>₹{price}</span>
                  <span style={{ ...mono, fontSize: 10, color: theme.textMuted }}>/mo</span>
                </div>
                {billing === "yearly" && (
                  <p style={{ ...mono, fontSize: 9, color: "#3B6D11", marginTop: 2 }}>Save {yearlySaving}%</p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: 18, color: plan.highlight ? "#B0503F" : theme.text, margin: "0 0 5px",
              fontWeight: 600,
            }}>
              {plan.name}
            </h2>
            <p style={{ ...mono, fontSize: 10, color: theme.textMuted, margin: 0 }}>
              {plan.tagline}
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            {isPerReport ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 32, color: theme.text }}>₹{price}</span>
                  <span style={{ ...mono, fontSize: 11, color: theme.textMuted }}>/ report</span>
                </div>
                <p style={{ ...mono, fontSize: 10, color: theme.textFaint, marginTop: 4 }}>No recurring charges</p>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 32, color: theme.text }}>₹{price}</span>
                  <span style={{ ...mono, fontSize: 11, color: theme.textMuted }}>/ month</span>
                </div>
                {billing === "yearly" && (
                  <p style={{ ...mono, fontSize: 10, color: "#3B6D11", marginTop: 4 }}>
                    ₹{plan.yearlyPrice}/year · Save {yearlySaving}%
                  </p>
                )}
                {billing === "monthly" && (
                  <p style={{ ...mono, fontSize: 10, color: theme.textFaint, marginTop: 4 }}>Billed monthly</p>
                )}
              </>
            )}
          </div>
        </>
      )}

      <div style={{ flex: 1, marginBottom: 16 }}>
        {plan.features.map((f) => <FeatureRow key={f} text={f} included theme={theme} />)}
        {plan.limits.map((f) => <FeatureRow key={f} text={f} included={false} theme={theme} />)}
      </div>

      <button
        disabled={isCurrent || !!loading}
        onClick={() => onSelect(plan.id)}
        style={{
          width: "100%", padding: isMobile ? "10px" : "11px",
          background: isCurrent ? "transparent" : plan.highlight ? "#B0503F" : "transparent",
          border: `0.5px solid ${isCurrent ? theme.border : plan.highlight ? "#B0503F" : theme.accent + "66"}`,
          borderRadius: 8,
          ...mono, fontSize: 11, letterSpacing: "0.06em",
          color: isCurrent ? theme.textMuted : plan.highlight ? "#fff" : theme.accent,
          cursor: isCurrent || !!loading ? "not-allowed" : "pointer",
          opacity: isCurrent || (!!loading && !isLoading) ? 0.5 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "opacity 0.15s",
        }}
      >
        {isLoading ? (
          <>
            <span style={{
              width: 12, height: 12,
              border: `2px solid ${plan.highlight ? "#ffffff40" : theme.accent + "40"}`,
              borderTopColor: plan.highlight ? "#fff" : theme.accent,
              borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block",
            }} />
            Processing…
          </>
        ) : isCurrent ? "Current plan"
          : isPerReport ? "BUY A REPORT →"
          : `GET ${plan.name.toUpperCase()} →`}
      </button>
    </div>
  );
}

// ─── Add-on banner ────────────────────────────────────────────────
function AddonBanner({
  loading, onSelect, theme, isMobile, isTablet,
}: {
  loading: string | null;
  onSelect: () => void;
  theme: any;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const isLoading = loading === "addon_daily_update";

  if (isMobile) {
    // Stacked layout for mobile
    return (
      <div style={{
        background: theme.bgSecondary,
        border: `0.5px solid ${theme.border}`,
        borderRadius: 12,
        padding: "16px",
      }}>
        {/* Top row: icon + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#FAEEDA",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>
            📰
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 14, fontWeight: 600, color: theme.text,
              }}>
                Daily Update Slot
              </span>
              <span style={{
                ...mono, fontSize: 9,
                background: "#FAEEDA", color: "#854F0B",
                borderRadius: 999, padding: "2px 8px",
              }}>
                ADD-ON
              </span>
            </div>
            <p style={{ ...mono, fontSize: 10, color: theme.textMuted, margin: "2px 0 0", lineHeight: 1.5 }}>
              Add one more company to daily briefings.
            </p>
          </div>
        </div>

        {/* Features in 2-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", marginBottom: 14 }}>
          {["1 extra company", "AI morning briefing daily", "Key phrase highlights", "Cancel anytime"].map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: "#3B6D11", fontSize: 11 }}>✓</span>
              <span style={{ ...mono, fontSize: 10, color: theme.textMuted }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Price + CTA row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, color: theme.text }}>₹45</span>
              <span style={{ ...mono, fontSize: 10, color: theme.textMuted }}>/month</span>
            </div>
            <p style={{ ...mono, fontSize: 9, color: theme.textFaint, margin: "2px 0 0" }}>
              ₹79 on Beginner
            </p>
          </div>
          <button
            onClick={onSelect}
            disabled={!!loading}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: `0.5px solid #C18A2E`,
              borderRadius: 8,
              ...mono, fontSize: 11, letterSpacing: "0.06em",
              color: "#854F0B",
              cursor: !!loading ? "not-allowed" : "pointer",
              opacity: !!loading && !isLoading ? 0.5 : 1,
              display: "flex", alignItems: "center", gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  width: 12, height: 12,
                  border: "2px solid #C18A2E40",
                  borderTopColor: "#C18A2E",
                  borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block",
                }} />
                Processing…
              </>
            ) : "ADD A SLOT →"}
          </button>
        </div>
      </div>
    );
  }

  // Tablet/Desktop: original horizontal layout
  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: 20,
      flexWrap: "wrap",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: "#FAEEDA",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0,
      }}>
        📰
      </div>

      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 15, fontWeight: 600, color: theme.text,
          }}>
            Additional Daily Update Company
          </span>
          <span style={{
            ...mono, fontSize: 9,
            background: "#FAEEDA", color: "#854F0B",
            borderRadius: 999, padding: "2px 8px",
          }}>
            ADD-ON
          </span>
        </div>
        <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: 0, lineHeight: 1.6 }}>
          Already using your 3 free slots? Add one more company to your daily briefings.
          Each extra slot is billed separately and can be cancelled anytime.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180, flexShrink: 0 }}>
        {["1 extra company", "AI morning briefing daily", "Key phrase highlights", "Cancel anytime"].map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#3B6D11", fontSize: 11 }}>✓</span>
            <span style={{ ...mono, fontSize: 11, color: theme.textMuted }}>{f}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: "flex-end" }}>
            <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, color: theme.text }}>₹45</span>
            <span style={{ ...mono, fontSize: 11, color: theme.textMuted }}>/ month</span>
          </div>
          <p style={{ ...mono, fontSize: 10, color: theme.textFaint, margin: "2px 0 0", textAlign: "right" }}>
            per extra company · ₹79 on Beginner
          </p>
        </div>
        <button
          onClick={onSelect}
          disabled={!!loading}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: `0.5px solid #C18A2E`,
            borderRadius: 8,
            ...mono, fontSize: 11, letterSpacing: "0.06em",
            color: "#854F0B",
            cursor: !!loading ? "not-allowed" : "pointer",
            opacity: !!loading && !isLoading ? 0.5 : 1,
            display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#FAEEDA"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {isLoading ? (
            <>
              <span style={{
                width: 12, height: 12,
                border: "2px solid #C18A2E40",
                borderTopColor: "#C18A2E",
                borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block",
              }} />
              Processing…
            </>
          ) : "ADD A SLOT →"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function SubscribePage() {
  const { theme }               = useThemeStore();
  const { user, plan, setPlan } = useAppStore();
  const { requireAuth }         = useAuth();
  const router                  = useRouter();

  const width     = useWindowWidth();
  const isMobile  = width > 0 && width < 640;
  const isTablet  = width >= 640 && width < 1024;

  const [mounted,  setMounted]  = useState(false);
  const [billing,  setBilling]  = useState<Billing>("monthly");
  const [loading,  setLoading]  = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) requireAuth(); }, [mounted]);

  if (!mounted) return null;

  async function handleSelectPlan(planId: PlanType) {
    if (planId === plan) return;
    setLoading(planId);
    setError(null);
    setSuccess(null);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Check your connection.");

      const billingCycle = planId === "pay_per_report" ? "one_time" : billing;
      const { data: orderData } = await subscriptionsApi.createOrder({
        plan: planId,
        billing_cycle: billingCycle as any,
      });

      await new Promise<void>((resolve, reject) => {
        const isSubscription = planId !== "pay_per_report";
        const options: any = {
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount:      orderData.amount,
          currency:    orderData.currency ?? "INR",
          name:        "FinSight",
          description: `${planId} plan`,
          prefill: {
            email: (user as any)?.email ?? "",
            name:  (user as any)?.full_name ?? "",
          },
          theme: { color: "#B0503F" },
          modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
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
              razorpay_order_id:   response.razorpay_subscription_id ?? response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              plan:          planId,
              billing_cycle: billingCycle as any,
            });
            setPlan(planId);
            setSuccess(`You're now on the ${planId} plan. Welcome!`);
            setTimeout(() => router.push("/dashboard"), 1500);
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
    } catch (err: any) {
      if (err?.message !== "Payment cancelled.") {
        setError(err?.message ?? "Payment failed. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleAddonPurchase() {
    setLoading("addon_daily_update");
    setError(null);
    setSuccess(null);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway.");

      const { data: orderData } = await subscriptionsApi.createOrder({
        plan: "addon_daily_update" as any,
        billing_cycle: "monthly" as any,
      });

      await new Promise<void>((resolve, reject) => {
        const options: any = {
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount:      orderData.amount,
          currency:    orderData.currency ?? "INR",
          name:        "FinSight",
          description: "Daily Update — extra company slot",
          prefill: {
            email: (user as any)?.email ?? "",
            name:  (user as any)?.full_name ?? "",
          },
          theme: { color: "#C18A2E" },
          modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
          subscription_id: orderData.order_id,
        };
        options.handler = async (response: any) => {
          try {
            await subscriptionsApi.verify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_subscription_id ?? response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              plan:          "addon_daily_update" as any,
              billing_cycle: "monthly" as any,
            });
            setSuccess("Extra daily update slot added! Go to Daily Updates to configure it.");
            setTimeout(() => router.push("/updates"), 2000);
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
    } catch (err: any) {
      if (err?.message !== "Payment cancelled.") {
        setError(err?.message ?? "Payment failed. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  }

  // Grid columns: 1 on mobile, 2 on tablet (PPR alone on row 2), 3 on desktop
  const planGridCols = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, 1fr)";

  return (
    <div style={{
      color: theme.text,
      fontFamily: "'Source Serif 4', Georgia, serif",
      padding: isMobile ? "16px 14px" : "20px",
      paddingBottom: isMobile ? 88 : 20,  // bottom nav clearance on mobile
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Breadcrumb — hidden on mobile */}
        {!isMobile && (
          <div style={{ ...mono, fontSize: 10, color: theme.textFaint, display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
            Home <span>›</span> <span style={{ color: theme.text }}>Upgrade</span>
          </div>
        )}

        {/* Mobile page title */}
        {isMobile && (
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 20, fontWeight: 600, color: theme.text,
            margin: "0 0 20px",
          }}>
            Upgrade Plan
          </h1>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 20 : 32 }}>
          {!isMobile && (
            <>
              <h1 style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 26, fontWeight: 600, color: theme.text, margin: "0 0 8px",
              }}>
                Choose your plan
              </h1>
              <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: "0 0 24px" }}>
                Upgrade or change anytime. All plans include AI-powered summaries.
              </p>
            </>
          )}

          {isMobile && (
            <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: "0 0 16px", textAlign: "left" }}>
              All plans include AI-powered summaries. Cancel anytime.
            </p>
          )}

          {/* Billing toggle */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: theme.bgSecondary,
            border: `0.5px solid ${theme.border}`,
            borderRadius: 8, overflow: "hidden",
          }}>
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: isMobile ? "8px 14px" : "8px 18px",
                  background: billing === b ? `${theme.accent}18` : "transparent",
                  border: "none",
                  color: billing === b ? theme.accent : theme.textMuted,
                  ...mono, fontSize: 11, letterSpacing: "0.06em",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {b.toUpperCase()}
                {b === "yearly" && (
                  <span style={{ marginLeft: 6, fontSize: 9, color: "#3B6D11" }}>SAVE 25%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error / Success banners */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: `${theme.danger}18`, border: `0.5px solid ${theme.danger}40`,
            borderRadius: 8, padding: "12px 16px", marginBottom: 16,
            ...mono, fontSize: 12, color: theme.danger,
          }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#EAF3DE", border: "0.5px solid #3B6D1140",
            borderRadius: 8, padding: "12px 16px", marginBottom: 16,
            ...mono, fontSize: 12, color: "#3B6D11",
          }}>
            ✓ {success}
          </div>
        )}

        {/* Plan cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: planGridCols,
          gap: isMobile ? 12 : 16,
          marginBottom: isMobile ? 12 : 16,
        }}>
          {PLANS.map((p) => (
            <PlanCard
              key={p.id} plan={p} billing={billing}
              current={plan} loading={loading}
              onSelect={handleSelectPlan} theme={theme}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Add-on banner */}
        <div style={{ marginBottom: isMobile ? 20 : 32 }}>
          <div style={{ ...mono, fontSize: 9, color: theme.textFaint, letterSpacing: "0.1em", marginBottom: 10 }}>
            ADD-ONS
          </div>
          <AddonBanner
            loading={loading}
            onSelect={handleAddonPurchase}
            theme={theme}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>

        {/* FAQ strip */}
        <div style={{
          background: theme.bgSecondary,
          border: `0.5px solid ${theme.border}`,
          borderRadius: 12,
          padding: isMobile ? "16px 14px" : "22px 26px",
          marginBottom: isMobile ? 20 : 28,
        }}>
          <h3 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: isMobile ? 14 : 15,
            color: theme.text, margin: "0 0 14px", fontWeight: 600,
          }}>
            Common questions
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))",
            gap: isMobile ? 14 : 18,
          }}>
            {[
              { q: "Can I cancel anytime?", a: "Yes. Cancel from your profile — access continues until the end of your billing period." },
              { q: "What payment methods are accepted?", a: "UPI, debit/credit cards, net banking, and wallets via Razorpay." },
              { q: "Can I upgrade mid-cycle?", a: "Yes. You'll be charged the prorated difference immediately." },
              { q: "Is this financial advice?", a: "No. FinSight provides educational research only. Always consult a SEBI-registered advisor." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: isMobile ? 12 : 13, color: theme.text, margin: "0 0 4px", fontWeight: 500 }}>{q}</p>
                <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: isMobile ? 11 : 12, color: theme.textMuted, margin: 0, lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legal */}
        <p style={{
          ...mono, fontSize: 10, color: theme.textFaint,
          textAlign: "center", letterSpacing: "0.04em", lineHeight: 1.6,
          paddingTop: 16, borderTop: `0.5px solid ${theme.border}`,
        }}>
          Educational research only. Not financial advice.{" "}
          FinSight does not provide SEBI-registered investment recommendations.{" "}
          Prices in INR inclusive of applicable taxes.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}