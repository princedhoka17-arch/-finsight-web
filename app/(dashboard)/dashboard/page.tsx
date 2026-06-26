"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { authApi, watchlistApi, updatesApi } from "@/lib/api";
import type { DailyUpdate, Alert, WatchlistItem } from "@/types";

interface DashboardStats {
  reports_read: number;
  reports_available: number;
  watchlist_count: number;
  unread_alerts: number;
  plan: string;
  onboarding_completed: boolean;
}

function getSentimentColor(sentiment: string, theme: any): string {
  if (sentiment === "Positive") return theme.success;
  if (sentiment === "Negative") return theme.danger;
  if (sentiment === "Cautious") return theme.info;
  return theme.textMuted;
}

function getSeverityColors(severity: string, theme: any): { strip: string; bg: string; text: string } {
  if (severity === "high")   return { strip: "#B0503F", bg: "#FAECE7", text: "#993C1D" };
  if (severity === "medium") return { strip: "#C18A2E", bg: "#FAEEDA", text: "#854F0B" };
  return                            { strip: "#3C7A5F", bg: "#EAF3DE", text: "#3B6D11" };
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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

export default function DashboardPage() {
  const { theme } = useThemeStore();
  const router    = useRouter();
  const width     = useWindowWidth();

  const [mounted,   setMounted]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts,    setAlerts]    = useState<Alert[]>([]);
  const [updates,   setUpdates]   = useState<DailyUpdate[]>([]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) fetchAll(); }, [mounted]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [statsRes, watchlistRes, alertsRes, updatesRes] = await Promise.allSettled([
        authApi.getDashboardStats(),
        watchlistApi.getAll(),
        watchlistApi.getAlerts(),
        updatesApi.getMy(4),
      ]);
      if (statsRes.status     === "fulfilled") setStats(statsRes.value.data);
      if (watchlistRes.status === "fulfilled") setWatchlist(watchlistRes.value.data ?? []);
      if (alertsRes.status    === "fulfilled") setAlerts((alertsRes.value.data ?? []).slice(0, 2));
      if (updatesRes.status   === "fulfilled") setUpdates(updatesRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  const isMobile = width > 0 && width < 640;
  const isTablet = width >= 640 && width < 1024;

  const todayUpdates       = updates.filter(u => {
    const d = new Date(u.created_at);
    return d.toDateString() === new Date().toDateString();
  });
  const unreadHighSeverity = alerts.filter(a => a.severity === "high" && !a.is_read).length;

  const mono: React.CSSProperties = {
    fontFamily: "IBM Plex Mono, monospace",
    letterSpacing: "0.04em",
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* Breadcrumb — hide on mobile to save space */}
      {!isMobile && (
        <div style={{
          ...mono, fontSize: 10, color: theme.textFaint,
          display: "flex", alignItems: "center", gap: 5, marginBottom: 18,
          letterSpacing: "0.06em",
        }}>
          Home <span>›</span> <span style={{ color: theme.text }}>Dashboard</span>
        </div>
      )}

      {/* Page title on mobile */}
      {isMobile && (
        <div style={{ marginBottom: 14 }}>
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 20, fontWeight: 600, color: theme.text, margin: "0 0 2px",
          }}>Dashboard</h1>
          <p style={{ ...mono, fontSize: 10, color: theme.textMuted, margin: 0 }}>
            Your portfolio at a glance
          </p>
        </div>
      )}

      {/* ── Stat grid ── 2×2 on mobile, 4-col on tablet/desktop */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
        gap: isMobile ? 8 : 10,
        marginBottom: isMobile ? 14 : 18,
      }}>
        <StatCard
          theme={theme} isMobile={isMobile}
          label="Watching"
          value={loading ? "—" : (stats?.watchlist_count ?? watchlist.length)}
          sub="stocks tracked"
          subColor={theme.textMuted}
        />
        <StatCard
          theme={theme} isMobile={isMobile}
          label="Unread alerts"
          value={loading ? "—" : (stats?.unread_alerts ?? 0)}
          valueColor={stats?.unread_alerts ? "#B0503F" : undefined}
          sub={unreadHighSeverity > 0 ? `${unreadHighSeverity} high` : "all clear"}
          subColor={unreadHighSeverity > 0 ? "#993C1D" : theme.textMuted}
        />
        <StatCard
          theme={theme} isMobile={isMobile}
          label="Reports"
          value={loading ? "—" : (stats?.reports_read ?? 0)}
          sub={stats ? `of ${stats.reports_available}` : ""}
          subColor={theme.textMuted}
        />
        <StatCard
          theme={theme} isMobile={isMobile}
          label="Updates"
          value={loading ? "—" : todayUpdates.length}
          sub="today"
          subColor={theme.success}
        />
      </div>

      {/* ── Watchlist + Alerts ── stacked on mobile, 2-col on tablet+ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 10 : 14,
        marginBottom: isMobile ? 10 : 14,
      }}>
        <Card theme={theme} title="Watchlist" icon="◎" onSeeAll={() => router.push("/watchlist")}>
          <div style={{ padding: isMobile ? "4px 10px" : "6px 14px" }}>
            {loading ? (
              <SkeletonRows theme={theme} count={isMobile ? 3 : 4} />
            ) : watchlist.length === 0 ? (
              <EmptyMini theme={theme} text="No stocks yet — add some to your watchlist" />
            ) : (
              watchlist.slice(0, isMobile ? 3 : 4).map(item => (
                <WatchRow key={item.id} theme={theme} item={item} isMobile={isMobile} />
              ))
            )}
          </div>
        </Card>

        <Card theme={theme} title="Recent Alerts" icon="🔔" onSeeAll={() => router.push("/alerts")}>
          <div style={{ padding: isMobile ? "6px 10px" : "8px 10px" }}>
            {loading ? (
              <SkeletonRows theme={theme} count={2} height={64} />
            ) : alerts.length === 0 ? (
              <EmptyMini theme={theme} text="No alerts yet" />
            ) : (
              alerts.map(alert => (
                <AlertRow key={alert.id} theme={theme} alert={alert} isMobile={isMobile} />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Today's updates ── 1-col on mobile, 2-col on tablet+ */}
      <div style={{
        background: theme.bgSecondary,
        border: `0.5px solid ${theme.border}`,
        borderRadius: 8, overflow: "hidden",
      }}>
        <div style={{
          padding: isMobile ? "10px 12px" : "12px 14px",
          borderBottom: `0.5px solid ${theme.border}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14, color: theme.textMuted }}>📰</span>
          <span style={{
            ...mono, fontSize: 11,
            fontWeight: 500, letterSpacing: "0.07em", color: theme.text,
          }}>
            TODAY'S UPDATES
          </span>
          <button onClick={() => router.push("/updates")} style={{
            marginLeft: "auto", background: "none", border: "none",
            ...mono, fontSize: 10, color: theme.textMuted, cursor: "pointer",
          }}>
            see all →
          </button>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 8 : 10,
          padding: isMobile ? 10 : 12,
        }}>
          {loading ? (
            <>
              <SkeletonBlock theme={theme} />
              {!isMobile && <SkeletonBlock theme={theme} />}
            </>
          ) : updates.length === 0 ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyMini theme={theme} text="No updates today — check back tomorrow morning" />
            </div>
          ) : (
            updates.slice(0, isMobile ? 1 : 2).map(update => (
              <MiniUpdateCard key={update.id} theme={theme} update={update} isMobile={isMobile} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function StatCard({ theme, label, value, sub, subColor, valueColor, isMobile }: {
  theme: any; label: string; value: string | number;
  sub: string; subColor: string; valueColor?: string; isMobile?: boolean;
}) {
  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 8,
      padding: isMobile ? "12px 12px 10px" : "14px 16px",
    }}>
      <p style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: isMobile ? 9 : 10,
        color: theme.textFaint, letterSpacing: "0.06em",
        textTransform: "uppercase", margin: "0 0 5px",
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: isMobile ? 22 : 20,
        fontWeight: 500, color: valueColor ?? theme.text, margin: 0,
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: isMobile ? 9 : 10,
        color: subColor, margin: "3px 0 0",
      }}>
        {sub}
      </p>
    </div>
  );
}

function Card({ theme, title, icon, onSeeAll, children }: {
  theme: any; title: string; icon: string;
  onSeeAll: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 8, overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px",
        borderBottom: `0.5px solid ${theme.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 14, color: theme.textMuted }}>{icon}</span>
        <span style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
          fontWeight: 500, letterSpacing: "0.07em", color: theme.text,
        }}>
          {title.toUpperCase()}
        </span>
        <button onClick={onSeeAll} style={{
          marginLeft: "auto", background: "none", border: "none",
          fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
          color: theme.textMuted, cursor: "pointer",
        }}>
          see all →
        </button>
      </div>
      {children}
    </div>
  );
}

