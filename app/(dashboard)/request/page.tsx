"use client";

import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { PLAN_LIMITS } from "@/types";
import type { CompanyRequest } from "@/types";
import Link from "next/link";

// ─── Responsive hook ──────────────────────────────────────────────────────────

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

// ─── Plan slot limits ─────────────────────────────────────────────────────────

const PLAN_SLOT_CONFIG: Record<string, { user: number; platform: number }> = {
  beginner:       { user: 4,  platform: 1 },
  intermediate:   { user: 11, platform: 2 },
  pay_per_report: { user: 0,  platform: 0 },
};

// ─── Status config ────────────────────────────────────────────────────────────

type RequestStatus = "pending" | "in_progress" | "completed" | "rejected";

function getStatusConfig(status: RequestStatus, theme: any) {
  const map: Record<RequestStatus, { color: string; label: string; icon: string }> = {
    pending:     { color: theme.info ?? "#185FA5",   label: "PENDING",     icon: "◌" },
    in_progress: { color: "#C18A2E",                 label: "IN PROGRESS", icon: "◑" },
    completed:   { color: "#3B6D11",                 label: "COMPLETE",    icon: "◉" },
    rejected:    { color: theme.danger ?? "#B0503F", label: "REJECTED",    icon: "✕" },
  };
  const key = (status === ("complete" as any) ? "completed" : status) as RequestStatus;
  return map[key] ?? map.pending;
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmModal({
  companyName, slotNumber, onConfirm, onCancel, submitting, theme,
}: {
  companyName: string; slotNumber: number;
  onConfirm: () => void; onCancel: () => void;
  submitting: boolean; theme: any;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const ordinal = ["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th"][slotNumber - 1] ?? `#${slotNumber}`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{
        background: theme.bg,
        border: `0.5px solid ${theme.border}`,
        borderRadius: 12, padding: "28px",
        maxWidth: 440, width: "100%",
        boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "#FAECE7",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, marginBottom: 16,
        }}>📋</div>
        <h2 style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: 17, fontWeight: 600, color: theme.text, margin: "0 0 8px",
        }}>
          Request {companyName}?
        </h2>
        <p style={{ ...mono, fontSize: 11, color: theme.textMuted, lineHeight: 1.7, margin: "0 0 12px" }}>
          This will be your{" "}
          <span style={{ color: theme.text, fontWeight: 500 }}>{ordinal} company request</span>{" "}
          this month.
        </p>
        <div style={{
          background: "#FEF3C7", border: "0.5px solid #C18A2E40",
          borderRadius: 8, padding: "10px 14px", marginBottom: 22,
          display: "flex", gap: 8,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
          <p style={{ ...mono, fontSize: 11, color: "#854F0B", margin: 0, lineHeight: 1.6 }}>
            Once submitted, this request cannot be changed or cancelled.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onConfirm}
            disabled={submitting}
            style={{
              flex: 1, padding: "10px 0",
              background: "#B0503F", color: "#fff",
              border: "none", borderRadius: 8,
              ...mono, fontSize: 11, letterSpacing: "0.06em",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {submitting ? (
              <>
                <span style={{
                  width: 12, height: 12,
                  border: "2px solid #ffffff40", borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                  display: "inline-block",
                }} />
                Submitting…
              </>
            ) : "YES, SUBMIT REQUEST"}
          </button>
          <button
            onClick={onCancel}
            disabled={submitting}
            style={{
              flex: 1, padding: "10px 0",
              background: "transparent", color: theme.textMuted,
              border: `0.5px solid ${theme.border}`, borderRadius: 8,
              ...mono, fontSize: 11, letterSpacing: "0.06em",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Slot card ────────────────────────────────────────────────────────────────

function SlotCard({
  index, total, request, theme, isMobile,
}: {
  index: number; total: number;
  request: CompanyRequest | null;
  theme: any; isMobile: boolean;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const slotNum   = index + 1;
  const isEmpty   = !request;
  const statusCfg = request ? getStatusConfig(request.status as RequestStatus, theme) : null;

  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 10,
      padding: isMobile ? "12px 12px" : "14px 16px",
      display: "flex", alignItems: "flex-start", gap: isMobile ? 10 : 12,
      opacity: isEmpty ? 0.7 : 1,
    }}>
      {/* Slot number */}
      <div style={{
        ...mono, fontSize: 11, fontWeight: 500,
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: isEmpty ? theme.border : "#B0503F",
        color: isEmpty ? theme.textFaint : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: 1,
      }}>
        {slotNum}
      </div>

      {isEmpty ? (
        <div style={{ flex: 1 }}>
          <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textFaint, margin: 0 }}>
            Slot {slotNum} of {total} — not yet requested
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Company name + ticker + locked badge */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: 8, marginBottom: 4,
            flexWrap: "wrap",
          }}>
            <span style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: isMobile ? 13 : 14, fontWeight: 500, color: theme.text,
            }}>
              {request!.company_name}
            </span>
            {request!.ticker && (
              <span style={{
                ...mono, fontSize: 10,
                color: "#993C1D", background: "#FAECE7",
                borderRadius: 4, padding: "1px 6px",
              }}>
                {request!.ticker}
              </span>
            )}
            <span style={{
              ...mono, fontSize: 9,
              color: theme.textFaint,
              border: `0.5px solid ${theme.border}`,
              borderRadius: 4, padding: "1px 6px",
              marginLeft: "auto",
            }}>
              🔒 LOCKED
            </span>
          </div>

          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              ...mono, fontSize: 9, letterSpacing: "0.07em",
              color: statusCfg!.color,
              background: statusCfg!.color + "18",
              border: `0.5px solid ${statusCfg!.color}33`,
              borderRadius: 999, padding: "2px 8px",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>{statusCfg!.icon}</span>
              {statusCfg!.label}
            </span>
            <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>
              {new Date(request!.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>

          {/* Admin note */}
          {request!.admin_note && (
            <p style={{
              ...mono, fontSize: 11,
              color: request!.status === "rejected" ? theme.danger : "#3B6D11",
              margin: "6px 0 0",
            }}>
              Admin: {request!.admin_note}
            </p>
          )}

          {/* Link to report if complete */}
          {request!.status === "completed" && (request! as any).report_id && (
            <Link
              href={`/reports/${(request! as any).report_id}`}
              style={{
                ...mono, fontSize: 10, letterSpacing: "0.06em",
                color: "#3B6D11", textDecoration: "none",
                display: "inline-block", marginTop: 8,
              }}
            >
              VIEW REPORT →
            </Link>
          )}

          {/* Message */}
          {request!.message && (
            <p style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: 12, color: theme.textMuted,
              margin: "6px 0 0", lineHeight: 1.5,
            }}>
              {request!.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Platform pick slot ───────────────────────────────────────────────────────

function PlatformSlot({ index, theme, isMobile }: { index: number; theme: any; isMobile: boolean }) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px dashed ${theme.border}`,
      borderRadius: 10,
      padding: isMobile ? "12px 12px" : "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      opacity: 0.6,
    }}>
      <div style={{
        ...mono, fontSize: 11,
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: "#FAEEDA", color: "#854F0B",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        ★
      </div>
      <div>
        <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, margin: "0 0 2px" }}>
          Platform pick #{index + 1}
        </p>
        <p style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.textFaint, margin: 0 }}>
          Curated by FinSight team · revealed monthly
        </p>
      </div>
    </div>
  );
}

// ─── Locked state ─────────────────────────────────────────────────────────────

function LockedState({ theme, isMobile }: { theme: any; isMobile: boolean }) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  return (
    <div style={{ color: theme.text }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "16px 14px" : "20px", paddingBottom: isMobile ? 86 : 20 }}>
        {isMobile ? (
          <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 600, color: theme.text, margin: "0 0 16px" }}>
            Request a company
          </h1>
        ) : (
          <div style={{ ...mono, fontSize: 10, color: theme.textFaint, display: "flex", gap: 5, marginBottom: 20 }}>
            Home <span>›</span> <span style={{ color: theme.text }}>Request</span>
          </div>
        )}
        <div style={{
          background: theme.bgSecondary,
          border: `0.5px solid ${theme.border}`,
          borderRadius: 12,
          padding: isMobile ? "36px 20px" : "48px 32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
          <h2 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: isMobile ? 17 : 20, fontWeight: 600, color: theme.text, margin: "0 0 10px",
          }}>
            Upgrade to request reports
          </h2>
          <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, lineHeight: 1.7, margin: "0 auto 24px", maxWidth: 380 }}>
            Company requests are available on the Beginner plan and above.
            Upgrade to pick the companies you want analysed.
          </p>
          <Link href="/subscribe" style={{
            background: "#B0503F", color: "#fff",
            borderRadius: 8, padding: "10px 24px",
            ...mono, fontSize: 11, letterSpacing: "0.06em",
            textDecoration: "none", display: "inline-block",
          }}>
            VIEW PLANS →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RequestPage() {
  const { theme }       = useThemeStore();
  const { plan }        = useAppStore();
  const { requireAuth } = useAuth();
  const width    = useWindowWidth();
  const isMobile = width > 0 && width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [mounted,        setMounted]        = useState(false);
  const [companyName,    setCompanyName]    = useState("");
  const [ticker,         setTicker]         = useState("");
  const [exchange,       setExchange]       = useState<"BSE" | "NSE" | "">("");
  const [message,        setMessage]        = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [pastRequests,   setPastRequests]   = useState<CompanyRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showConfirm,    setShowConfirm]    = useState(false);

  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) requireAuth(); }, [mounted]);
  useEffect(() => {
    if (mounted && plan !== "free") fetchHistory();
  }, [mounted, plan]);

  if (!mounted) return null;
  if (plan === "free") return <LockedState theme={theme} isMobile={isMobile} />;

  const slotCfg    = PLAN_SLOT_CONFIG[plan] ?? { user: 4, platform: 1 };
  const userSlots  = slotCfg.user;
  const platSlots  = slotCfg.platform;
  const usedSlots  = pastRequests.length;
  const slotsLeft  = Math.max(0, userSlots - usedSlots);
  const atLimit    = slotsLeft === 0;

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      const res = await api.get("/requests/my");
      setPastRequests(res.data ?? []);
    } catch {
      setPastRequests([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleConfirmedSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post("/requests", {
        company_name: companyName.trim(),
        ticker:   ticker.trim() || undefined,
        exchange: exchange || undefined,
        message:  message.trim() || undefined,
      });
      setPastRequests(prev => [res.data, ...prev]);
      setCompanyName(""); setTicker(""); setExchange(""); setMessage("");
      setShowConfirm(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to submit. Please try again.");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRequestClick() {
    if (!companyName.trim() || companyName.trim().length < 2) return;
    setError(null);
    setShowConfirm(true);
  }

  const canRequest = companyName.trim().length >= 2 && !submitting && !atLimit;

  const slotArray: (CompanyRequest | null)[] = Array.from(
    { length: userSlots },
    (_, i) => pastRequests[i] ?? null
  );

  return (
    <div style={{ color: theme.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>
      <div style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: isMobile ? "16px 14px" : "20px",
        paddingBottom: isMobile ? 86 : 20,
      }}>

        {/* ── Breadcrumb / Page title ── */}
        {isMobile ? (
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 20, fontWeight: 600, color: theme.text, margin: "0 0 14px",
          }}>
            Request a company
          </h1>
        ) : (
          <>
            <div style={{ ...mono, fontSize: 10, color: theme.textFaint, display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
              Home <span>›</span> <span style={{ color: theme.text }}>Request</span>
            </div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 22, fontWeight: 600, color: theme.text, margin: "0 0 6px",
              }}>
                Request a company
              </h1>
              <p style={{ ...mono, fontSize: 11, color: theme.textMuted }}>
                We'll generate an AI-powered report within 24 hours of your request.
              </p>
            </div>
          </>
        )}

        {/* ── Slots overview card ── */}
        <div style={{
          background: theme.bgSecondary,
          border: `0.5px solid ${theme.border}`,
          borderRadius: 10,
          marginBottom: isMobile ? 14 : 20,
          overflow: "hidden",
        }}>
          <div style={{
            padding: isMobile ? "10px 12px" : "12px 16px",
            borderBottom: `0.5px solid ${theme.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ ...mono, fontSize: isMobile ? 10 : 11, fontWeight: 500, color: theme.text, letterSpacing: "0.07em" }}>
              YOUR REQUEST SLOTS
            </span>
            <span style={{ ...mono, fontSize: 10, color: atLimit ? "#B0503F" : theme.textFaint }}>
              {usedSlots}/{userSlots} used
              {platSlots > 0 && ` · +${platSlots} platform pick${platSlots > 1 ? "s" : ""}`}
            </span>
          </div>

          <div style={{ padding: isMobile ? "10px 10px" : "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {loadingHistory ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 54, borderRadius: 8,
                  background: theme.border, opacity: 0.3,
                  animation: "pulse 1.4s ease-in-out infinite",
                }} />
              ))
            ) : (
              <>
                {slotArray.map((req, i) => (
                  <SlotCard
                    key={i} index={i}
                    total={userSlots}
                    request={req}
                    theme={theme}
                    isMobile={isMobile}
                  />
                ))}
                {Array.from({ length: platSlots }, (_, i) => (
                  <PlatformSlot key={`plat-${i}`} index={i} theme={theme} isMobile={isMobile} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Request form / at-limit state ── */}
        {atLimit ? (
          <div style={{
            background: theme.bgSecondary,
            border: `0.5px solid ${theme.border}`,
            borderRadius: 10,
            padding: isMobile ? "24px 16px" : "28px 24px",
            textAlign: "center",
            marginBottom: isMobile ? 14 : 20,
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
            <h3 style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: isMobile ? 15 : 16, fontWeight: 600, color: theme.text, margin: "0 0 8px",
            }}>
              All request slots filled
            </h3>
            <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, lineHeight: 1.7, margin: "0 auto 20px", maxWidth: 380 }}>
              You've used all {userSlots} of your monthly request slots.
              Slots reset on the 1st of each month, or upgrade for more.
            </p>
            <Link href="/subscribe" style={{
              ...mono, fontSize: 11, letterSpacing: "0.06em",
              background: "transparent",
              border: "0.5px solid #C18A2E",
              color: "#854F0B",
              borderRadius: 8, padding: "9px 20px",
              textDecoration: "none", display: "inline-block",
            }}>
              UPGRADE FOR MORE SLOTS →
            </Link>
          </div>
        ) : (
          <div style={{
            background: theme.bgSecondary,
            border: `0.5px solid ${theme.border}`,
            borderRadius: 10,
            padding: isMobile ? "16px 14px" : "22px 20px",
            marginBottom: isMobile ? 14 : 20,
          }}>
            {/* Form header */}
            <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ ...mono, fontSize: isMobile ? 10 : 11, fontWeight: 500, color: theme.text, letterSpacing: "0.07em" }}>
                NEW REQUEST
              </span>
              <span style={{
                ...mono, fontSize: 10,
                background: "#FAECE7", color: "#993C1D",
                borderRadius: 999, padding: "2px 8px",
              }}>
                Slot {usedSlots + 1} of {userSlots}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 16 }}>
              {/* Company name */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ ...mono, fontSize: 10, color: theme.textMuted, letterSpacing: "0.07em" }}>
                  COMPANY NAME *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reliance Industries"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    background: theme.bg,
                    border: `0.5px solid ${theme.border}`,
                    borderRadius: 8, padding: "10px 14px",
                    fontSize: isMobile ? 13 : 14, color: theme.text,
                    outline: "none", boxSizing: "border-box",
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    opacity: submitting ? 0.5 : 1,
                  }}
                />
              </div>

              {/* Ticker + Exchange — stacked on mobile, side-by-side on tablet+ */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? 14 : 12,
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ ...mono, fontSize: 10, color: theme.textMuted, letterSpacing: "0.07em" }}>
                    TICKER
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RELIANCE"
                    value={ticker}
                    onChange={e => setTicker(e.target.value.toUpperCase())}
                    disabled={submitting}
                    maxLength={20}
                    style={{
                      width: "100%",
                      background: theme.bg,
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: 8, padding: "10px 14px",
                      fontSize: 13, color: theme.text,
                      outline: "none", boxSizing: "border-box",
                      ...mono,
                      opacity: submitting ? 0.5 : 1,
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ ...mono, fontSize: 10, color: theme.textMuted, letterSpacing: "0.07em" }}>
                    EXCHANGE
                  </label>
                  <select
                    value={exchange}
                    onChange={e => setExchange(e.target.value as "BSE" | "NSE" | "")}
                    disabled={submitting}
                    style={{
                      width: "100%",
                      background: theme.bg,
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: 8, padding: "10px 14px",
                      fontSize: 13, color: theme.text,
                      outline: "none", boxSizing: "border-box",
                      fontFamily: "IBM Plex Mono, monospace",
                      opacity: submitting ? 0.5 : 1,
                      cursor: "pointer",
                      // Ensures the select height matches inputs on mobile
                      height: 42,
                    }}
                  >
                    <option value="">Not sure</option>
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ ...mono, fontSize: 10, color: theme.textMuted, letterSpacing: "0.07em" }}>
                  NOTES{" "}
                  <span style={{ color: theme.textFaint }}>— optional</span>
                </label>
                <textarea
                  placeholder="What specifically would you like analysed? e.g. debt levels, Q3 results, management changes…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={submitting}
                  rows={isMobile ? 3 : 3}
                  style={{
                    width: "100%",
                    background: theme.bg,
                    border: `0.5px solid ${theme.border}`,
                    borderRadius: 8, padding: "10px 14px",
                    fontSize: 13, color: theme.text,
                    outline: "none", boxSizing: "border-box",
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    resize: "vertical", lineHeight: 1.6,
                    opacity: submitting ? 0.5 : 1,
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: `${theme.danger}15`,
                  border: `0.5px solid ${theme.danger}40`,
                  borderRadius: 8, padding: "10px 14px",
                  ...mono, fontSize: isMobile ? 10 : 11, color: theme.danger,
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Submit — always full width */}
              <button
                onClick={handleRequestClick}
                disabled={!canRequest}
                style={{
                  width: "100%", padding: "11px",
                  background: canRequest ? "#B0503F" : "transparent",
                  border: `0.5px solid ${canRequest ? "#B0503F" : theme.border}`,
                  borderRadius: 8,
                  ...mono, fontSize: isMobile ? 10 : 11, letterSpacing: "0.06em",
                  color: canRequest ? "#fff" : theme.textFaint,
                  cursor: canRequest ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                }}
              >
                SUBMIT REQUEST →
              </button>
            </div>
          </div>
        )}

        {/* ── Info strip — 1-col on mobile, auto-fit on tablet+ ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
          gap: isMobile ? 8 : 10,
          marginBottom: isMobile ? 20 : 28,
        }}>
          {[
            { icon: "⏱", title: "24-hour delivery", desc: "Most reports ready within one business day" },
            { icon: "🤖", title: "AI + human reviewed", desc: "AI generates, our team reviews before sending" },
            { icon: "🔒", title: "Secure viewer", desc: "Reports open in our secure viewer — not downloadable" },
          ].map(item => (
            <div key={item.title} style={{
              background: theme.bgSecondary,
              border: `0.5px solid ${theme.border}`,
              borderRadius: 10,
              padding: isMobile ? "12px 14px" : "14px 16px",
              // Horizontal layout on mobile: icon + text side by side
              display: isMobile ? "flex" : "block",
              alignItems: isMobile ? "flex-start" : undefined,
              gap: isMobile ? 12 : 0,
            }}>
              <div style={{ fontSize: isMobile ? 16 : 18, marginBottom: isMobile ? 0 : 6, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: isMobile ? 12 : 13, color: theme.text,
                  margin: isMobile ? "0 0 3px" : "0 0 4px", fontWeight: 500,
                }}>
                  {item.title}
                </p>
                <p style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.textMuted, margin: 0, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Legal */}
        <p style={{
          ...mono, fontSize: 10, color: theme.textFaint,
          textAlign: "center", letterSpacing: "0.04em",
          paddingTop: 16, marginTop: 8,
          borderTop: `0.5px solid ${theme.border}`,
        }}>
          Educational research only. Not financial advice.
          FinSight does not provide SEBI-registered investment recommendations.
        </p>
      </div>

      {/* ── Confirmation modal ── */}
      {showConfirm && (
        <ConfirmModal
          companyName={companyName.trim()}
          slotNumber={usedSlots + 1}
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setShowConfirm(false)}
          submitting={submitting}
          theme={theme}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.15} }
        input::placeholder, textarea::placeholder { color: ${theme.textFaint}; }
        input:focus, textarea:focus, select:focus {
          border-color: ${theme.accent}80 !important;
        }
      `}</style>
    </div>
  );
}