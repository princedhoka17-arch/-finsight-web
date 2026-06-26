"use client";

import { useState, useEffect, useCallback } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { api } from "@/lib/api";

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  level: string;
  onboarding_completed: boolean;
  created_at: string;
}

function hexToRgb(colour: string): string {
  if (!colour || !colour.startsWith("#")) return "168,112,61";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
  if (!r) return "168,112,61";
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

function planColor(plan: string, theme: any): string {
  if (plan === "intermediate")   return theme.accent;
  if (plan === "beginner")       return theme.success;
  if (plan === "pay_per_report") return theme.accent2;
  return theme.textMuted; // free
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

function LoadingRow({ theme }: { theme: any }) {
  return <div style={{ height: 64, borderRadius: 2, background: theme.border, opacity: 0.3, marginBottom: 10 }} />;
}

const PLAN_OPTIONS = ["free", "beginner", "intermediate", "pay_per_report"];

export default function AdminUsersPage() {
  const { theme } = useThemeStore();
  const [mounted, setMounted]     = useState(false);
  const [users, setUsers]         = useState<UserItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch]       = useState("");

  useEffect(() => { setMounted(true); }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?per_page=50${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      setUsers(res.data?.data ?? res.data ?? []);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { if (mounted) fetchUsers(); }, [mounted, fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(t);
  }, [search]);

  if (!mounted) return null;

  async function handleChangePlan(userId: string, plan: string) {
    setLoadingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/plan`, { plan });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Failed to update plan.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24,
          fontWeight: "normal", color: theme.text, marginBottom: 6,
        }}>Users</h1>
        <p style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
          color: theme.textMuted, letterSpacing: "0.04em",
        }}>View users and override their plan</p>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        style={{
          width: "100%", maxWidth: 360, background: theme.bgSecondary,
          border: `1px solid ${theme.border}`, borderRadius: 2,
          padding: "9px 12px", marginBottom: 20,
          fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14,
          color: theme.text, outline: "none", boxSizing: "border-box",
        }}
      />

      {loading ? (
        <>{[1,2,3,4].map(i => <LoadingRow key={i} theme={theme} />)}</>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2 }}>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textMuted }}>No users found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map(user => {
            const isLoading = loadingId === user.id;
            const pColor = planColor(user.plan, theme);
            return (
              <div key={user.id} style={{
                background: theme.bgSecondary, border: `1px solid ${theme.border}`,
                borderRadius: 2, padding: "14px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 2,
                    background: `rgba(${hexToRgb(theme.success)},0.1)`, border: `1px solid ${theme.success}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "IBM Plex Mono, monospace", fontSize: 12, fontWeight: 700, color: theme.success,
                  }}>
                    {user.full_name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.text, margin: 0 }}>
                      {user.full_name}
                    </p>
                    <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.textFaint, marginTop: 2 }}>
                      {user.email} · {user.level} · joined {user.created_at?.slice(0, 10)}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Badge label={user.plan} color={pColor} theme={theme} />
                  {!user.onboarding_completed && (
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.info }}>
                      Onboarding pending
                    </span>
                  )}
                  <select
                    value={user.plan}
                    disabled={isLoading}
                    onChange={e => handleChangePlan(user.id, e.target.value)}
                    style={{
                      background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 2,
                      padding: "5px 8px", fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
                      color: theme.textMuted, cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}