"use client";

import { useState, useEffect, useRef } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { api } from "@/lib/api";

export type AdminReportStatus = "draft" | "processing" | "published" | "archived";

export interface InlineReport {
  id: string;
  company_name: string;
  fiscal_year: string;
  status: AdminReportStatus;
  pdf_storage_path?: string;
}

function hexToRgb(colour: string): string {
  if (!colour || !colour.startsWith("#")) return "168,112,61";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
  if (!r) return "168,112,61";
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

export default function PdfUploadPanel({
  report, onUploaded, onPipelineStarted, onPublished,
}: {
  report: InlineReport;
  onUploaded: (reportId: string, storagePath: string) => void;
  onPipelineStarted: (reportId: string) => void;
  onPublished?: (reportId: string) => void;
}) {
  const { theme } = useThemeStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading,   setUploading]   = useState(false);
  const [running,     setRunning]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pipelineMsg, setPipelineMsg] = useState<string | null>(null);

  const hasPdf = !!report.pdf_storage_path;
  const accentRgb = hexToRgb(theme.accent);

  // Poll while processing
  useEffect(() => {
    if (report.status !== "processing") return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/admin/reports/${report.id}`);
        const fresh = res.data;
        if (fresh.status === "published") {
          onPublished?.(report.id);
          clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(interval);
  }, [report.status, report.id, onPublished]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 50 MB.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("report_id", report.id);
    form.append("file", file);
    try {
      const res = await api.post("/admin/reports/upload-pdf", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(report.id, res.data.storage_path);
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRunPipeline() {
    setRunning(true);
    setPipelineMsg(null);
    try {
      await api.post(`/admin/reports/${report.id}/process-ai`);
      onPipelineStarted(report.id);
      setPipelineMsg("✓ AI pipeline started — extracting sections from PDF…");
    } catch (err: any) {
      setPipelineMsg("✕ " + (err?.response?.data?.detail ?? "Pipeline failed. Check server logs."));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{
      marginTop: 16, background: theme.bg,
      border: `1px solid ${theme.accent}30`, borderRadius: 2,
      padding: "16px 20px",
    }}>
      <p style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
        color: theme.accent, letterSpacing: "0.06em",
        textTransform: "uppercase", marginBottom: 10,
      }}>
        PDF & AI Pipeline
        <span style={{ color: theme.textFaint, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>
          — {report.company_name} {report.fiscal_year}
        </span>
      </p>

      {/* Step 1 — Upload */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textFaint, minWidth: 56 }}>
          Step 1
        </div>
        {hasPdf ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.success }}>
              ✓ PDF uploaded
            </span>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.textFaint, wordBreak: "break-all" }}>
              {report.pdf_storage_path}
            </span>
            <label style={{
              background: "none", border: `1px solid ${theme.border}`,
              borderRadius: 2, padding: "4px 10px",
              fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
              color: theme.textMuted, cursor: "pointer",
            }}>
              Replace PDF
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        ) : (
          <label style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: `rgba(${accentRgb},0.1)`, border: `1px solid ${theme.accent}40`,
            borderRadius: 2, padding: "7px 16px",
            fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
            color: theme.accent, cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}>
            {uploading ? "Uploading…" : "⬆ Upload PDF"}
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {uploadError && (
        <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.danger, marginBottom: 12 }}>
          ✕ {uploadError}
        </p>
      )}

      {/* Step 2 — Run pipeline */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textFaint, minWidth: 56 }}>
          Step 2
        </div>
        {report.status === "published" ? (
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.success }}>
            ✓ AI pipeline complete — report published & users notified
          </span>
        ) : report.status === "processing" ? (
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.accent2 }}>
            ⟳ Processing… extracting sections, generating summary, detecting risk
          </span>
        ) : (
          <button
            onClick={handleRunPipeline}
            disabled={!hasPdf || running}
            style={{
              background: hasPdf ? `rgba(${hexToRgb(theme.accent2)},0.12)` : theme.bgSecondary,
              border: `1px solid ${hasPdf ? theme.accent2 + "50" : theme.border}`,
              borderRadius: 2, padding: "7px 16px",
              fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
              color: hasPdf ? theme.accent2 : theme.textFaint,
              cursor: hasPdf && !running ? "pointer" : "not-allowed",
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? "Starting…" : "▶ Run AI Pipeline"}
          </button>
        )}
      </div>

      {pipelineMsg && (
        <p style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
          color: pipelineMsg.startsWith("✓") ? theme.success : theme.danger,
          marginTop: 8,
        }}>
          {pipelineMsg}
        </p>
      )}
    </div>
  );
}