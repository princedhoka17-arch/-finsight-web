"use client";

import { useState } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import type { PlanType } from "@/types/index";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

interface RazorpayButtonProps {
  plan: PlanType;
  billing?: "monthly" | "yearly";
  reportId?: string;
  amount: number;
  label?: string;
  fullWidth?: boolean;
  onSuccess?: (planOrReportId: string) => void;
  onError?: (error: string) => void;
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  beginner: "Beginner Plan — FinSight",
  intermediate: "Intermediate Plan — FinSight",
  pay_per_report: "Pay Per Report — FinSight",
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayButton({
  plan,
  billing = "monthly",
  reportId,
  amount,
  label,
  fullWidth = false,
  onSuccess,
  onError,
}: RazorpayButtonProps) {
  const { theme } = useThemeStore();
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonLabel = label ?? (
    plan === "pay_per_report"
      ? `Buy Report — ₹${amount}`
      : `Subscribe — ₹${amount}/${billing === "yearly" ? "yr" : "mo"}`
  );

  async function handlePayment() {
    setLoading(true);
    setError(null);

    // Step 1 — Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      const msg = "Failed to load payment gateway. Please try again.";
      setError(msg);
      onError?.(msg);
      setLoading(false);
      return;
    }

    try {
      // Step 2 — Create order via FastAPI
      // TODO: Connect to FastAPI POST /subscriptions/create or /payments/create
      const res = await fetch(
        plan === "pay_per_report"
          ? `${process.env.NEXT_PUBLIC_API_URL}/payments/create`
          : `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // TODO: Add Supabase JWT token
            // Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            plan,
            billing_cycle: billing,
            amount,
            currency: "INR",
            report_id: reportId ?? null,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to create payment order. Please try again.");
      }

      const order = await res.json();

      // Step 3 — Open Razorpay checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount: order.amount,
        currency: order.currency ?? "INR",
        name: "FinSight",
        description: PLAN_DESCRIPTIONS[plan] ?? "FinSight Payment",
        order_id: order.razorpay_order_id,
        prefill: {
          name: user?.full_name ?? "",
          email: user?.email ?? "",
        },
        theme: {
          color: theme.accent,
        },
        handler: async (response: RazorpayResponse) => {
          // Step 4 — Verify payment via FastAPI
          try {
            // TODO: Connect to FastAPI POST /payments/verify
            const verifyRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/payments/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  // TODO: Add Supabase JWT token
                  // Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  plan,
                  report_id: reportId ?? null,
                }),
              }
            );

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed.");
            }

            onSuccess?.(reportId ?? plan);
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Payment verification failed.";
            setError(msg);
            onError?.(msg);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      onError?.(msg);
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      width: fullWidth ? "100%" : "auto",
    }}>
      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          width: fullWidth ? "100%" : "auto",
          padding: "0.875rem 1.75rem",
          background: loading
            ? `${theme.accent}80`
            : theme.accent,
          border: "none",
          borderRadius: "10px",
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: theme.accentText,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
          fontFamily: "Georgia, serif",
          letterSpacing: "0.02em",
          transition: "all 0.15s",
          boxShadow: `0 0 0 0 ${theme.accent}40`,
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLElement).style.background = theme.accentHover;
            (e.currentTarget as HTMLElement).style.boxShadow =
              `0 0 0 4px ${theme.accent}25`;
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLElement).style.background = theme.accent;
            (e.currentTarget as HTMLElement).style.boxShadow =
              `0 0 0 0 ${theme.accent}40`;
          }
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
              animation: "rzp-spin 0.6s linear infinite",
              display: "inline-block",
              flexShrink: 0,
            }} />
            Processing…
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            {buttonLabel}
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          background: `${theme.danger}12`,
          border: `1px solid ${theme.danger}30`,
          borderRadius: "8px",
          padding: "0.625rem 0.875rem",
          fontSize: "0.8125rem",
          color: theme.danger,
          fontFamily: "Georgia, serif",
          lineHeight: 1.5,
        }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: "1px" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Secured by Razorpay badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.4rem",
        fontFamily: "Courier New, monospace",
        fontSize: "10px",
        color: theme.textFaint,
        letterSpacing: "0.04em",
      }}>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Secured by Razorpay · 256-bit SSL
      </div>

      {/* Legal */}
      <p style={{
        fontFamily: "Courier New, monospace",
        fontSize: "9px",
        color: theme.textFaint,
        textAlign: "center",
        margin: 0,
        lineHeight: 1.5,
        letterSpacing: "0.03em",
      }}>
        Educational research only. Not financial advice.
        Cancel anytime.
      </p>

      <style>{`
        @keyframes rzp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}