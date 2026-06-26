"use client";

import { useState, useEffect, useCallback } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { alertsApi } from "@/lib/api";
import type { Alert } from "@/types";

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

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterValue = "all" | "unread" | "high" | "medium" | "low";

const SEV = {
  high:   { strip: "#B0503F", badge: "#FAECE7", badgeText: "#993C1D", label: "HIGH"   },
  medium: { strip: "#C18A2E", badge: "#FAEEDA", badgeText: "#854F0B", label: "MEDIUM" },
  low:    { strip: "#3C7A5F", badge: "#EAF3DE", badgeText: "#3B6D11", label: "LOW"    },
} as const;

const ALERT_TYPE_LABELS: Record<string, string> = {
  earnings:         "Earnings",
  risk:             "Risk",
  news:             "News",
  management:       "Management",
  price:            "Price",
  report_published: "Report",
  daily_update:     "Daily Update",
  broadcast:        "Broadcast",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Alert row ────────────────────────────────────────────────────────────────

function AlertRow({
  alert, onRead, expanded, onToggle, theme, isMobile,
}: {
  alert: Alert; onRead: (id: string) => void;
  expanded: boolean; onToggle: (id: string) => void;
  theme: any; isMobile: boolean;
}) {
  const cfg    = SEV[alert.severity as keyof typeof SEV] ?? SEV.medium;
  const isRead = alert.is_read;

  // On mobile, truncate at 120 chars; desktop keeps 160
  const truncLen = isMobile ? 120 : 160;

  return (
    <div
      onClick={() => { if (!isRead) onRead(alert.id); onToggle(alert.id); }}
      style={{
        display: "grid", gridTemplateColumns: "3px 1fr",
        borderRadius: 6, overflow: "hidden", marginBottom: 6,
        border: `0.5px solid ${theme.border}`,
        background: theme.bgSecondary,
        cursor: "pointer",
      }}
    >
      {/* Severity strip */}
      <div style={{ background: cfg.strip }} />

      {/* Content */}
      <div style={{ padding: isMobile ? "8px 10px" : "9px 11px" }}>
        {/* Top row: company + time + unread dot */}
        <div style={{
          fontFamily: "IBM Plex Mono, monospace",
          fontSize: isMobile ? 10 : 11,
          display: "flex", alignItems: "center", marginBottom: 2,
        }}>
          <span style={{
            fontWeight: isRead ? 400 : 600,
            color: isRead ? theme.textMuted : theme.text,
          }}>
            {alert.company_name}
          </span>
          <span style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 9,
            color: theme.textFaint, marginLeft: 8, fontWeight: 400,
          }}>
            {timeAgo(alert.created_at)}
          </span>
          {!isRead && (
            <span style={{
              display: "inline-block",
              width: 7, height: 7,
              borderRadius: "50%",
              background: cfg.strip,
              marginLeft: "auto",
              flexShrink: 0,
            }} />
          )}
        </div>

        {/* Message */}
        <p style={{
          margin: "2px 0 4px",
          fontSize: isMobile ? 11 : 12,
          lineHeight: 1.55,
          color: theme.textMuted,
          fontFamily: "'Source Serif 4', Georgia, serif",
        }}>
          {alert.message.length > truncLen && !expanded
            ? alert.message.slice(0, truncLen) + "…"
            : alert.message}
        </p>

        {/* Meta row: severity pill + type + read label */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 9,
            borderRadius: 999, padding: "1px 6px",
            background: isRead ? theme.bgSecondary : cfg.badge,
            color:      isRead ? theme.textFaint   : cfg.badgeText,
            border: `0.5px solid ${isRead ? theme.border : "transparent"}`,
          }}>
            {cfg.label}
          </span>
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 9, color: theme.textFaint }}>
            {ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
          </span>
          {isRead && (
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 9, color: theme.textFaint }}>
              · read
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonAlerts({ theme }: { theme: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {[82, 68, 90].map((h, i) => (
        <div key={i} style={{
          height: h, borderRadius: 6,
          background: theme.border, opacity: 0.25,
          animation: "pulse 1.4s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { theme } = useThemeStore();
  const width     = useWindowWidth();
  const isMobile  = width > 0 && width < 640;
  const isTablet  = width >= 640 && width < 1024;

  const [alerts,     setAlerts]     = useState<Alert[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [filter,     setFilter]     = useState<FilterValue>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await alertsApi.getAll();
      const data: Alert[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setAlerts(data);
    } catch {
      setError("Could not load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markRead = useCallback(async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    try { await alertsApi.markRead(id); } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    try { await alertsApi.markAllRead(); } catch {}
  }, []);

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const highCount   = alerts.filter(a => a.severity === "high").length;
  const medCount    = alerts.filter(a => a.severity === "medium").length;

  const filtered = alerts.filter(a => {
    if (filter === "unread") return !a.is_read;
    if (filter === "all")    return true;
    return a.severity === filter;
  });

  const grouped: Record<string, Alert[]> = {};
  filtered.forEach(a => {
    const key = dayLabel(a.created_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const card: React.CSSProperties = {
    background: theme.bgSecondary,
    border: `0.5px solid ${theme.border}`,
    borderRadius: 8, overflow: "hidden",
  };

  const FILTERS: { value: FilterValue; label: string }[] = [
    { value: "all",    label: "All" },
    { value: "unread", label: `Unread (${unreadCount})` },
    { value: "high",   label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low",    label: "Low" },
  ];

  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.25} 50%{opacity:0.12} }`}</style>

      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: isMobile ? "16px 14px" : "20px",
        paddingBottom: isMobile ? 86 : 20, // bottom nav clearance on mobile
        display: "flex", flexDirection: "column", gap: isMobile ? 12 : 14,
      }}>

        {/* ── Breadcrumb (desktop/tablet only) / Page title (mobile) ── */}
        {isMobile ? (
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 20, fontWeight: 600,
            color: theme.text, margin: 0,
          }}>
            Alerts
          </h1>
        ) : (
          <div style={{ ...mono, fontSize: 10, color: theme.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
            Home <span>›</span> <span style={{ color: theme.text }}>Alerts</span>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div style={{
          display: "grid",
          // Mobile: 3-col still fits fine since cards are small; keep same
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: isMobile ? 8 : 10,
        }}>
          {[
            { label: "High",   value: loading ? "—" : highCount,   color: "#B0503F" },
            { label: "Medium", value: loading ? "—" : medCount,    color: "#C18A2E" },
            { label: "Unread", value: loading ? "—" : unreadCount, color: theme.text },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: isMobile ? "10px 12px" : "14px 16px" }}>
              <p style={{
                ...mono, fontSize: isMobile ? 9 : 10,
                color: theme.textFaint, textTransform: "uppercase",
                letterSpacing: "0.06em", margin: "0 0 4px",
              }}>
                {s.label}
              </p>
              <p style={{
                ...mono,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 500, color: s.color, margin: 0,
              }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Alerts card ── */}
        <div style={card}>

          {/* Card header */}
          <div style={{
            padding: isMobile ? "10px 12px" : "12px 14px",
            borderBottom: `0.5px solid ${theme.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: isMobile ? 13 : 14, color: theme.textMuted }}>🔔</span>
            <span style={{
              ...mono,
              fontSize: isMobile ? 10 : 11,
              fontWeight: 500, letterSpacing: "0.07em", color: theme.text,
            }}>
              ALL ALERTS
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  marginLeft: "auto",
                  background: "none", border: "none",
                  ...mono, fontSize: isMobile ? 9 : 10,
                  color: theme.textFaint, cursor: "pointer",
                  // On mobile, tap target a bit bigger
                  padding: isMobile ? "4px 0" : 0,
                }}
              >
                mark all read
              </button>
            )}
          </div>

          {/* Filter tabs — horizontal scroll on mobile, no wrap */}
          <div style={{
            display: "flex",
            borderBottom: `0.5px solid ${theme.border}`,
            overflowX: "auto",
            flexWrap: "nowrap",
            // Hide scrollbar visually but keep functional
            scrollbarWidth: "none",
            msOverflowStyle: "none" as any,
          }}>
            {FILTERS.map(f => {
              const active = filter === f.value;
              const accentColor =
                f.value === "high"   ? "#B0503F" :
                f.value === "medium" ? "#C18A2E" :
                f.value === "low"    ? "#3C7A5F" : theme.accent;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  style={{
                    ...mono,
                    fontSize: isMobile ? 9 : 10,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: isMobile ? "8px 12px" : "9px 14px",
                    background: "none", border: "none",
                    borderBottom: `2px solid ${active ? accentColor : "transparent"}`,
                    color: active ? accentColor : theme.textFaint,
                    cursor: "pointer", whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Alert list */}
          <div style={{ padding: isMobile ? "8px" : "10px" }}>
            {loading && <SkeletonAlerts theme={theme} />}

            {error && (
              <div style={{
                ...mono, fontSize: isMobile ? 10 : 11,
                color: "#993C1D",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 4px",
              }}>
                {error}
                <button
                  onClick={fetchAlerts}
                  style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.accent, background: "none", border: "none", cursor: "pointer" }}
                >
                  retry →
                </button>
              </div>
            )}

            {!loading && !error && alerts.length === 0 && (
              <div style={{ textAlign: "center", padding: isMobile ? "32px 16px" : "40px 20px" }}>
                <div style={{ fontSize: isMobile ? 20 : 22, color: theme.textFaint, marginBottom: 8 }}>🔔</div>
                <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, margin: 0 }}>
                  No alerts yet
                </p>
                <p style={{
                  ...mono, fontSize: isMobile ? 9 : 10,
                  color: theme.textFaint, marginTop: 6, lineHeight: 1.6,
                }}>
                  When something notable happens with a stock you're watching, it'll appear here.
                </p>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && alerts.length > 0 && (
              <div style={{ textAlign: "center", padding: isMobile ? "20px 16px" : "28px 20px" }}>
                <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, margin: "0 0 8px" }}>
                  No alerts match this filter
                </p>
                <button
                  onClick={() => setFilter("all")}
                  style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.accent, background: "none", border: "none", cursor: "pointer" }}
                >
                  clear filter →
                </button>
              </div>
            )}

            {Object.entries(grouped).map(([day, dayAlerts]) => (
              <div key={day} style={{ marginBottom: isMobile ? 16 : 20 }}>
                {/* Day divider */}
                <div style={{
                  display: "flex", alignItems: "center",
                  gap: isMobile ? 8 : 10, marginBottom: 8,
                }}>
                  <span style={{
                    ...mono, fontSize: 9, color: theme.textFaint,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>
                    {day}
                  </span>
                  <div style={{ flex: 1, height: "0.5px", background: theme.border }} />
                  <span style={{ ...mono, fontSize: 9, color: theme.textFaint, whiteSpace: "nowrap" }}>
                    {dayAlerts.filter(a => !a.is_read).length > 0
                      ? `${dayAlerts.filter(a => !a.is_read).length} unread`
                      : "all read"}
                  </span>
                </div>

                {dayAlerts.map(alert => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    theme={theme}
                    isMobile={isMobile}
                    onRead={markRead}
                    expanded={expandedId === alert.id}
                    onToggle={id => setExpandedId(prev => prev === id ? null : id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}