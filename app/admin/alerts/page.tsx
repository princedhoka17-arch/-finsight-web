"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AlertPriority = "Low" | "Medium" | "High" | "Critical";
type AlertAudience = "all_watchers" | "all_users" | "pro_users";

interface Alert {
  id: string;
  ticker: string;
  company_name?: string;
  title: string;
  message: string;
  impact_tags: string[];
  priority: AlertPriority;
  audience: AlertAudience;
  is_sent: boolean;
  sent_at?: string;
  recipient_count?: number;
  created_at: string;
}

interface AlertDraft {
  ticker: string;
  title: string;
  message: string;
  impact_tags: string[];
  priority: AlertPriority;
  audience: AlertAudience;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const PRIORITY_CONFIG: Record<AlertPriority, {
  strip: string; badge: string; badgeText: string;
  border: string; bg: string; label: string;
}> = {
  Low:      { strip: "#16a34a", badge: "#f0fdf4", badgeText: "#14532d", border: "#bbf7d0", bg: "#f0fdf4", label: "LOW" },
  Medium:   { strip: "#d97706", badge: "#fffbeb", badgeText: "#78350f", border: "#fde68a", bg: "#fffbeb", label: "MEDIUM" },
  High:     { strip: "#dc2626", badge: "#fef2f2", badgeText: "#7f1d1d", border: "#fecaca", bg: "#fef2f2", label: "HIGH" },
  Critical: { strip: "#7f1d1d", badge: "#fecaca", badgeText: "#450a0a", border: "#dc2626", bg: "#fff1f1", label: "CRITICAL" },
};

const AUDIENCE_LABELS: Record<AlertAudience, string> = {
  all_watchers: "Watchers of this ticker",
  all_users:    "All users",
  pro_users:    "Pro users only",
};

const ALL_IMPACT_TAGS = [
  "Price action", "Liquidity risk", "Earnings",
  "Regulatory", "Macro", "Promoter action",
];

const EMPTY_DRAFT: AlertDraft = {
  ticker: "",
  title: "",
  message: "",
  impact_tags: [],
  priority: "Medium",
  audience: "all_watchers",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Phone Preview ────────────────────────────────────────────────────────────

function PhonePreview({ draft }: { draft: AlertDraft }) {
  const p = PRIORITY_CONFIG[draft.priority];
  const activeImpact = draft.impact_tags;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <p style={{
        margin: 0, fontSize: 10, color: "#94a3b8",
        letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500,
      }}>
        Live preview
      </p>

      {/* Phone shell */}
      <div style={{
        width: 268,
        borderRadius: 30,
        background: "#0f172a",
        padding: "10px 8px 14px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.07)",
      }}>
        {/* Notch */}
        <div style={{
          width: 72, height: 18, background: "#020617",
          borderRadius: "0 0 10px 10px", margin: "0 auto 10px",
        }} />

        {/* Lock screen time */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 28, fontWeight: 200, color: "#fff", lineHeight: 1 }}>09:41</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Monday, 22 June</div>
        </div>

        {/* Notification card */}
        <div style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          {/* Priority strip */}
          <div style={{ height: 3, background: p.strip }} />

          <div style={{ padding: "12px 14px 14px" }}>
            {/* App row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                background: "#7f1d1d",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#fecaca", fontWeight: 700,
              }}>F</div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b" }}>FinSight</span>
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>now</span>
            </div>

            {/* Priority badge */}
            <div style={{
              display: "inline-block",
              fontSize: 9, fontWeight: 700, letterSpacing: "0.07em",
              background: p.badge, color: p.badgeText,
              borderRadius: 4, padding: "2px 6px", marginBottom: 6,
            }}>
              {p.label}
            </div>

            {/* Title */}
            <div style={{
              fontSize: 13, fontWeight: 700, color: "#0f172a",
              lineHeight: 1.3, marginBottom: 5,
            }}>
              {draft.ticker
                ? <span style={{ color: p.strip }}>{draft.ticker} · </span>
                : null}
              {draft.title || <span style={{ color: "#94a3b8", fontWeight: 400 }}>Alert title…</span>}
            </div>

            {/* Message */}
            <div style={{
              fontSize: 11, color: "#334155", lineHeight: 1.45, marginBottom: 8,
            }}>
              {draft.message || <span style={{ color: "#cbd5e1" }}>Message body…</span>}
            </div>

            {/* Impact tags */}
            {activeImpact.length > 0 && (
              <div style={{
                borderLeft: `2px solid ${p.strip}`,
                paddingLeft: 7,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: p.strip, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Impact:{" "}
                </span>
                <span style={{ fontSize: 10, color: "#475569" }}>
                  {activeImpact.join(" · ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Home bar */}
        <div style={{
          width: 72, height: 3, background: "rgba(255,255,255,0.2)",
          borderRadius: 2, margin: "12px auto 0",
        }} />
      </div>
    </div>
  );
}

// ─── Alert History Row ────────────────────────────────────────────────────────

function AlertHistoryRow({
  alert,
  isSelected,
  onSelect,
}: {
  alert: Alert;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const p = PRIORITY_CONFIG[alert.priority];

  return (
    <div
      onClick={onSelect}
      style={{
        display: "grid",
        gridTemplateColumns: "3px 1fr",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${isSelected ? p.strip : "#e2e8f0"}`,
        background: isSelected ? p.bg : "#fff",
        cursor: "pointer",
        transition: "border-color 0.15s",
        marginBottom: 8,
      }}
    >
      <div style={{ background: p.strip }} />
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{alert.ticker}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
            background: p.badge, color: p.badgeText,
            borderRadius: 3, padding: "1px 5px",
          }}>{p.label}</span>
          {alert.is_sent && (
            <span style={{
              fontSize: 10, color: "#16a34a", background: "#f0fdf4",
              borderRadius: 3, padding: "1px 5px", marginLeft: "auto", fontWeight: 600,
            }}>✓ Sent</span>
          )}
          {!alert.is_sent && (
            <span style={{
              fontSize: 10, color: "#d97706", background: "#fffbeb",
              borderRadius: 3, padding: "1px 5px", marginLeft: "auto", fontWeight: 600,
            }}>Draft</span>
          )}
        </div>
        <p style={{ margin: "0 0 3px", fontSize: 12, color: "#334155", lineHeight: 1.35 }}>
          {alert.title}
        </p>
        <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>
          {alert.is_sent && alert.sent_at
            ? `${formatDate(alert.sent_at)} · ${formatTime(alert.sent_at)} · ${alert.recipient_count ?? 0} users`
            : `Created ${formatDate(alert.created_at)}`}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAlertsPage() {
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [draft, setDraft]         = useState<AlertDraft>(EMPTY_DRAFT);
  const [saving, setSaving]       = useState(false);
  const [sending, setSending]     = useState<string | null>(null);
  const [draftId, setDraftId]     = useState<string | null>(null); // id of saved-but-unsent draft
  const [histSelected, setHistSelected] = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [tab, setTab]             = useState<"compose" | "history">("compose");

  const sentAlerts  = alerts.filter(a => a.is_sent);
  const draftAlerts = alerts.filter(a => !a.is_sent);
  const histAlert   = alerts.find(a => a.id === histSelected) ?? null;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/alerts`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data: Alert[] = await res.json();
      setAlerts(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Draft field helpers ────────────────────────────────────────────────────
  const setField = <K extends keyof AlertDraft>(key: K, value: AlertDraft[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  const toggleImpactTag = (tag: string) =>
    setDraft(prev => ({
      ...prev,
      impact_tags: prev.impact_tags.includes(tag)
        ? prev.impact_tags.filter(t => t !== tag)
        : [...prev.impact_tags, tag],
    }));

  const isValid = draft.ticker.trim() && draft.title.trim() && draft.message.trim();

  // ── Save draft ─────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const body = {
        ticker:      draft.ticker.trim().toUpperCase(),
        title:       draft.title.trim(),
        message:     draft.message.trim(),
        impact_tags: draft.impact_tags,
        priority:    draft.priority,
        audience:    draft.audience,
      };

      let res: Response;
      if (draftId) {
        res = await fetch(`${API_BASE}/admin/alerts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE}/admin/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) throw new Error(`${res.status}`);
      const saved: Alert = await res.json();
      setDraftId(saved.id);
      setAlerts(prev => {
        const exists = prev.find(a => a.id === saved.id);
        return exists
          ? prev.map(a => a.id === saved.id ? saved : a)
          : [saved, ...prev];
      });
      showToast("Draft saved");
    } catch {
      showToast("Failed to save draft", false);
    } finally {
      setSaving(false);
    }
  };

  // ── Send alert ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!isValid) return;

    // Auto-save first if no draftId
    let idToSend = draftId;
    if (!idToSend) {
      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/admin/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ticker:      draft.ticker.trim().toUpperCase(),
            title:       draft.title.trim(),
            message:     draft.message.trim(),
            impact_tags: draft.impact_tags,
            priority:    draft.priority,
            audience:    draft.audience,
          }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const saved: Alert = await res.json();
        idToSend = saved.id;
        setDraftId(saved.id);
        setAlerts(prev => [saved, ...prev]);
      } catch {
        showToast("Failed to save before sending", false);
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    setSending(idToSend);
    try {
      const res = await fetch(`${API_BASE}/admin/alerts/${idToSend}/send`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const result = await res.json();
      setAlerts(prev => prev.map(a =>
        a.id === idToSend
          ? { ...a, is_sent: true, sent_at: result.sent_at, recipient_count: result.recipient_count }
          : a
      ));
      showToast(`Alert sent to ${result.recipient_count} users ✓`);
      // Reset composer
      setDraft(EMPTY_DRAFT);
      setDraftId(null);
    } catch {
      showToast("Send failed — check backend logs", false);
    } finally {
      setSending(null);
    }
  };

  // ── Load history alert into view ───────────────────────────────────────────
  const loadIntoComposer = (alert: Alert) => {
    setDraft({
      ticker:      alert.ticker,
      title:       alert.title,
      message:     alert.message,
      impact_tags: alert.impact_tags,
      priority:    alert.priority,
      audience:    alert.audience,
    });
    setDraftId(alert.is_sent ? null : alert.id);
    setTab("compose");
  };

  const isSending = sending !== null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 28px",
        display: "flex", alignItems: "center", gap: 14, height: 56,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "#7f1d1d",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 14 }}>🔔</span>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Alerts</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Compose and send push alerts to users</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {draftAlerts.length > 0 && (
            <span style={{
              fontSize: 11, padding: "2px 9px", borderRadius: 20,
              background: "#fffbeb", color: "#92400e",
              border: "1px solid #fde68a", fontWeight: 600,
            }}>
              {draftAlerts.length} unsent draft{draftAlerts.length > 1 ? "s" : ""}
            </span>
          )}
          <span style={{
            fontSize: 11, padding: "2px 9px", borderRadius: 20,
            background: "#fef2f2", color: "#991b1b",
            border: "1px solid #fecaca", fontWeight: 600,
          }}>
            {sentAlerts.length} sent
          </span>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 200,
          background: toast.ok ? "#0f172a" : "#dc2626",
          color: "#fff", borderRadius: 10, padding: "10px 16px",
          fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr 300px",
        height: "calc(100vh - 56px)",
      }}>

        {/* ── Col 1: Alert history sidebar ── */}
        <div style={{
          borderRight: "1px solid #e2e8f0",
          background: "#fff",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Tabs */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid #e2e8f0",
            flexShrink: 0,
          }}>
            {(["compose", "history"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "12px 0",
                  fontSize: 12, fontWeight: 600,
                  background: "none", border: "none", cursor: "pointer",
                  color: tab === t ? "#dc2626" : "#94a3b8",
                  borderBottom: tab === t ? "2px solid #dc2626" : "2px solid transparent",
                  transition: "color 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {t === "compose" ? "✏️ Compose" : "🕒 History"}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
            {tab === "history" ? (
              <>
                {loading && (
                  <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 32 }}>
                    Loading…
                  </p>
                )}
                {error && (
                  <div style={{
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: 8, padding: 12, color: "#dc2626", fontSize: 12,
                  }}>
                    {error}
                    <button onClick={fetchAlerts} style={{
                      marginLeft: 8, fontSize: 11, color: "#7c3aed",
                      background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
                    }}>Retry</button>
                  </div>
                )}

                {!loading && !error && alerts.length === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                    <p style={{ margin: 0, fontSize: 13 }}>No alerts yet</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11 }}>Compose your first alert →</p>
                  </div>
                )}

                {draftAlerts.length > 0 && (
                  <>
                    <p style={{
                      fontSize: 10, fontWeight: 600, color: "#d97706",
                      letterSpacing: "0.07em", textTransform: "uppercase",
                      margin: "0 0 8px 2px",
                    }}>Unsent drafts</p>
                    {draftAlerts.map(a => (
                      <AlertHistoryRow
                        key={a.id}
                        alert={a}
                        isSelected={histSelected === a.id}
                        onSelect={() => { setHistSelected(a.id); }}
                      />
                    ))}
                    <div style={{ height: 10 }} />
                  </>
                )}

                {sentAlerts.length > 0 && (
                  <>
                    <p style={{
                      fontSize: 10, fontWeight: 600, color: "#94a3b8",
                      letterSpacing: "0.07em", textTransform: "uppercase",
                      margin: "0 0 8px 2px",
                    }}>Sent</p>
                    {sentAlerts.map(a => (
                      <AlertHistoryRow
                        key={a.id}
                        alert={a}
                        isSelected={histSelected === a.id}
                        onSelect={() => setHistSelected(a.id)}
                      />
                    ))}
                  </>
                )}
              </>
            ) : (
              /* Compose tab — quick tip */
              <div style={{
                background: "#fef2f2", borderRadius: 10,
                padding: "12px 14px",
                border: "1px solid #fecaca",
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#991b1b" }}>
                  🔔 Standalone alerts
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#7f1d1d", lineHeight: 1.5 }}>
                  These are independent of daily updates. Use them for breaking news, circuit breakers,
                  regulatory actions, or anything time-sensitive.
                </p>
              </div>
            )}
          </div>

          {/* History detail footer */}
          {tab === "history" && histAlert && (
            <div style={{
              borderTop: "1px solid #e2e8f0",
              padding: "12px",
              flexShrink: 0,
            }}>
              <button
                onClick={() => loadIntoComposer(histAlert)}
                style={{
                  width: "100%", padding: "9px 0",
                  fontSize: 12, fontWeight: 600,
                  background: "#fef2f2", color: "#991b1b",
                  border: "1px solid #fecaca", borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {histAlert.is_sent ? "Use as template →" : "Resume draft →"}
              </button>
            </div>
          )}
        </div>

        {/* ── Col 2: Composer ── */}
        <div style={{
          borderRight: "1px solid #e2e8f0",
          overflowY: "auto",
          padding: "24px 28px",
          background: "#fff",
        }}>
          <div style={{ maxWidth: 560 }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                  {draftId ? "Edit draft" : "New alert"}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  Fills the phone preview in real time →
                </p>
              </div>
              {draftId && (
                <button
                  onClick={() => { setDraft(EMPTY_DRAFT); setDraftId(null); }}
                  style={{
                    fontSize: 11, color: "#94a3b8", background: "none",
                    border: "none", cursor: "pointer", textDecoration: "underline",
                  }}
                >
                  Start fresh
                </button>
              )}
            </div>

            {/* Priority — first because it sets the visual tone */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Priority
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["Low", "Medium", "High", "Critical"] as AlertPriority[]).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  const active = draft.priority === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setField("priority", p)}
                      style={{
                        flex: 1, padding: "7px 0", fontSize: 11, fontWeight: 600,
                        borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${active ? cfg.strip : "#e2e8f0"}`,
                        background: active ? cfg.bg : "#fff",
                        color: active ? cfg.badgeText : "#94a3b8",
                        transition: "all 0.15s",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority context banner */}
            <div style={{
              background: PRIORITY_CONFIG[draft.priority].bg,
              border: `1px solid ${PRIORITY_CONFIG[draft.priority].border}`,
              borderLeft: `3px solid ${PRIORITY_CONFIG[draft.priority].strip}`,
              borderRadius: 8, padding: "8px 12px", marginBottom: 18,
              fontSize: 11, color: PRIORITY_CONFIG[draft.priority].badgeText, lineHeight: 1.5,
            }}>
              {{
                Low:      "ℹ️  Informational — minor update, no immediate action needed.",
                Medium:   "📊 Notable event — users should be aware but not alarmed.",
                High:     "⚠️  Important — significant price or news event. Sends to all watchers.",
                Critical: "🚨 Urgent — circuit breaker, halt, or major regulatory action. Use sparingly.",
              }[draft.priority]}
            </div>

            {/* Ticker */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>
                Ticker / Company
              </label>
              <input
                type="text"
                value={draft.ticker}
                onChange={e => setField("ticker", e.target.value.toUpperCase())}
                placeholder="e.g. HFCL, INFY, ZOMATO"
                style={{
                  width: "100%", fontSize: 13, padding: "9px 11px",
                  border: "1px solid #e2e8f0", borderRadius: 8,
                  background: "#f8fafc", color: "#0f172a",
                  fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>
                Alert title
                <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>
                  (shown bold on lock screen)
                </span>
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={e => setField("title", e.target.value)}
                placeholder="e.g. Circuit breaker triggered — trading halted"
                maxLength={200}
                style={{
                  width: "100%", fontSize: 13, padding: "9px 11px",
                  border: `1px solid ${!draft.title && draft.ticker ? "#fecaca" : "#e2e8f0"}`,
                  borderRadius: 8, background: "#f8fafc", color: "#0f172a",
                  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>
                Message body
                <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>
                  (what happened + key number)
                </span>
              </label>
              <textarea
                value={draft.message}
                onChange={e => setField("message", e.target.value)}
                placeholder="Describe the event clearly. Include the key figure, action, and what it means for the investor."
                rows={4}
                style={{
                  width: "100%", fontSize: 13, padding: "9px 11px",
                  border: "1px solid #e2e8f0", borderRadius: 8,
                  background: "#f8fafc", color: "#0f172a",
                  fontFamily: "inherit", outline: "none",
                  resize: "vertical", boxSizing: "border-box",
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Impact tags */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Potential impact
                <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>(select all that apply)</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_IMPACT_TAGS.map(tag => {
                  const active = draft.impact_tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleImpactTag(tag)}
                      style={{
                        fontSize: 11, padding: "5px 10px",
                        borderRadius: 20, cursor: "pointer", fontWeight: 500,
                        border: `1px solid ${active ? "#dc2626" : "#e2e8f0"}`,
                        background: active ? "#fef2f2" : "#fff",
                        color: active ? "#991b1b" : "#64748b",
                        transition: "all 0.15s",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audience */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Target audience
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(["all_watchers", "all_users", "pro_users"] as AlertAudience[]).map(aud => (
                  <label
                    key={aud}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${draft.audience === aud ? "#dc2626" : "#e2e8f0"}`,
                      background: draft.audience === aud ? "#fef2f2" : "#fff",
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={draft.audience === aud}
                      onChange={() => setField("audience", aud)}
                      style={{ accentColor: "#dc2626" }}
                    />
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: draft.audience === aud ? "#991b1b" : "#334155",
                    }}>
                      {AUDIENCE_LABELS[aud]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSaveDraft}
                disabled={!isValid || saving || isSending}
                style={{
                  flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 600,
                  borderRadius: 9, cursor: isValid && !saving ? "pointer" : "not-allowed",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc", color: "#475569",
                  opacity: !isValid || saving ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {saving ? "Saving…" : draftId ? "Update draft" : "Save draft"}
              </button>

              <button
                onClick={handleSend}
                disabled={!isValid || isSending || saving}
                style={{
                  flex: 2, padding: "11px 0", fontSize: 13, fontWeight: 700,
                  borderRadius: 9,
                  cursor: isValid && !isSending ? "pointer" : "not-allowed",
                  border: "none",
                  background: isValid && !isSending
                    ? `linear-gradient(135deg, ${PRIORITY_CONFIG[draft.priority].strip}, #7f1d1d)`
                    : "#e2e8f0",
                  color: isValid && !isSending ? "#fff" : "#94a3b8",
                  opacity: isSending ? 0.7 : 1,
                  boxShadow: isValid && !isSending
                    ? `0 4px 16px ${PRIORITY_CONFIG[draft.priority].strip}55`
                    : "none",
                  transition: "all 0.15s",
                }}
              >
                {isSending ? "Sending…" : "Send alert now →"}
              </button>
            </div>

            {!isValid && (draft.ticker || draft.title || draft.message) && (
              <p style={{
                margin: "10px 0 0", fontSize: 11, color: "#dc2626", textAlign: "center",
              }}>
                Ticker, title, and message are all required before sending
              </p>
            )}
          </div>
        </div>

        {/* ── Col 3: Phone preview ── */}
        <div style={{
          overflowY: "auto",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          background: "#f8fafc",
        }}>
          <PhonePreview draft={draft} />

          {/* Stat bar */}
          <div style={{
            width: "100%",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: "14px 16px",
          }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: "#475569" }}>
              Audience estimate
            </p>
            {(["all_watchers", "all_users", "pro_users"] as AlertAudience[]).map(aud => (
              <div key={aud} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 11, color: draft.audience === aud ? "#991b1b" : "#94a3b8",
                  fontWeight: draft.audience === aud ? 600 : 400,
                }}>
                  {AUDIENCE_LABELS[aud]}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: draft.audience === aud ? "#991b1b" : "#94a3b8",
                }}>
                  {aud === "all_watchers" ? "—" : aud === "all_users" ? "—" : "—"}
                </span>
              </div>
            ))}
            <p style={{ margin: "8px 0 0", fontSize: 10, color: "#cbd5e1" }}>
              Actual counts load from your users table once connected
            </p>
          </div>

          {/* Priority reminder */}
          <div style={{
            width: "100%",
            background: PRIORITY_CONFIG[draft.priority].bg,
            border: `1px solid ${PRIORITY_CONFIG[draft.priority].border}`,
            borderRadius: 10, padding: "10px 14px",
          }}>
            <p style={{
              margin: 0, fontSize: 11,
              color: PRIORITY_CONFIG[draft.priority].badgeText,
              fontWeight: 600,
            }}>
              {draft.priority} priority
            </p>
            <p style={{
              margin: "3px 0 0", fontSize: 10,
              color: PRIORITY_CONFIG[draft.priority].badgeText,
              opacity: 0.8, lineHeight: 1.4,
            }}>
              Accent colour and badge on the notification will match this level.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 2px rgba(220,38,38,0.1);
        }
      `}</style>
    </div>
  );
}