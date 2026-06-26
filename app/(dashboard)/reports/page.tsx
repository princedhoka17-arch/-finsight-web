"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { reportsApi } from "@/lib/api";
import type { Report } from "@/types";
import { REPORT_TYPE_LABELS } from "@/types";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isNew(dateStr?: string): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 3_600_000;
}

function riskColors(risk?: Report["risk_level"]) {
  if (risk === "High")   return { bg: "#FAECE7", text: "#993C1D", border: "#F0997B" };
  if (risk === "Medium") return { bg: "#FAEEDA", text: "#854F0B", border: "#EF9F27" };
  if (risk === "Low")    return { bg: "#EAF3DE", text: "#3B6D11", border: "#97C459" };
  return                        { bg: "transparent", text: "#888780", border: "#B4B2A9" };
}

function getRiskLabel(risk?: Report["risk_level"]): string {
  if (!risk) return "—";
  return risk.toUpperCase();
}

function extractArray(data: any): Report[] {
  if (Array.isArray(data))          return data;
  if (Array.isArray(data?.items))   return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data))    return data.data;
  return [];
}

// ─── File icon ────────────────────────────────────────────────────────────────

function FileIcon({ isNew: newReport }: { isNew: boolean }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 7, flexShrink: 0,
      background: newReport ? "#FAECE7" : "#F1EFE8",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 1a1 1 0 011-1h6.586L13 3.414V15a1 1 0 01-1 1H3a1 1 0 01-1-1V1z"
          fill={newReport ? "#FAECE7" : "#F1EFE8"}
          stroke={newReport ? "#993C1D" : "#888780"}
          strokeWidth="1"
        />
        <path d="M9 0v4h4" stroke={newReport ? "#993C1D" : "#888780"} strokeWidth="1" fill="none"/>
        <line x1="4" y1="8"  x2="11" y2="8"  stroke={newReport ? "#993C1D" : "#B4B2A9"} strokeWidth="0.8"/>
        <line x1="4" y1="11" x2="9"  y2="11" stroke={newReport ? "#993C1D" : "#B4B2A9"} strokeWidth="0.8"/>
      </svg>
    </div>
  );
}

// ─── Report row ───────────────────────────────────────────────────────────────

