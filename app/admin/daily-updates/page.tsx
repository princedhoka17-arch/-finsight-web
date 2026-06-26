"use client";

import { useState, useEffect, useCallback } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { api } from "@/lib/api";

type UpdateStatus = "pending" | "approved" | "rejected" | "sent";
type UpdateSentiment = "Positive" | "Neutral" | "Cautious" | "Negative";

interface DailyUpdateItem {
  id: string;
  company: { name: string; ticker: string };
  headline: string;
  content: string;
  sentiment: UpdateSentiment;
  change_percent: number;
  status: UpdateStatus;
  ai_generated: boolean;
  admin_edited: boolean;
  created_at: string;
}

function hexToRgb(colour: string): string {
  if (!colour || !colour.startsWith("#")) return "168,112,61";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
  if (!r) return "168,112,61";
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

function sentimentColor(s: UpdateSentiment, theme: any): string {
  if (s === "Positive") return theme.success;
  if (s === "Negative") return theme.danger;
  if (s === "Cautious") return theme.info;
  return theme.textMuted;
}

function statusColor(s: UpdateStatus, theme: any): string {
  if (s === "approved") return theme.success;
  if (s === "rejected") return theme.danger;
  if (s === "sent")     return theme.accent2;
  return theme.info;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
      fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
      color, background: `rgba(${hexToRgb(color)},0.1)`,
      border: `1px solid ${color}40`, borderRadius: 2, padding: "2px 8px",
    }}>{label}</span>
  );
}

function ActionBtn({ label, color, filled, onClick, disabled }: {
  label: string; color: string; filled?: boolean;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: filled ? color : "none",
      border: `1px solid ${filled ? color : color + "50"}`,
      borderRadius: 2, padding: "6px 14px",
      fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
      color: filled ? "#fff" : color,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, letterSpacing: "0.04em",
    }}>{label}</button>
  );
}

function LoadingRow({ theme }: { theme: any }) {
  return <div style={{ height: 72, borderRadius: 2, background: theme.border, opacity: 0.3, marginBottom: 10 }} />;
}

