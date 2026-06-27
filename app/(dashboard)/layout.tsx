"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useThemeStore, THEMES, type ThemeId } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "⊞" },
    ],
  },
  {
    label: "My Portfolio",
    items: [
      { href: "/watchlist",  label: "Watchlist",     icon: "◎" },
      { href: "/alerts",     label: "Alerts",        icon: "🔔" },
      { href: "/updates",    label: "Daily Updates", icon: "📰" },
    ],
  },
  {
    label: "Research",
    items: [
      { href: "/reports",  label: "Reports",  icon: "◫" },
      { href: "/screener", label: "Screener", icon: "⊡" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/request",   label: "Request",  icon: "+" },
      { href: "/subscribe", label: "Upgrade",  icon: "◈" },
      { href: "/settings",  label: "Settings", icon: "⚙" },
    ],
  },
];

const NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Home",    icon: "⊞" },
  { href: "/watchlist", label: "Watch",   icon: "◎" },
  { href: "/alerts",    label: "Alerts",  icon: "🔔" },
  { href: "/reports",   label: "Reports", icon: "◫" },
  { href: "/updates",   label: "Updates", icon: "📰" },
];

const MORE_ITEMS = [
  { href: "/screener",  label: "Screener", icon: "⊡" },
  { href: "/request",   label: "Request",  icon: "+" },
  { href: "/subscribe", label: "Upgrade",  icon: "◈" },
  { href: "/settings",  label: "Settings", icon: "⚙" },
];

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, themeId, setTheme } = useThemeStore();
  const { user, plan, unreadCount, sidebarCollapsed, toggleSidebar } = useAppStore();
  const { loading, isAuthenticated, logout } = useAuth();

  const router   = useRouter();
  const pathname = usePathname();
  const width    = useWindowWidth();

  const [mounted,        setMounted]        = useState(false);
  const [signingOut,     setSigningOut]      = useState(false);
  const [showUserMenu,   setShowUserMenu]    = useState(false);
  const [showMore,       setShowMore]        = useState(false);
  const [showMobileMenu, setShowMobileMenu]  = useState(false);

  const hasRedirected = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const onboardingCompleted = user?.onboarding_completed ?? false;

  useEffect(() => {
    if (!mounted || loading) return;
    if (hasRedirected.current) return;
    if (!isAuthenticated) {
      hasRedirected.current = true;
      router.push("/login");
      return;
    }
    if (!onboardingCompleted && pathname !== "/onboarding") {
      hasRedirected.current = true;
      router.push("/onboarding");
    }
  }, [mounted, loading, isAuthenticated, onboardingCompleted]);

  useEffect(() => {
    if (isAuthenticated && onboardingCompleted) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated, onboardingCompleted]);

  // Close drawers on route change
  useEffect(() => {
    setShowMore(false);
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

  if (!mounted || loading || width === 0) {
    return (
      <div style={{
        minHeight: "100vh", background: theme.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: 32, height: 32,
            border: `2px solid ${theme.accent}4D`,
            borderTopColor: theme.accent, borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
            color: theme.textMuted, letterSpacing: "0.08em",
          }}>LOADING…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const effectiveCollapsed = isTablet ? true : sidebarCollapsed;
  const sideW = isDesktop
    ? (sidebarCollapsed ? 64 : 220)
    : isTablet ? 56 : 0;

  async function handleSignOut() {
    setSigningOut(true);
    setShowUserMenu(false);
    await logout();
  }

  const planLabel: Record<string, string> = {
    free: "FREE", beginner: "BEGINNER",
    intermediate: "INTERMEDIATE", pay_per_report: "PAY-PER-REPORT",
  };

  const mono: React.CSSProperties = {
    fontFamily: "IBM Plex Mono, monospace",
    letterSpacing: "0.04em",
  };

  const currentLabel = NAV_ITEMS.find(n =>
    pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href))
  )?.label ?? "Dashboard";

  // ── Shared user menu dropdown ────────────────────────────────
  function UserMenuDropdown({ position }: { position: "sidebar" | "topbar" }) {
    const style: React.CSSProperties = position === "topbar"
      ? {
          position: "fixed", top: 58, right: 14,
          background: theme.bg, border: `0.5px solid ${theme.border}`,
          borderRadius: 8, overflow: "hidden", zIndex: 60,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", minWidth: 200,
        }
      : {
          position: "absolute", bottom: "calc(100% + 4px)", left: 8, right: 8,
          background: theme.bg, border: `0.5px solid ${theme.border}`,
          borderRadius: 8, overflow: "hidden", zIndex: 60,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        };

    return (
      <>
        {/* Backdrop to close menu */}
        <div
          onClick={() => setShowUserMenu(false)}
          style={{ position: "fixed", inset: 0, zIndex: 59 }}
        />
        <div style={style}>
          <div style={{ padding: "10px 14px", borderBottom: `0.5px solid ${theme.border}` }}>
            <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 13, color: theme.text, margin: "0 0 2px" }}>
              {user?.full_name ?? "Investor"}
            </p>
            <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: 0 }}>
              {user?.email ?? ""}
            </p>
          </div>
          <Link href="/settings" onClick={() => setShowUserMenu(false)} style={{
            display: "block", padding: "10px 14px",
            ...mono, fontSize: 12, color: theme.textMuted,
            textDecoration: "none", borderBottom: `0.5px solid ${theme.border}`,
          }}>
            Settings →
          </Link>
          <Link href="/subscribe" onClick={() => setShowUserMenu(false)} style={{
            display: "block", padding: "10px 14px",
            ...mono, fontSize: 12, color: theme.accent,
            textDecoration: "none", borderBottom: `0.5px solid ${theme.border}`,
          }}>
            {planLabel[plan] ?? "FREE"} plan →
          </Link>
          <button onClick={handleSignOut} disabled={signingOut} style={{
            display: "block", width: "100%", padding: "10px 14px",
            background: "none", border: "none", textAlign: "left",
            ...mono, fontSize: 12, color: theme.danger,
            cursor: signingOut ? "not-allowed" : "pointer",
            opacity: signingOut ? 0.5 : 1,
          }}>
            {signingOut ? "Signing out…" : "Sign out →"}
          </button>
        </div>
      </>
    );
  }

  // ── Shared sidebar nav renderer ──────────────────────────────
  function SidebarNav({ collapsed }: { collapsed: boolean }) {
    return (
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <div style={{
                ...mono, fontSize: 9, letterSpacing: "0.1em",
                color: theme.textFaint, textTransform: "uppercase",
                padding: "10px 16px 4px",
              }}>
                {section.label}
              </div>
            )}
            {section.items.map(item => {
              const active = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const isAlerts = item.href === "/alerts";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex", alignItems: "center",
                    gap: collapsed ? 0 : 9,
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "11px 0" : "7px 10px",
                    margin: "1px 8px", borderRadius: 6, textDecoration: "none",
                    background: active ? "#FAECE7" : "transparent",
                    color: active ? "#993C1D" : theme.textMuted,
                    transition: "color 0.15s, background 0.15s",
                    fontSize: 13, ...mono,
                    fontWeight: active ? 500 : 400,
                    position: "relative",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = `${theme.border}50`;
                      (e.currentTarget as HTMLElement).style.color = theme.text;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = theme.textMuted;
                    }
                  }}
                >
                  <span style={{ fontSize: 15, flexShrink: 0, fontFamily: "system-ui, sans-serif", position: "relative" }}>
                    {item.icon}
                    {isAlerts && collapsed && unreadCount > 0 && (
                      <span style={{
                        position: "absolute", top: -3, right: -3,
                        width: 7, height: 7, borderRadius: "50%",
                        background: theme.danger,
                      }} />
                    )}
                  </span>
                  {!collapsed && item.label}
                  {!collapsed && isAlerts && unreadCount > 0 && (
                    <span style={{
                      marginLeft: "auto",
                      background: "#B0503F", color: "#fff",
                      fontSize: 9, ...mono,
                      borderRadius: 999, padding: "2px 6px",
                      minWidth: 18, textAlign: "center", fontWeight: 700,
                    }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    );
  }

  // ════════════════════════════════════════════════════════════
  // MOBILE LAYOUT (< 640px)
  // ════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div style={{
        minHeight: "100vh", background: theme.bg,
        color: theme.text, fontFamily: "'Source Serif 4', Georgia, serif",
        display: "flex", flexDirection: "column",
      }}>

        {/* Mobile topbar */}
        <header style={{
          height: 50, background: theme.bgSecondary,
          borderBottom: `0.5px solid ${theme.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 14px",
          position: "sticky", top: 0, zIndex: 40,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, background: "#B0503F",
              display: "flex", alignItems: "center", justifyContent: "center",
              ...mono, fontSize: 12, fontWeight: 500, color: "#fff",
            }}>F</div>
            <span style={{ ...mono, fontSize: 12, letterSpacing: "0.07em", color: theme.text, fontWeight: 500 }}>
              {currentLabel.toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => router.push("/alerts")}
              style={{
                background: "none", border: `0.5px solid ${theme.border}`,
                borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                color: theme.textMuted, display: "flex", alignItems: "center", gap: 4,
                position: "relative",
              }}
            >
              <span style={{ fontSize: 14 }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{ ...mono, fontSize: 10, color: theme.danger }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* ── Mobile avatar → user menu with sign out ── */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#FAEEDA",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...mono, fontSize: 11, color: "#854F0B", fontWeight: 500,
                }}>
                  {user?.full_name?.[0]?.toUpperCase() ?? "U"}
                </div>
              </button>
              {showUserMenu && <UserMenuDropdown position="topbar" />}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "16px 14px", overflowY: "auto", paddingBottom: 72 }}>
          {children}
        </main>

        {/* "More" drawer overlay */}
        {showMore && (
          <>
            <div
              onClick={() => setShowMore(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 45,
                background: "rgba(0,0,0,0.4)",
              }}
            />
            <div style={{
              position: "fixed", bottom: 56, left: 0, right: 0,
              background: theme.bgSecondary,
              borderTop: `0.5px solid ${theme.border}`,
              borderRadius: "12px 12px 0 0",
              zIndex: 46, padding: "12px 0 8px",
            }}>
              <div style={{
                ...mono, fontSize: 9, letterSpacing: "0.1em",
                color: theme.textFaint, padding: "0 16px 8px",
                textTransform: "uppercase",
              }}>
                More
              </div>
              {MORE_ITEMS.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 16px", textDecoration: "none",
                      background: active ? "#FAECE7" : "transparent",
                      color: active ? "#993C1D" : theme.text,
                    }}
                  >
                    <span style={{ fontSize: 18, fontFamily: "system-ui, sans-serif" }}>{item.icon}</span>
                    <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15 }}>{item.label}</span>
                    {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#B0503F" }} />}
                  </Link>
                );
              })}

              {/* Sign out in More drawer */}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 16px", width: "100%",
                  background: "none", border: "none", cursor: signingOut ? "not-allowed" : "pointer",
                  opacity: signingOut ? 0.5 : 1,
                  borderTop: `0.5px solid ${theme.border}`,
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 18 }}>→</span>
                <span style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 15, color: theme.danger,
                }}>
                  {signingOut ? "Signing out…" : "Sign out"}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Bottom navigation bar */}
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: 56, background: theme.bgSecondary,
          borderTop: `0.5px solid ${theme.border}`,
          display: "flex", zIndex: 50,
        }}>
          {BOTTOM_NAV.map(item => {
            const active = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isAlerts = item.href === "/alerts";
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 3,
                  textDecoration: "none", position: "relative",
                  color: active ? "#B0503F" : theme.textMuted,
                }}
              >
                <span style={{ fontSize: 18, fontFamily: "system-ui, sans-serif", position: "relative" }}>
                  {item.icon}
                  {isAlerts && unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: -2, right: -4,
                      width: 7, height: 7, borderRadius: "50%",
                      background: theme.danger,
                    }} />
                  )}
                </span>
                <span style={{ ...mono, fontSize: 8, letterSpacing: "0.04em" }}>
                  {item.label.toUpperCase()}
                </span>
                {active && (
                  <span style={{
                    position: "absolute", top: 0, left: "50%",
                    transform: "translateX(-50%)",
                    width: 24, height: 2, borderRadius: 1,
                    background: "#B0503F",
                  }} />
                )}
              </Link>
            );
          })}
          {/* More tab */}
          <button
            onClick={() => setShowMore(v => !v)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              color: showMore ? "#B0503F" : theme.textMuted,
              position: "relative",
            }}
          >
            <span style={{ fontSize: 18 }}>⋯</span>
            <span style={{ ...mono, fontSize: 8, letterSpacing: "0.04em" }}>MORE</span>
          </button>
        </nav>

        <style>{`
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // TABLET LAYOUT (640px – 1023px) — icon-only sidebar
  // ════════════════════════════════════════════════════════════
  if (isTablet) {
    return (
      <div style={{
        display: "flex", minHeight: "100vh",
        background: theme.bg, color: theme.text,
        fontFamily: "'Source Serif 4', Georgia, serif",
      }}>

        {/* Icon sidebar */}
        <aside style={{
          width: 56, flexShrink: 0,
          background: theme.bgSecondary,
          borderRight: `0.5px solid ${theme.border}`,
          display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0,
          height: "100vh", zIndex: 40,
          overflow: "hidden",
        }}>
          {/* Logo mark */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px 0",
            borderBottom: `0.5px solid ${theme.border}`, minHeight: 56,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, background: "#B0503F",
              display: "flex", alignItems: "center", justifyContent: "center",
              ...mono, fontSize: 12, fontWeight: 500, color: "#fff",
            }}>F</div>
          </div>

          {/* Nav icons */}
          <SidebarNav collapsed={true} />

          {/* User avatar → user menu with sign out */}
          <div style={{
            borderTop: `0.5px solid ${theme.border}`,
            padding: "12px 0",
            display: "flex", justifyContent: "center",
            position: "relative",
          }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "#FAEEDA",
                display: "flex", alignItems: "center", justifyContent: "center",
                ...mono, fontSize: 11, color: "#854F0B", fontWeight: 500,
              }}>
                {user?.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </button>
            {showUserMenu && <UserMenuDropdown position="sidebar" />}
          </div>
        </aside>

        {/* Main */}
        <div style={{
          flex: 1, marginLeft: 56,
          minHeight: "100vh", display: "flex", flexDirection: "column",
        }}>
          {/* Topbar */}
          <header style={{
            height: 50, borderBottom: `0.5px solid ${theme.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", background: theme.bg,
            position: "sticky", top: 0, zIndex: 30,
          }}>
            <span style={{ ...mono, fontSize: 12, letterSpacing: "0.08em", color: theme.text, fontWeight: 500 }}>
              {currentLabel.toUpperCase()}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => router.push("/alerts")} style={{
                background: "none", border: `0.5px solid ${theme.border}`,
                borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                color: theme.textMuted, display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ fontSize: 14 }}>🔔</span>
                {unreadCount > 0 && (
                  <span style={{ ...mono, fontSize: 10, color: theme.danger }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Tablet topbar avatar → user menu with sign out ── */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#FAEEDA",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...mono, fontSize: 11, color: "#854F0B", fontWeight: 500,
                  }}>
                    {user?.full_name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                </button>
                {showUserMenu && <UserMenuDropdown position="topbar" />}
              </div>
            </div>
          </header>

          <main style={{ flex: 1, padding: "16px", overflowY: "auto" }}>{children}</main>

          <footer style={{ padding: "10px 16px", borderTop: `0.5px solid ${theme.border}` }}>
            <p style={{ ...mono, fontSize: 10, color: theme.textFaint, margin: 0, textAlign: "center" }}>
              Educational research only. Not financial advice.
            </p>
          </footer>
        </div>

        <style>{`
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT (≥ 1024px) — original sidebar behaviour
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: theme.bg, color: theme.text,
      fontFamily: "'Source Serif 4', Georgia, serif",
    }}>

      {/* Sidebar */}
      <aside style={{
        width: sideW, flexShrink: 0,
        background: theme.bgSecondary,
        borderRight: `0.5px solid ${theme.border}`,
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 40,
        transition: "width 0.2s ease", overflow: "hidden",
      }}>
        {/* Logo / collapse toggle */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: sidebarCollapsed ? "center" : "space-between",
          padding: sidebarCollapsed ? "18px 0" : "18px 16px",
          borderBottom: `0.5px solid ${theme.border}`, minHeight: 56,
        }}>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, background: "#B0503F",
                display: "flex", alignItems: "center", justifyContent: "center",
                ...mono, fontSize: 13, fontWeight: 500, color: "#fff", flexShrink: 0,
              }}>F</div>
              <div>
                <div style={{ ...mono, fontSize: 13, fontWeight: 500, color: theme.text }}>FinSight</div>
                <div style={{ ...mono, fontSize: 9, color: theme.textFaint, letterSpacing: "0.06em" }}>India Markets</div>
              </div>
            </div>
          )}
          <button onClick={toggleSidebar} aria-label="Toggle sidebar" style={{
            background: "none", border: "none", color: theme.textMuted,
            cursor: "pointer", fontSize: 14, padding: "4px 6px",
            borderRadius: 4, lineHeight: 1,
          }}>
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        <SidebarNav collapsed={sidebarCollapsed} />

        {/* User menu */}
        <div style={{
          borderTop: `0.5px solid ${theme.border}`,
          padding: sidebarCollapsed ? "12px 0" : "12px 14px",
          position: "relative",
        }}>
          <button onClick={() => setShowUserMenu(v => !v)} style={{
            display: "flex", alignItems: "center",
            gap: sidebarCollapsed ? 0 : 9,
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
            width: "100%", background: "none", border: "none",
            cursor: "pointer", padding: 0,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: "#FAEEDA",
              display: "flex", alignItems: "center", justifyContent: "center",
              ...mono, fontSize: 11, color: "#854F0B", fontWeight: 500,
            }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "U"}
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 12, fontWeight: 500, color: theme.text, margin: 0,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {user?.full_name ?? "Investor"}
                </p>
                <p style={{ ...mono, fontSize: 10, color: theme.textFaint, margin: 0 }}>
                  {planLabel[plan] ?? "FREE"} plan
                </p>
              </div>
            )}
          </button>
          {showUserMenu && (
            <UserMenuDropdown position="sidebar" />
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{
        flex: 1, marginLeft: sideW,
        transition: "margin-left 0.2s ease",
        minHeight: "100vh", display: "flex", flexDirection: "column",
      }}>
        <header style={{
          height: 50, borderBottom: `0.5px solid ${theme.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", background: theme.bg,
          position: "sticky", top: 0, zIndex: 30,
        }}>
          <span style={{ ...mono, fontSize: 12, letterSpacing: "0.08em", color: theme.text, fontWeight: 500 }}>
            {currentLabel}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => router.push("/alerts")} style={{
              background: "none", border: `0.5px solid ${theme.border}`,
              borderRadius: 6, padding: "6px 9px", cursor: "pointer",
              color: theme.textMuted, display: "flex", alignItems: "center", gap: 5,
              ...mono, fontSize: 12,
            }}>
              <span style={{ fontSize: 14 }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{ ...mono, fontSize: 10, color: theme.danger }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Link href="/settings" style={{ textDecoration: "none" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "#FAEEDA",
                display: "flex", alignItems: "center", justifyContent: "center",
                ...mono, fontSize: 11, color: "#854F0B", fontWeight: 500, cursor: "pointer",
              }}>
                {user?.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: "20px", overflowY: "auto" }}>{children}</main>

        <footer style={{ padding: "12px 20px", borderTop: `0.5px solid ${theme.border}` }}>
          <p style={{ ...mono, fontSize: 10, color: theme.textFaint, margin: 0, textAlign: "center" }}>
            Educational research only. Not financial advice.
          </p>
        </footer>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
