"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useThemeStore } from "@/store/useThemeStore";
import { api } from "@/lib/api";

interface AdminStats {
  total_users: number;
  new_users_today: number;
  active_subscribers: number;
  total_reports: number;
  reports_published_today: number;
  pending_daily_updates: number;
  pending_requests: number;
  mrr_rupees: number;
}

function hexToRgb(colour: string): string {
  if (!colour || !colour.startsWith("#")) return "168,112,61";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
  if (!r) return "168,112,61";
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

function StatCard({ label, value, accent, href, theme }: {
  label: string; value: string | number; accent?: boolean; href?: string; theme: any;
}) {
  const rgb = hexToRgb(theme.accent);
  const content = (
    <div style={{
      background: accent ? `rgba(${rgb},0.06)` : theme.bgSecondary,
      border: `1px solid ${accent ? theme.accent + "33" : theme.border}`,
      borderTop: `2px solid ${theme.border}`,
      borderRadius: 2, padding: "18px 20px",
      transition: "border-top-color 0.15s",
    }}
    onMouseEnter={e => href && ((e.currentTarget as HTMLElement).style.borderTopColor = theme.accent2)}
    onMouseLeave={e => href && ((e.currentTarget as HTMLElement).style.borderTopColor = theme.border)}
    >
      <p style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
        letterSpacing: "0.07em", textTransform: "uppercase",
        color: theme.textMuted, marginBottom: 8,
      }}>{label}</p>
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28,
        color: accent ? theme.accent : theme.text, margin: 0,
      }}>{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: "none", display: "block" }}>{content}</Link>;
  }
  return content;
}

export default function AdminOverviewPage() {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats]     = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) fetchStats(); }, [mounted, fetchStats]);

  if (!mounted) return null;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24,
          fontWeight: "normal", color: theme.text, marginBottom: 6,
        }}>Overview</h1>
        <p style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
          color: theme.textMuted, letterSpacing: "0.04em",
        }}>Platform-wide metrics, updated on load</p>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} style={{ height: 88, borderRadius: 2, background: theme.border, opacity: 0.3 }} />
          ))}
        </div>
      ) : !stats ? (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2,
        }}>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textMuted }}>
            Failed to load stats.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          <StatCard label="Total Users" value={stats.total_users} theme={theme} href="/admin/users" />
          <StatCard label="New Users Today" value={stats.new_users_today} theme={theme} accent href="/admin/users" />
          <StatCard label="Active Subscribers" value={stats.active_subscribers} theme={theme} href="/admin/users" />
          <StatCard label="MRR (₹)" value={stats.mrr_rupees.toLocaleString("en-IN")} theme={theme} accent />
          <StatCard label="Total Reports" value={stats.total_reports} theme={theme} href="/admin/reports" />
          <StatCard label="Published Today" value={stats.reports_published_today} theme={theme} accent href="/admin/reports" />
          <StatCard label="Pending Updates" value={stats.pending_daily_updates} theme={theme} accent href="/admin/daily-updates" />
          <StatCard label="Pending Requests" value={stats.pending_requests} theme={theme} accent href="/admin/requests" />
        </div>
      )}
    </div>
  );
}