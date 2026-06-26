"use client";

import Link from "next/link";

type Plan = "free" | "starter" | "pro";

interface SubscriptionGateProps {
  children: React.ReactNode;
  requiredPlan: Plan;
  currentPlan?: Plan;
  fallback?: React.ReactNode;
}

const PLAN_RANK: Record<Plan, number> = { free: 0, starter: 1, pro: 2 };

const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

const PLAN_PRICES: Record<Plan, string> = {
  free: "₹0",
  starter: "₹199/mo",
  pro: "₹799/mo",
};

export function SubscriptionGate({
  children,
  requiredPlan,
  currentPlan = "free",
  fallback,
}: SubscriptionGateProps) {
  const hasAccess = PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan];

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="gate-root">
      <div className="gate-card">
        <div className="gate-icon">◈</div>
        <h3 className="gate-title">
          {PLAN_LABELS[requiredPlan]} plan required
        </h3>
        <p className="gate-desc">
          This content is available on the{" "}
          <strong style={{ color: "#C9A84C" }}>{PLAN_LABELS[requiredPlan]}</strong>{" "}
          plan ({PLAN_PRICES[requiredPlan]}). Upgrade to unlock full access.
        </p>
        <Link href="/subscribe" className="gate-btn">
          Upgrade to {PLAN_LABELS[requiredPlan]}
        </Link>
        <p className="gate-note">7-day free trial · Cancel anytime</p>
      </div>

      <style jsx>{`
        .gate-root {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          font-family: 'Georgia', serif;
        }
        .gate-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 12px;
          padding: 36px 32px;
          max-width: 380px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .gate-icon {
          font-size: 28px;
          color: #C9A84C;
          opacity: 0.6;
        }
        .gate-title {
          font-family: 'Georgia', serif;
          font-size: 18px;
          font-weight: 400;
          color: #E8E6DF;
          margin: 0;
        }
        .gate-desc {
          font-family: 'Georgia', serif;
          font-size: 14px;
          color: rgba(232,230,223,0.5);
          line-height: 1.65;
          margin: 0;
        }
        .gate-btn {
          background: #C9A84C;
          color: #080C18;
          border-radius: 6px;
          padding: 11px 24px;
          font-family: 'Georgia', serif;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          display: inline-block;
          margin-top: 4px;
          transition: background 0.2s;
        }
        .gate-btn:hover { background: #D4B862; }
        .gate-note {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          color: rgba(232,230,223,0.25);
          margin: 0;
        }
      `}</style>
    </div>
  );
}

interface PlanGateProps {
  children: React.ReactNode;
  allowedPlans: Plan[];
  currentPlan?: Plan;
}

export function PlanGate({
  children,
  allowedPlans,
  currentPlan = "free",
}: PlanGateProps) {
  if (allowedPlans.includes(currentPlan)) return <>{children}</>;

  return (
    <SubscriptionGate
      requiredPlan={allowedPlans[allowedPlans.length - 1]}
      currentPlan={currentPlan}
    >
      {children}
    </SubscriptionGate>
  );
}