function ReportRow({
  report, theme, onClick, isMobile,
}: {
  report: Report; theme: any; onClick: () => void; isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const newReport = isNew(report.published_at ?? report.created_at);
  const dateLabel = formatDate(report.published_at ?? report.created_at);
  const typeLabel = REPORT_TYPE_LABELS?.[report.report_type] ?? report.report_type ?? "—";
  const risk      = riskColors(report.risk_level);
  const pageCount = (report as any).page_count ?? null;

  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 10 : 12,
        padding: isMobile ? "12px 0" : "11px 0",
        borderBottom: `0.5px solid ${theme.border}`,
        cursor: "pointer",
        background: hovered ? `${theme.border}22` : "transparent",
        transition: "background 0.12s",
        borderRadius: 4,
      }}
    >
      {/* File icon */}
      <FileIcon isNew={newReport} />

      {/* Name + meta — takes all remaining space */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: isMobile ? 12 : 13, fontWeight: 500,
          color: theme.text,
          margin: "0 0 3px",
          // Allow wrapping on mobile so long titles aren't clipped
          whiteSpace: isMobile ? "normal" : "nowrap",
          overflow: "hidden",
          textOverflow: isMobile ? "unset" : "ellipsis",
          lineHeight: 1.45,
        }}>
          <span style={{ ...mono, fontSize: isMobile ? 10 : 11, fontWeight: 700, color: newReport ? "#993C1D" : theme.textMuted }}>
            {report.company?.ticker ?? "—"}
          </span>
          {" — "}
          {report.title}
        </p>
        <p style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.textFaint, margin: "0 0 6px" }}>
          {dateLabel ? `Uploaded ${dateLabel}` : ""}
          {pageCount ? ` · ${pageCount} pages` : ""}
          {typeLabel ? ` · ${typeLabel}` : ""}
          {" · AI-processed"}
        </p>

        {/* On mobile: inline pills under the meta line */}
        {isMobile && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {report.risk_level && (
              <span style={{
                ...mono, fontSize: 9,
                borderRadius: 999, padding: "2px 7px",
                background: risk.bg, color: risk.text,
                border: `0.5px solid ${risk.border}`,
                letterSpacing: "0.06em",
              }}>
                {getRiskLabel(report.risk_level)} RISK
              </span>
            )}
            <span style={{
              ...mono, fontSize: 9,
              borderRadius: 999, padding: "2px 7px",
              letterSpacing: "0.06em",
              background: newReport ? "#EAF3DE" : theme.bgSecondary,
              color:      newReport ? "#3B6D11" : theme.textFaint,
              border:     newReport ? "0.5px solid #97C459" : `0.5px solid ${theme.border}`,
            }}>
              {newReport ? "NEW" : "READ"}
            </span>
          </div>
        )}
      </div>

      {/* Desktop-only: right-side pills + chevron */}
      {!isMobile && (
        <>
          {report.risk_level && (
            <span style={{
              ...mono, fontSize: 9,
              borderRadius: 999, padding: "2px 8px", flexShrink: 0,
              background: risk.bg, color: risk.text,
              border: `0.5px solid ${risk.border}`,
              letterSpacing: "0.06em",
            }}>
              {getRiskLabel(report.risk_level)} RISK
            </span>
          )}
          <span style={{
            ...mono, fontSize: 9,
            borderRadius: 999, padding: "2px 8px", flexShrink: 0,
            letterSpacing: "0.06em",
            background: newReport ? "#EAF3DE" : theme.bgSecondary,
            color:      newReport ? "#3B6D11" : theme.textFaint,
            border:     newReport ? "0.5px solid #97C459" : `0.5px solid ${theme.border}`,
          }}>
            {newReport ? "NEW" : "READ"}
          </span>
          <span style={{ ...mono, fontSize: 12, color: theme.textFaint, flexShrink: 0, paddingRight: 2 }}>›</span>
        </>
      )}

      {/* Mobile: just the chevron, aligned to top */}
      {isMobile && (
        <span style={{ ...mono, fontSize: 14, color: theme.textFaint, flexShrink: 0, paddingTop: 1 }}>›</span>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows({ theme, isMobile }: { theme: any; isMobile: boolean }) {
  return (
    <div style={{ padding: isMobile ? "4px 12px" : "4px 16px", display: "flex", flexDirection: "column" }}>
      {[1, 2, 3, 4, 5].map(k => (
        <div key={k} style={{
          display: "flex", gap: 12, alignItems: "center",
          padding: "11px 0", borderBottom: `0.5px solid ${theme.border}`,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 7, flexShrink: 0, background: theme.border, opacity: 0.35, animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 13, width: "55%", borderRadius: 3, background: theme.border, opacity: 0.35, animation: "pulse 1.4s ease-in-out infinite" }} />
            <div style={{ height: 10, width: "35%", borderRadius: 3, background: theme.border, opacity: 0.25, animation: "pulse 1.4s ease-in-out infinite" }} />
          </div>
          {!isMobile && (
            <>
              <div style={{ width: 64, height: 18, borderRadius: 999, background: theme.border, opacity: 0.3, animation: "pulse 1.4s ease-in-out infinite" }} />
              <div style={{ width: 40, height: 18, borderRadius: 999, background: theme.border, opacity: 0.3, animation: "pulse 1.4s ease-in-out infinite" }} />
            </>
          )}
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.35} 50%{opacity:0.15} }`}</style>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { theme } = useThemeStore();
  const router    = useRouter();
  const width     = useWindowWidth();
  const isMobile  = width > 0 && width < 640;
  const isTablet  = width >= 640 && width < 1024;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState("");

  const loadReports = () => {
    setError(null);
    setLoading(true);
    reportsApi
      .getAll({ per_page: 50 })
      .then(res => setReports(extractArray(res.data)))
      .catch(() => setError("Could not load reports. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  const filtered    = reports.filter(r =>
    !search.trim() ||
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.company?.ticker?.toLowerCase().includes(search.toLowerCase())
  );
  const totalCount  = reports.length;
  const newThisWeek = reports.filter(r => isNew(r.published_at ?? r.created_at)).length;

  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const card: React.CSSProperties = {
    background: theme.bgSecondary,
    border: `0.5px solid ${theme.border}`,
    borderRadius: 10, overflow: "hidden",
  };

  return (
    <div style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: isMobile ? "16px 14px" : "20px",
      paddingBottom: isMobile ? 86 : 20,
      display: "flex", flexDirection: "column",
      gap: isMobile ? 12 : 16,
    }}>

      {/* ── Breadcrumb / Page title ── */}
      {isMobile ? (
        /* Mobile: no breadcrumb, but keep the existing h1 style since
           this page always showed the h1 — just hide the breadcrumb */
        null
      ) : (
        <div style={{ ...mono, fontSize: 10, color: theme.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
          Home <span>›</span> <span style={{ color: theme.text }}>Reports</span>
        </div>
      )}

      {/* Page header — always shown, breadcrumb replaces it on desktop */}
      <div style={{ marginTop: isMobile ? 0 : -4 }}>
        <h1 style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: isMobile ? 20 : 22, fontWeight: 600,
          color: theme.text, margin: "0 0 4px",
        }}>
          Reports
        </h1>
        <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, margin: 0 }}>
          AI-analysed annual reports and research documents
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? 8 : 10 }}>
        <div style={{ ...card, padding: isMobile ? "10px 12px" : "14px 16px" }}>
          <p style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>
            Total reports
          </p>
          <p style={{ ...mono, fontSize: isMobile ? 18 : 22, fontWeight: 500, color: theme.text, margin: 0 }}>
            {loading ? "—" : totalCount}
          </p>
        </div>
        <div style={{ ...card, padding: isMobile ? "10px 12px" : "14px 16px" }}>
          <p style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>
            New this week
          </p>
          <p style={{ ...mono, fontSize: isMobile ? 18 : 22, fontWeight: 500, color: newThisWeek > 0 ? "#3B6D11" : theme.text, margin: 0 }}>
            {loading ? "—" : newThisWeek}
          </p>
        </div>
      </div>

      {/* ── Report list card ── */}
      <div style={card}>

        {/* Card header */}
        <div style={{
          padding: isMobile ? "10px 12px" : "12px 16px",
          borderBottom: `0.5px solid ${theme.border}`,
          display: "flex", alignItems: "center", gap: 8,
          // On mobile: stack label + search vertically if both present
          flexWrap: isMobile ? "wrap" : "nowrap",
          rowGap: isMobile ? 8 : 0,
        }}>
          <span style={{ ...mono, fontSize: isMobile ? 10 : 11, fontWeight: 500, letterSpacing: "0.07em", color: theme.text }}>
            ALL REPORTS
          </span>
          {!loading && filtered.length !== reports.length && (
            <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>
              {filtered.length} of {totalCount}
            </span>
          )}
          {!loading && filtered.length === reports.length && reports.length > 0 && (
            <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>
              {totalCount}
            </span>
          )}

          {/* Search — full width on mobile, fixed width on desktop */}
          <div style={{
            marginLeft: isMobile ? 0 : "auto",
            position: "relative",
            width: isMobile ? "100%" : "auto",
          }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ticker, name…"
              style={{
                ...mono, fontSize: isMobile ? 11 : 11,
                padding: "6px 28px 6px 10px",
                width: isMobile ? "100%" : 190,
                boxSizing: "border-box",
                background: theme.bg,
                border: `0.5px solid ${theme.border}`,
                borderRadius: 6, color: theme.text,
                outline: "none",
              }}
              onFocus={e  => (e.target as HTMLElement).style.borderColor = "#B0503F"}
              onBlur={e   => (e.target as HTMLElement).style.borderColor = theme.border}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute", right: 8, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: theme.textFaint, cursor: "pointer",
                  fontSize: 14, padding: 0, lineHeight: 1,
                }}
              >×</button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonRows theme={theme} isMobile={isMobile} />
        ) : error ? (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <p style={{ ...mono, fontSize: 11, color: "#993C1D", margin: "0 0 12px" }}>{error}</p>
            <button
              onClick={loadReports}
              style={{
                ...mono, fontSize: 11, letterSpacing: "0.05em",
                padding: "6px 14px",
                background: "transparent",
                border: `0.5px solid ${theme.border}`,
                borderRadius: 6, color: theme.textMuted, cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: "#F1EFE8",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <svg width="18" height="20" viewBox="0 0 15 17" fill="none">
                <path d="M2 1a1 1 0 011-1h6.586L13 3.414V15a1 1 0 01-1 1H3a1 1 0 01-1-1V1z" stroke="#888780" strokeWidth="1" fill="#F1EFE8"/>
                <path d="M9 0v4h4" stroke="#888780" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: 0 }}>
              {search ? `No reports match "${search}"` : "No reports available yet"}
            </p>
          </div>
        ) : (
          <div style={{ padding: isMobile ? "0 12px" : "0 16px" }}>
            {filtered.map(report => (
              <ReportRow
                key={report.id}
                report={report}
                theme={theme}
                isMobile={isMobile}
                onClick={() => router.push(`/reports/${report.id}`)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{
            borderTop: `0.5px solid ${theme.border}`,
            padding: isMobile ? "8px 12px" : "10px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.textFaint }}>
              Showing {filtered.length} report{filtered.length !== 1 ? "s" : ""}
            </span>
            <span style={{
              ...mono, fontSize: 9,
              padding: "2px 8px", borderRadius: 999,
              background: "#EAF3DE", color: "#3B6D11",
              border: "0.5px solid #97C459",
            }}>
              AI-PROCESSED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}