function WatchRow({ theme, item, isMobile }: { theme: any; item: WatchlistItem; isMobile?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: isMobile ? "8px 0" : "9px 0",
      borderBottom: `0.5px solid ${theme.border}`,
    }}>
      <span style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: isMobile ? 11 : 12,
        fontWeight: 500, color: theme.text,
        width: isMobile ? 50 : 60, flexShrink: 0,
      }}>
        {item.company?.ticker ?? "—"}
      </span>
      <span style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: isMobile ? 12 : 12,
        color: theme.textMuted, flex: 1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {item.company?.name ?? ""}
      </span>
    </div>
  );
}

function AlertRow({ theme, alert, isMobile }: { theme: any; alert: Alert; isMobile?: boolean }) {
  const colors = getSeverityColors(alert.severity, theme);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "3px 1fr",
      borderRadius: 6, overflow: "hidden", marginBottom: 6,
      border: `0.5px solid ${theme.border}`,
    }}>
      <div style={{ background: colors.strip }} />
      <div style={{ padding: isMobile ? "8px 10px" : "9px 11px" }}>
        <p style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: isMobile ? 10 : 11,
          fontWeight: 500, color: theme.text, margin: 0,
        }}>
          {alert.company_name}
          <span style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 9,
            color: theme.textFaint, marginLeft: 6, fontWeight: 400,
          }}>
            {timeAgo(alert.created_at)}
          </span>
        </p>
        <p style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: isMobile ? 12 : 12,
          color: theme.textMuted, marginTop: 2, lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        } as React.CSSProperties}>
          {alert.message}
        </p>
        <span style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 9,
          borderRadius: 999, padding: "1px 6px",
          background: colors.bg, color: colors.text,
          display: "inline-block", marginTop: 4,
        }}>
          {alert.severity.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function MiniUpdateCard({ theme, update, isMobile }: { theme: any; update: DailyUpdate; isMobile?: boolean }) {
  const sentimentColor = getSentimentColor(update.sentiment, theme);
  return (
    <div style={{
      background: theme.bg,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 8,
      padding: isMobile ? "12px 12px" : "13px 15px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
          fontWeight: 500, color: theme.text,
        }}>
          {update.company?.ticker ?? "—"}
        </span>
        <span style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 9,
          borderRadius: 999, padding: "2px 7px",
          background: `${sentimentColor}18`, color: sentimentColor,
        }}>
          {update.sentiment}
        </span>
        {update.change_percent != null && (
          <span style={{
            marginLeft: "auto",
            fontFamily: "IBM Plex Mono, monospace", fontSize: 9,
            color: update.change_percent >= 0 ? theme.success : theme.danger,
          }}>
            {update.change_percent >= 0 ? "+" : ""}{update.change_percent}%
          </span>
        )}
      </div>
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: isMobile ? 14 : 13,
        fontWeight: 500, color: theme.text, margin: "0 0 4px",
        lineHeight: 1.4,
      }}>
        {update.headline}
      </p>
      {update.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
          {update.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontFamily: "IBM Plex Mono, monospace", fontSize: 9,
              background: theme.bgSecondary, color: theme.textFaint,
              border: `0.5px solid ${theme.border}`,
              borderRadius: 999, padding: "2px 7px",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonRows({ theme, count, height = 36 }: { theme: any; count: number; height?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          height, borderRadius: 4,
          background: theme.border,
          opacity: 0.3, marginBottom: 8,
          animation: "pulse 1.4s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:0.15}}`}</style>
    </>
  );
}

function SkeletonBlock({ theme }: { theme: any }) {
  return (
    <div style={{
      height: 110, borderRadius: 8,
      background: theme.border, opacity: 0.3,
      animation: "pulse 1.4s ease-in-out infinite",
    }} />
  );
}

function EmptyMini({ theme, text }: { theme: any; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 10px" }}>
      <p style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
        color: theme.textMuted, margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
}