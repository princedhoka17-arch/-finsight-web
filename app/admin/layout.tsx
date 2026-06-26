"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_NAV_ITEMS = [
  { href: "/admin",               label: "Overview",      icon: "▦" },
  { href: "/admin/daily-updates", label: "Daily Updates", icon: "◷" },
  { href: "/admin/alerts",        label: "Alerts",        icon: "◉" }, // ← new
  { href: "/admin/reports",       label: "Reports",       icon: "◫" },
  { href: "/admin/requests",      label: "Requests",      icon: "+" },
  { href: "/admin/users",         label: "Users",         icon: "◎" },
  { href: "/admin/audit-logs",    label: "Audit Log",     icon: "≡" },
];

export function isAdminUser(user?: { is_admin?: boolean; role?: string } | null): boolean {
  if (!user) return false;
  if (user.is_admin) return true;
  return user.role === "super_admin" || user.role === "editor" || user.role === "viewer";
}

function hexToRgb(colour: string): string {
  if (!colour || !colour.startsWith("#")) return "168,112,61";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
  if (!r) return "168,112,61";
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}

function SessionTimer({ theme }: { theme: any }) {
  const [seconds, setSeconds] = useState(30 * 60);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  const urgent = seconds < 300;
  const color = urgent ? theme.danger : theme.accent;
  return (
    <div style={{
      background: `rgba(${hexToRgb(color)},0.08)`,
      border: `1px solid ${color}40`, borderRadius: 2,
      padding: "5px 10px", fontFamily: "IBM Plex Mono, monospace",
      fontSize: 11, color, letterSpacing: "0.04em",
    }}>
      ● Session {m}:{s}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme }       = useThemeStore();
  const { user }        = useAppStore();
  const { loading: authLoading, requireAuth, logout } = useAuth();
  const router           = useRouter();
  const pathname         = usePathname();

  const [mounted,    setMounted]    = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) requireAuth(); }, [mounted]);

  useEffect(() => {
    if (!mounted || authLoading) return;
    if (!isAdminUser(user)) {
      router.push("/dashboard");
      return;
    }
    setAuthorized(true);
  }, [mounted, authLoading, user]);

  if (!mounted || authLoading || !authorized) {
    return (
      <div style={{
        minHeight: "100vh", background: theme.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `2px solid ${theme.accent}4D`, borderTopColor: theme.accent,
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const accentRgb = hexToRgb(theme.accent);
  const roleLabel = user?.role
    ? user.role.replace("_", " ").toUpperCase()
    : "ADMIN";

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
  }

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: theme.bg, color: theme.text,
      fontFamily: "'Source Serif 4', Georgia, serif",
    }}>
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: theme.bgSecondary,
        borderRight: `1px solid ${theme.border}`,
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 40,
      }}>
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${theme.border}` }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: "IBM Plex Mono, monospace", fontSize: 14,
              fontWeight: 700, color: theme.text, letterSpacing: "0.08em",
            }}>
              FIN<span style={{ color: theme.accent }}>SIGHT</span>
            </span>
          </Link>
          <div style={{
            display: "inline-block", marginTop: 8,
            fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
            fontWeight: 600, letterSpacing: "0.08em",
            color: theme.danger, background: `rgba(${hexToRgb(theme.danger)},0.1)`,
            border: `1px solid ${theme.danger}40`, borderRadius: 2,
            padding: "2px 8px",
          }}>
            ADMIN MODE
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {ADMIN_NAV_ITEMS.map(item => {
            const active = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", margin: "2px 8px",
                textDecoration: "none",
                background: active ? `rgba(${accentRgb},0.06)` : "transparent",
                color: active ? theme.accent : theme.textMuted,
                borderLeft: active ? `2px solid ${theme.accent}` : "2px solid transparent",
                fontSize: 13, fontFamily: "IBM Plex Mono, monospace",
                fontWeight: active ? 600 : 500, letterSpacing: "0.01em",
                transition: "color 0.15s, background 0.15s",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = theme.accent2; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = theme.textMuted; }}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${theme.border}`, padding: "12px 16px" }}>
          <Link href="/dashboard" style={{
            display: "block", marginBottom: 8,
            fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
            color: theme.accent2, textDecoration: "none", letterSpacing: "0.04em",
          }}>
            ← Back to app
          </Link>
          <button onClick={handleSignOut} disabled={signingOut} style={{
            background: "none", border: "none", padding: 0,
            fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
            color: theme.danger, cursor: signingOut ? "not-allowed" : "pointer",
            letterSpacing: "0.04em", opacity: signingOut ? 0.5 : 1,
          }}>
            {signingOut ? "Signing out…" : "Sign out →"}
          </button>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: 220, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{
          height: 56, borderBottom: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", background: theme.bg, position: "sticky", top: 0, zIndex: 30,
        }}>
          <span style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
            letterSpacing: "0.12em", textTransform: "uppercase", color: theme.textMuted,
          }}>
            {ADMIN_NAV_ITEMS.find(n =>
              pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href))
            )?.label ?? "Admin"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SessionTimer theme={theme} />
            <div style={{
              fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
              color: theme.accent, background: `rgba(${accentRgb},0.08)`,
              border: `1px solid ${theme.accent}30`, borderRadius: 2,
              padding: "5px 10px", letterSpacing: "0.04em",
            }}>
              {roleLabel}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>{children}</main>

        <footer style={{ padding: "12px 28px", borderTop: `1px solid ${theme.border}` }}>
          <p style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
            color: theme.textFaint, letterSpacing: "0.06em", margin: 0, textAlign: "center",
          }}>
            Admin access only. All actions are logged. Session expires after 30 minutes of inactivity.
          </p>
        </footer>
      </div>
    </div>
  );
}