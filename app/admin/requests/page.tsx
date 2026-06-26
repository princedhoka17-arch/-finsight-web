"use client";

import { useState, useEffect, useCallback } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { api } from "@/lib/api";
import PdfUploadPanel, { type InlineReport } from "@/lib/admin/PdfUploadPanel";

type RequestStatus = "pending" | "in_progress" | "completed" | "rejected";

interface RequestItem {
  id: string;
  user_email?: string;
  company_name: string;
  ticker?: string;
  message?: string;
  status: RequestStatus;
  admin_note?: string;
  report_id?: string;
  created_at: string;
}

function hexToRgb(colour: string): string {
  if (!colour || !colour.startsWith("#")) return "168,112,61";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
  if (!r) return "168,112,61";
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

function statusColor(s: RequestStatus, theme: any): string {
  if (s === "completed")   return theme.success;
  if (s === "rejected")    return theme.danger;
  if (s === "in_progress") return theme.accent2;
  return theme.info; // pending
}

function Badge({ label, color, theme }: { label: string; color: string; theme: any }) {
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
  label: string; color: string; filled?: boolean; onClick: () => void; disabled?: boolean;
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
  return <div style={{ height: 64, borderRadius: 2, background: theme.border, opacity: 0.3, marginBottom: 10 }} />;
}

export default function AdminRequestsPage() {
  const { theme } = useThemeStore();
  const [mounted, setMounted]   = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [inlineReports, setInlineReports] = useState<Record<string, InlineReport>>({});
  const [noteEditingId, setNoteEditingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/requests?limit=50");
      setRequests(res.data?.data ?? res.data ?? []);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) fetchRequests(); }, [mounted, fetchRequests]);

  if (!mounted) return null;

  async function handleStart(reqId: string, companyName: string) {
    setLoadingId(reqId);
    try {
      const res = await api.post(`/admin/requests/${reqId}/start`);
      const { report_id, company_name, fiscal_year } = res.data;

      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "in_progress", report_id } : r));
      setInlineReports(prev => ({
        ...prev,
        [reqId]: {
          id: report_id,
          company_name: company_name ?? companyName,
          fiscal_year: fiscal_year ?? new Date().getFullYear().toString(),
          status: "draft",
        },
      }));
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Failed to start request. Try again.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleStatus(id: string, newStatus: RequestStatus) {
    setLoadingId(id);
    try {
      await api.patch(`/admin/requests/${id}`, null, {
        params: { new_status: newStatus, admin_note: adminNote || undefined },
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, admin_note: adminNote || r.admin_note } : r));
    } catch {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } finally {
      setLoadingId(null);
      setNoteEditingId(null);
      setAdminNote("");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24,
          fontWeight: "normal", color: theme.text, marginBottom: 6,
        }}>Company requests</h1>
        <p style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
          color: theme.textMuted, letterSpacing: "0.04em",
        }}>User-submitted company requests — start, upload PDF, complete</p>
      </div>

      {loading ? (
        <>{[1,2,3].map(i => <LoadingRow key={i} theme={theme} />)}</>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2 }}>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textMuted }}>No company requests.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map(req => {
            const isLoading    = loadingId === req.id;
            const isNotingHere = noteEditingId === req.id;
            const inlineReport = inlineReports[req.id];
            const showPdfPanel = !!inlineReport || (req.status === "in_progress" && !!req.report_id);
            const stColor = statusColor(req.status, theme);

            return (
              <div key={req.id} style={{
                background: theme.bgSecondary, border: `1px solid ${theme.border}`,
                borderRadius: 2, padding: "16px 20px",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: 12,
                  marginBottom: (req.message || showPdfPanel) ? 10 : 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 2,
                      background: `rgba(${hexToRgb(theme.accent2)},0.1)`, border: `1px solid ${theme.accent2}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 700, color: theme.accent2,
                    }}>
                      {req.company_name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.text, margin: 0 }}>
                        {req.company_name}
                        {req.ticker && (
                          <span style={{ color: theme.accent, marginLeft: 6, fontFamily: "IBM Plex Mono, monospace", fontSize: 11 }}>
                            {req.ticker}
                          </span>
                        )}
                      </p>
                      <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.textFaint, marginTop: 2 }}>
                        {req.created_at}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Badge label={req.status} color={stColor} theme={theme} />

                    {req.status === "pending" && (
                      <ActionBtn label={isLoading ? "Starting…" : "Start"} color={theme.accent2} filled onClick={() => handleStart(req.id, req.company_name)} disabled={isLoading} />
                    )}

                    {req.status === "in_progress" && (
                      <>
                        <ActionBtn label={isLoading ? "…" : "Complete"} color={theme.success} filled onClick={() => handleStatus(req.id, "completed")} disabled={isLoading} />
                        <ActionBtn label="Reject" color={theme.danger} onClick={() => handleStatus(req.id, "rejected")} disabled={isLoading} />
                      </>
                    )}

                    <button
                      onClick={() => { setNoteEditingId(isNotingHere ? null : req.id); setAdminNote(req.admin_note ?? ""); }}
                      style={{
                        background: "none", border: `1px solid ${theme.border}`, borderRadius: 2,
                        padding: "6px 12px", fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
                        color: theme.textMuted, cursor: "pointer",
                      }}
                    >{isNotingHere ? "Cancel" : "Note"}</button>
                  </div>
                </div>

                {req.message && (
                  <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.textMuted, lineHeight: 1.6, margin: "8px 0 0" }}>
                    {req.message}
                  </p>
                )}

                {req.admin_note && !isNotingHere && (
                  <div style={{
                    marginTop: 10, padding: "8px 12px",
                    background: `rgba(${hexToRgb(theme.accent)},0.05)`, border: `1px solid ${theme.accent}25`,
                    borderRadius: 2, fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: theme.accent,
                  }}>Admin note: {req.admin_note}</div>
                )}

                {isNotingHere && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <input
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder="Add admin note…"
                      style={{
                        flex: 1, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 2,
                        padding: "8px 10px", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14,
                        color: theme.text, outline: "none",
                      }}
                    />
                    <ActionBtn label="Save note" color={theme.accent} filled onClick={() => handleStatus(req.id, req.status)} />
                  </div>
                )}

                {showPdfPanel && (
                  <PdfUploadPanel
                    report={inlineReport ?? {
                      id: req.report_id!,
                      company_name: req.company_name,
                      fiscal_year: new Date().getFullYear().toString(),
                      status: "draft",
                    }}
                    onUploaded={(rid: string, path: string) => {
                      setInlineReports(prev => ({ ...prev, [req.id]: { ...prev[req.id], pdf_storage_path: path } }));
                    }}
                    onPipelineStarted={(rid: string) => {
                      setInlineReports(prev => ({ ...prev, [req.id]: { ...prev[req.id], status: "processing" } }));
                    }}
                    onPublished={(rid: string) => {
                      setInlineReports(prev => ({ ...prev, [req.id]: { ...prev[req.id], status: "published" } }));
                      handleStatus(req.id, "completed");
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}