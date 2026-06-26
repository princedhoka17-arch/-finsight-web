"use client";

import { useState, useEffect, useCallback } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { api } from "@/lib/api";
import PdfUploadPanel from "@/lib/admin/PdfUploadPanel";

type ReportStatus = "draft" | "processing" | "published" | "archived";

interface ReportItem {
  id: string;
  company: { name: string; ticker: string };
  report_type: string;
  fiscal_year: string;
  title: string;
  status: ReportStatus;
  risk_level: "Low" | "Medium" | "High";
  pdf_storage_path?: string;
  published_at?: string;
  created_at: string;
}

function hexToRgb(colour: string): string {
  if (!colour || !colour.startsWith("#")) return "168,112,61";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
  if (!r) return "168,112,61";
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

function riskColor(level: string, theme: any): string {
  if (level === "Low")  return theme.success;
  if (level === "High") return theme.danger;
  return theme.info;
}

function statusColor(status: ReportStatus, theme: any): string {
  if (status === "published")  return theme.success;
  if (status === "processing") return theme.accent2;
  if (status === "archived")   return theme.textFaint;
  return theme.info; // draft
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

export default function AdminReportsPage() {
  const { theme } = useThemeStore();
  const [mounted, setMounted]   = useState(false);
  const [reports, setReports]   = useState<ReportItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pdfPanelOpen, setPdfPanelOpen] = useState<Record<string, boolean>>({});

  useEffect(() => { setMounted(true); }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports?limit=50");
      setReports(res.data?.data ?? res.data ?? []);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) fetchReports(); }, [mounted, fetchReports]);

  // Poll while any report is processing
  useEffect(() => {
    const hasProcessing = reports.some(r => r.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/admin/reports?limit=50");
        const fresh: ReportItem[] = res.data?.data ?? res.data ?? [];
        setReports(fresh);
        if (!fresh.some(r => r.status === "processing")) clearInterval(interval);
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(interval);
  }, [reports]);

  if (!mounted) return null;

  async function handlePublish(id: string) {
    setLoadingId(id);
    try { await api.patch(`/admin/reports/${id}`, { status: "published" }); } catch {}
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "published" } : r));
    setLoadingId(null);
  }

  async function handleArchive(id: string) {
    setLoadingId(id);
    try { await api.patch(`/admin/reports/${id}`, { status: "archived" }); } catch {}
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "archived" } : r));
    setLoadingId(null);
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24,
          fontWeight: "normal", color: theme.text, marginBottom: 6,
        }}>Reports</h1>
        <p style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
          color: theme.textMuted, letterSpacing: "0.04em",
        }}>Upload PDFs, run the AI pipeline, publish or archive reports</p>
      </div>

      {loading ? (
        <>{[1,2,3].map(i => <LoadingRow key={i} theme={theme} />)}</>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2 }}>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textMuted }}>No reports yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reports.map(report => {
            const isLoading = loadingId === report.id;
            const pdfOpen   = !!pdfPanelOpen[report.id];
            const stColor   = statusColor(report.status, theme);

            return (
              <div key={report.id} style={{
                background: theme.bgSecondary, border: `1px solid ${theme.border}`,
                borderRadius: 2, padding: "16px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 2,
                      background: `rgba(${hexToRgb(theme.accent)},0.1)`, border: `1px solid ${theme.accent}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 700, color: theme.accent,
                    }}>
                      {report.company?.ticker?.slice(0,3)}
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.text, margin: "0 0 2px" }}>
                        {report.company?.name} — {report.fiscal_year}
                      </p>
                      <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.textFaint }}>
                        {report.report_type} · {report.title}
                        {report.pdf_storage_path && <span style={{ color: theme.success, marginLeft: 8 }}>· PDF ✓</span>}
                        {report.status === "processing" && <span style={{ color: theme.accent2, marginLeft: 8 }}>· AI running…</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Badge label={report.risk_level} color={riskColor(report.risk_level, theme)} theme={theme} />
                    <Badge label={report.status} color={stColor} theme={theme} />
                    {report.status !== "archived" && (
                      <button
                        onClick={() => setPdfPanelOpen(prev => ({ ...prev, [report.id]: !prev[report.id] }))}
                        style={{
                          background: pdfOpen ? `rgba(${hexToRgb(theme.accent)},0.1)` : "none",
                          border: `1px solid ${pdfOpen ? theme.accent + "50" : theme.border}`,
                          borderRadius: 2, padding: "6px 12px",
                          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
                          color: pdfOpen ? theme.accent : theme.textMuted, cursor: "pointer",
                        }}
                      >{pdfOpen ? "Hide PDF ▴" : "PDF / AI ▾"}</button>
                    )}
                    {report.status === "draft" && (
                      <ActionBtn label={isLoading ? "…" : "Publish"} color={theme.success} filled onClick={() => handlePublish(report.id)} disabled={isLoading} />
                    )}
                    {report.status === "published" && (
                      <ActionBtn label={isLoading ? "…" : "Archive"} color={theme.textMuted} onClick={() => handleArchive(report.id)} disabled={isLoading} />
                    )}
                  </div>
                </div>

                {pdfOpen && (
                  <PdfUploadPanel
                    report={{
                      id: report.id,
                      company_name: report.company?.name ?? "",
                      fiscal_year: report.fiscal_year,
                      status: report.status,
                      pdf_storage_path: report.pdf_storage_path,
                    }}
                    onUploaded={(rid: string, path: string) =>
                      setReports(prev => prev.map(r => r.id === rid ? { ...r, pdf_storage_path: path } : r))
                    }
                    onPipelineStarted={(rid: string) =>
                      setReports(prev => prev.map(r => r.id === rid ? { ...r, status: "processing" } : r))
                    }
                    onPublished={(rid: string) =>
                      setReports(prev => prev.map(r => r.id === rid ? { ...r, status: "published" } : r))
                    }
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