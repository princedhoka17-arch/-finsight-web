"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";

type Plan = "free" | "beginner" | "intermediate" | "pay_per_report";

interface PlanGateProps {
  children: React.ReactNode;
  requiredPlan: Plan;
  fallback?: React.ReactNode;
  redirectTo?: string;
  /** If true, renders children with a blurred overlay instead of blocking */
  blurPreview?: boolean;
}

const PLAN_HIERARCHY: Record<Plan, number> = {
  free: 0,
  pay_per_report: 1,
  beginner: 2,
  intermediate: 3,
};

const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pay_per_report: "Pay Per Report",
  beginner: "Beginner",
  intermediate: "Intermediate",
};

const PLAN_PRICES: Record<Plan, string> = {
  free: "",
  pay_per_report: "₹149/report",
  beginner: "₹249/month",
  intermediate: "₹799/month",
};

export default function PlanGate({
  children,
  requiredPlan,
  fallback,
  redirectTo = "/subscribe",
  blurPreview = false,
}: PlanGateProps) {
  const { theme } = useThemeStore();
  const { user } = useAppStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const userPlan: Plan = (user?.plan as Plan) || "free";
  const userLevel = PLAN_HIERARCHY[userPlan] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? 0;
  const hasAccess = userLevel >= requiredLevel;

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  // Blur preview mode — show content blurred with upgrade overlay
  if (blurPreview) {
    return (
      <div style={{ position: "relative", overflow: "hidden", borderRadius: "12px" }}>
        {/* Blurred children */}
        <div
          style={{
            filter: "blur(6px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.4,
          }}
        >
          {children}
        </div>

        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `${theme.bg}cc`,
            backdropFilter: "blur(2px)",
            gap: "12px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Courier New, monospace",
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: theme.accent,
              textTransform: "uppercase",
              background: `${theme.accent}18`,
              border: `1px solid ${theme.accent}40`,
              padding: "4px 12px",
              borderRadius: "4px",
            }}
          >
            {PLAN_LABELS[requiredPlan]} Plan
          </div>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "14px",
              color: theme.textMuted,
              maxWidth: "280px",
              lineHeight: "1.6",
            }}
          >
            Upgrade to{" "}
            <strong style={{ color: theme.text }}>
              {PLAN_LABELS[requiredPlan]}
            </strong>{" "}
            to unlock this content.
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            style={{
              padding: "10px 24px",
              background: theme.accent,
              color: theme.accentText,
              border: "none",
              borderRadius: "8px",
              fontFamily: "Courier New, monospace",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = theme.accentHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = theme.accent)
            }
          >
            UPGRADE {PLAN_PRICES[requiredPlan] ? `— ${PLAN_PRICES[requiredPlan]}` : ""}
          </button>
        </div>
      </div>
    );
  }

  // Hard block mode
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "280px",
        padding: "40px 24px",
        background: theme.bgSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: "16px",
        textAlign: "center",
        gap: "14px",
      }}
    >
      {/* Plan badge */}
      <div
        style={{
          fontFamily: "Courier New, monospace",
          fontSize: "11px",
          letterSpacing: "0.1em",
          color: theme.accent,
          background: `${theme.accent}18`,
          border: `1px solid ${theme.accent}40`,
          padding: "5px 14px",
          borderRadius: "4px",
          textTransform: "uppercase",
        }}
      >
        {PLAN_LABELS[requiredPlan]} Required
      </div>

      <div>
        <h3
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "18px",
            fontWeight: 600,
            color: theme.text,
            marginBottom: "8px",
          }}
        >
          Upgrade Your Plan
        </h3>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "14px",
            color: theme.textMuted,
            maxWidth: "320px",
            lineHeight: "1.6",
          }}
        >
          You are on the{" "}
          <strong style={{ color: theme.text }}>{PLAN_LABELS[userPlan]}</strong>{" "}
          plan. This feature requires{" "}
          <strong style={{ color: theme.accent }}>
            {PLAN_LABELS[requiredPlan]}
          </strong>{" "}
          or above.
        </p>
      </div>

      {/* Plan comparison */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "4px",
        }}
      >
        {(["beginner", "intermediate"] as Plan[]).map((plan) => (
          <div
            key={plan}
            style={{
              padding: "10px 16px",
              background:
                plan === requiredPlan
                  ? `${theme.accent}18`
                  : theme.bg,
              border: `1px solid ${
                plan === requiredPlan ? theme.accent : theme.border
              }`,
              borderRadius: "8px",
              textAlign: "center",
              minWidth: "120px",
            }}
          >
            <div
              style={{
                fontFamily: "Courier New, monospace",
                fontSize: "11px",
                color:
                  plan === requiredPlan ? theme.accent : theme.textMuted,
                letterSpacing: "0.06em",
                marginBottom: "4px",
              }}
            >
              {PLAN_LABELS[plan].toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                fontWeight: 600,
                color: theme.text,
              }}
            >
              {PLAN_PRICES[plan]}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push(redirectTo)}
        style={{
          marginTop: "6px",
          padding: "12px 28px",
          background: theme.accent,
          color: theme.accentText,
          border: "none",
          borderRadius: "8px",
          fontFamily: "Courier New, monospace",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = theme.accentHover)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = theme.accent)
        }
      >
        SEE ALL PLANS →
      </button>

      <p
        style={{
          fontFamily: "Courier New, monospace",
          fontSize: "11px",
          color: theme.textFaint,
        }}
      >
        Educational research only. Not financial advice.
      </p>
    </div>
  );
}