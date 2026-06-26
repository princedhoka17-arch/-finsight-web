"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";

interface NavItem {
  label: string;
  href: string;
  proOnly?: boolean;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/reports",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M10 1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-6-6z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 1v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M5 10h8M5 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Watchlist",
    href: "/watchlist",
    proOnly: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1l2.39 4.84L17 6.76l-4 3.9.94 5.5L9 13.77l-4.94 2.39.94-5.5-4-3.9 5.61-.92L9 1z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Updates",
    href: "/updates",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polyline points="1,12 5,7 9,10 13,4 17,6"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Request",
    href: "/request",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5v4M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Subscribe",
    href: "/subscribe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1v16M1 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const PLAN_LABELS: Record<string, string> = {
  free:           "Free",
  beginner:       "Beginner",
  intermediate:   "Intermediate",
  pay_per_report: "Pay Per Report",
};

export function Sidebar() {
  const pathname = usePathname();
  const { theme } = useThemeStore();

  // ── FIX: Read from store directly — do NOT call useAuth() here ───────────
  // useAuth() creates a new instance that fires syncAndFetchProfile on every
  // render. Sidebar only needs logout — handle it locally with supabase directly.
  const { user, plan, sidebarCollapsed, toggleSidebar, setUser, setPlan, setOnboardingCompleted } = useAppStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const collapsed = sidebarCollapsed;

  // ── FIX: Logout handled locally — no useAuth() needed ────────────────────
  const handleLogout = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await supabase.auth.signOut();
    setUser(null);
    setPlan("free");
    setOnboardingCompleted(false);
    // supabase.auth.onAuthStateChange in useAuth will fire SIGNED_OUT
    // and redirect to /login automatically
  }, [setUser, setPlan, setOnboardingCompleted]);

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <aside style={{
      width: collapsed ? "68px" : "220px",
      minHeight: "100vh",
      background: theme.bgSecondary,
      borderRight: `1px solid ${theme.border}`,
      display: "flex",
      flexDirection: "column",
      transition: "width 0.25s ease",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
      overflowX: "hidden",
    }}>

      {/* ── Logo ── */}
      <div style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        padding: collapsed ? "0 12px" : "0 16px",
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
      }}>
        {!collapsed && (
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: "Courier New, monospace",
              fontSize: "15px", fontWeight: 700,
              letterSpacing: "0.08em", color: theme.text,
            }}>
              FIN<span style={{ color: theme.accent }}>SIGHT</span>
            </span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          style={{
            width: "28px", height: "28px",
            background: "none", border: "none",
            color: theme.textMuted, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "6px", flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {collapsed ? (
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1, padding: "12px 8px",
        display: "flex", flexDirection: "column", gap: "2px",
        overflowY: "auto",
      }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const locked = item.proOnly && plan === "free";

          return (
            <Link
              key={item.label}
              href={locked ? "/subscribe" : item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : "10px",
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px" : "9px 12px",
                borderRadius: "10px", textDecoration: "none",
                background: active ? `${theme.accent}12` : "transparent",
                color: active ? theme.accent : theme.textMuted,
                transition: "all 0.15s", position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = `${theme.border}60`;
                  (e.currentTarget as HTMLElement).style.color = theme.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = theme.textMuted;
                }
              }}
            >
              <span style={{ flexShrink: 0, display: "flex" }}>{item.icon}</span>

              {!collapsed && (
                <span style={{
                  fontFamily: "Georgia, serif", fontSize: "13px",
                  flex: 1, whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {item.label}
                </span>
              )}

              {!collapsed && locked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ color: theme.textFaint, flexShrink: 0 }}>
                  <rect x="2" y="5" width="8" height="6" rx="1"
                    stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4 5V3.5a2 2 0 1 1 4 0V5"
                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}

              {active && !collapsed && (
                <span style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: theme.accent, flexShrink: 0,
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div style={{
        borderTop: `1px solid ${theme.border}`,
        padding: "12px 8px",
        display: "flex", flexDirection: "column", gap: "8px",
        flexShrink: 0,
      }}>
        <Link
          href="/profile"
          style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : "10px",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "8px" : "8px 10px",
            borderRadius: "10px", textDecoration: "none",
            background: `${theme.border}40`, transition: "all 0.15s",
          }}
        >
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: `${theme.accent}20`,
            border: `1px solid ${theme.accent}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Courier New, monospace", fontSize: "11px",
            fontWeight: 700, color: theme.accent, flexShrink: 0,
          }}>
            {initials}
          </div>

          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "Georgia, serif", fontSize: "12px",
                color: theme.text, margin: 0,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {user?.full_name ?? "User"}
              </p>
              <p style={{
                fontFamily: "Courier New, monospace", fontSize: "10px",
                color: theme.accent, margin: 0, letterSpacing: "0.04em",
              }}>
                {PLAN_LABELS[plan] ?? "Free"}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: "none", border: "none",
                color: theme.textFaint, cursor: "pointer",
                padding: "4px", display: "flex",
                alignItems: "center", borderRadius: "4px", flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = theme.danger; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = theme.textFaint; }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M9 2H13V13H9M6 10l3-3-3-3M9 7H1"
                  stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </Link>

        {!collapsed && (
          <p style={{
            fontFamily: "Courier New, monospace", fontSize: "9px",
            color: theme.textFaint, textAlign: "center",
            letterSpacing: "0.04em", lineHeight: 1.5, margin: 0,
          }}>
            Educational research only.<br />Not financial advice.
          </p>
        )}
      </div>
    </aside>
  );
}