export default function AdminDailyUpdatesPage() {
  const { theme } = useThemeStore();
  const [mounted,      setMounted]      = useState(false);
  const [updates,      setUpdates]      = useState<DailyUpdateItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingId,    setLoadingId]    = useState<string | null>(null);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editHeadline, setEditHeadline] = useState("");
  const [editContent,  setEditContent]  = useState("");
  const [statusFilter, setStatusFilter] = useState<UpdateStatus | "all">("pending");
  const [runningNow,   setRunningNow]   = useState(false);
  const [runResult,    setRunResult]    = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/daily-updates?status=${statusFilter}&limit=50`);
      setUpdates(res.data?.data ?? res.data ?? []);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { if (mounted) fetchUpdates(); }, [mounted, fetchUpdates]);

  if (!mounted) return null;

  // ── Run Now ──────────────────────────────────────────────────────
  async function handleRunNow() {
    setRunningNow(true);
    setRunResult(null);
    try {
      const res = await api.post("/admin/daily-updates/run-now");
      const d = res.data;
      setRunResult(
        `Generated ${d.generated} · Failed ${d.failed} · Skipped ${d.skipped}` +
        (d.companies?.length ? ` · ${d.companies.join(", ")}` : "")
      );
      // Refresh the list so newly generated updates appear
      await fetchUpdates();
    } catch (e: any) {
      setRunResult("Error: " + (e?.response?.data?.detail ?? e?.message ?? "Unknown error"));
    } finally {
      setRunningNow(false);
    }
  }

  // ── Actions ──────────────────────────────────────────────────────
  async function handleApprove(id: string) {
    setLoadingId(id);
    try { await api.post(`/admin/daily-updates/${id}/approve`); } catch {}
    setUpdates(prev => prev.map(u => u.id === id ? { ...u, status: "approved" } : u));
    setLoadingId(null);
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    try { await api.post(`/admin/daily-updates/${id}/reject`); } catch {}
    setUpdates(prev => prev.map(u => u.id === id ? { ...u, status: "rejected" } : u));
    setLoadingId(null);
  }

  async function handleSend(id: string) {
    setLoadingId(id);
    try {
      await api.post(`/admin/daily-updates/${id}/send`);
      setUpdates(prev => prev.map(u => u.id === id ? { ...u, status: "sent" } : u));
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Failed to send.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this update permanently?")) return;
    setLoadingId(id);
    try { await api.delete(`/admin/daily-updates/${id}`); } catch {}
    setUpdates(prev => prev.filter(u => u.id !== id));
    setLoadingId(null);
  }

  async function saveEdit(id: string) {
    setLoadingId(id);
    try {
      await api.patch(`/admin/daily-updates/${id}`, { headline: editHeadline, content: editContent });
      setUpdates(prev => prev.map(u =>
        u.id === id ? { ...u, headline: editHeadline, content: editContent, admin_edited: true } : u
      ));
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Failed to save — this update may already be sent.");
    } finally {
      setEditingId(null);
      setLoadingId(null);
    }
  }

  const TABS: { value: UpdateStatus | "all"; label: string }[] = [
    { value: "pending",  label: "Pending"  },
    { value: "approved", label: "Approved" },
    { value: "sent",     label: "Sent"     },
    { value: "rejected", label: "Rejected" },
    { value: "all",      label: "All"      },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24,
            fontWeight: "normal", color: theme.text, marginBottom: 6,
          }}>Daily updates — review queue</h1>
          <p style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
            color: theme.textMuted, letterSpacing: "0.04em",
          }}>AI-generated updates await approval before reaching subscribers</p>
        </div>

        {/* Run Now button */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <button
            onClick={handleRunNow}
            disabled={runningNow}
            style={{
              background: theme.accent,
              color: theme.accentText,
              border: "none", borderRadius: 2,
              padding: "10px 20px",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12, fontWeight: 600,
              letterSpacing: "0.06em", cursor: runningNow ? "not-allowed" : "pointer",
              opacity: runningNow ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {runningNow ? "Generating…" : "⚡ Run Now"}
          </button>
          {runResult && (
            <p style={{
              fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
              color: runResult.startsWith("Error") ? theme.danger : theme.success,
              margin: 0, maxWidth: 280, textAlign: "right",
            }}>{runResult}</p>
          )}
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${theme.border}`, marginBottom: 20, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)} style={{
            background: "none", border: "none",
            borderBottom: `2px solid ${statusFilter === t.value ? theme.accent : "transparent"}`,
            color: statusFilter === t.value ? theme.accent : theme.textMuted,
            padding: "10px 16px", fontFamily: "IBM Plex Mono, monospace",
            fontSize: 11, cursor: "pointer", letterSpacing: "0.06em",
            textTransform: "uppercase", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <>{[1,2,3].map(i => <LoadingRow key={i} theme={theme} />)}</>
      ) : updates.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2,
        }}>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textMuted, marginBottom: 12 }}>
            No {statusFilter !== "all" ? statusFilter : ""} updates right now.
          </p>
          <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textFaint }}>
            Click ⚡ Run Now to generate updates for all watched companies.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {updates.map(update => {
            const sColor  = sentimentColor(update.sentiment, theme);
            const stColor = statusColor(update.status, theme);
            const isEditing = editingId === update.id;
            const isLoading = loadingId === update.id;
            const locked    = update.status === "sent";

            return (
              <div key={update.id} style={{
                background: theme.bgSecondary, border: `1px solid ${theme.border}`,
                borderLeft: `3px solid ${stColor}`, borderRadius: 2,
                padding: "18px 20px", opacity: isLoading ? 0.6 : 1,
              }}>
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 2,
                      background: `rgba(${hexToRgb(theme.accent)},0.1)`,
                      border: `1px solid ${theme.accent}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
                      fontWeight: 700, color: theme.accent, flexShrink: 0,
                    }}>
                      {update.company?.ticker?.slice(0,3) ?? update.company?.name?.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.text, margin: "0 0 2px" }}>
                        {update.company?.name}
                      </p>
                      <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.textFaint }}>
                        {new Date(update.created_at).toLocaleString("en-IN")}
                        {update.ai_generated && " · AI"}
                        {update.admin_edited && " · edited"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, color: sColor }}>
                      {update.sentiment}
                      {update.change_percent != null && ` · ${update.change_percent > 0 ? "+" : ""}${update.change_percent}%`}
                    </span>
                    <Badge label={update.status} color={stColor} />
                  </div>
                </div>

                {/* Edit / read mode */}
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                    <input
                      value={editHeadline}
                      onChange={e => setEditHeadline(e.target.value)}
                      style={{
                        background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 2,
                        padding: "8px 10px", fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: 14, color: theme.text, outline: "none", width: "100%", boxSizing: "border-box",
                      }}
                    />
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={4}
                      style={{
                        background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 2,
                        padding: "8px 10px", fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: 14, color: theme.text, outline: "none", resize: "vertical",
                        width: "100%", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, fontWeight: 500, color: theme.text, margin: "0 0 6px" }}>
                      {update.headline}
                    </p>
                    <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.textMuted, lineHeight: 1.7, margin: 0 }}>
                      {update.content}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                  {isEditing ? (
                    <>
                      <ActionBtn label={isLoading ? "Saving…" : "Save changes"} color={theme.accent} filled onClick={() => saveEdit(update.id)} disabled={isLoading} />
                      <ActionBtn label="Cancel" color={theme.textMuted} onClick={() => setEditingId(null)} />
                    </>
                  ) : (
                    <>
                      {update.status === "pending" && (
                        <>
                          <ActionBtn label={isLoading ? "…" : "Approve"} color={theme.success} filled onClick={() => handleApprove(update.id)} disabled={isLoading} />
                          <ActionBtn label={isLoading ? "…" : "Reject"}  color={theme.danger}  onClick={() => handleReject(update.id)}  disabled={isLoading} />
                        </>
                      )}
                      {update.status === "approved" && (
                        <ActionBtn label={isLoading ? "Sending…" : "Send to subscribers →"} color={theme.accent2} filled onClick={() => handleSend(update.id)} disabled={isLoading} />
                      )}
                      {!locked && (
                        <ActionBtn label="Edit" color={theme.textMuted} onClick={() => { setEditingId(update.id); setEditHeadline(update.headline); setEditContent(update.content); }} />
                      )}
                      {!locked && (
                        <ActionBtn label="Delete" color={theme.textFaint} onClick={() => handleDelete(update.id)} disabled={isLoading} />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}