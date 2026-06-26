"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useThemeStore, type ThemeId } from "@/store/useThemeStore";
import { ROUTES } from "@/lib/constants";

// ─── Page Title Map ───────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/reports":   "Reports",
  "/watchlist": "Watchlist",
  "/subscribe": "Subscription",
  "/request":   "Request a Company",
  "/updates":   "Daily Updates",
  "/admin":     "Admin Panel",
};

function getPageTitle(pathname: string): string {
  for (const [key, label] of Object.entries(PAGE_TITLES)) {
    if (pathname.includes(key)) return label;
  }
  return "FinSight";
}

// ─── Theme Switcher ───────────────────────────────────────────────
const THEME_ORDER: ThemeId[] = ["classic-dark", "dark-white", "ledger-light", "ledger-dark"];

const THEME_SWATCHES: Record<ThemeId, { bg: string; dot: string; label: string }> = {
  "classic-dark": { bg: "#080b10", dot: "#e8c547", label: "Classic" },
  "dark-white":   { bg: "#0e0e0e", dot: "#ffffff", label: "Dark White" },
  "ledger-light": { bg: "#F7F4ED", dot: "#A8703D", label: "Ledger" },
  "ledger-dark":  { bg: "#16140F", dot: "#C9A45E", label: "Ledger Dark" },
};

function ThemeSwitcher() {
  const { themeId, setTheme } = useThemeStore();

  return (
    <div
      className="px-4 py-3 border-b"
      style={{ borderColor: "var(--surface-border)" }}
    >
      <p
        className="text-[10px] font-medium tracking-widest uppercase mb-2"
        style={{ color: "var(--ink-muted)" }}
      >
        Theme
      </p>
      <div className="flex items-center gap-2">
        {THEME_ORDER.map((id) => {
          const swatch = THEME_SWATCHES[id];
          const isActive = themeId === id;
          return (
            <button
              key={id}
              onClick={() => setTheme(id)}
              title={swatch.label}
              aria-label={`Switch to ${swatch.label} theme`}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: swatch.bg,
                border: isActive
                  ? "2px solid var(--brand-gold)"
                  : "2px solid transparent",
                outline: isActive ? "1px solid var(--surface-border)" : "none",
                outlineOffset: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.15s, transform 0.15s",
                transform: isActive ? "scale(1.15)" : "scale(1)",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: swatch.dot,
                  display: "block",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────
export function Topbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const [search,       setSearch]       = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`${ROUTES.REPORTS}?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  }

  const plan = user?.plan ?? "free";

  const planVariant =
    plan === "intermediate" ? "teal"
    : plan === "beginner"   ? "gold"
    : "muted";

  const isAdmin = pathname.includes("/admin");

  return (
    <header
      className="h-16 flex items-center gap-4 px-6 border-b shrink-0 sticky top-0 z-30"
      style={{
        background:  "var(--surface-raised)",
        borderColor: "var(--surface-border)",
      }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1
          className="font-sans font-semibold text-base truncate"
          style={{ color: "var(--ink-primary)" }}
        >
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="hidden md:flex items-center gap-2 flex-1 max-w-xs"
      >
        <div className="relative w-full">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--ink-muted)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies, reports…"
            className="input-base text-sm pl-9 py-2 h-9"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Upgrade button for free users */}
        {plan === "free" && !isAdmin && (
          <Link href={ROUTES.SUBSCRIBE}>
            <Button variant="outline-gold" size="sm">Upgrade</Button>
          </Link>
        )}

        {/* Notification bell */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl relative transition-colors"
          style={{ color: "var(--ink-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-overlay)";
            (e.currentTarget as HTMLElement).style.color = "var(--ink-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--ink-muted)";
          }}
          aria-label="Notifications"
        >
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path
              d="M8.5 1.5A5.5 5.5 0 0 1 14 7c0 2.5.5 4 1.5 5H1.5C2.5 11 3 9.5 3 7a5.5 5.5 0 0 1 5.5-5.5z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 12c0 1.105.895 2 2 2s2-.895 2-2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
            style={{
              background:  "var(--brand-gold)",
              borderColor: "var(--surface-raised)",
            }}
          />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all",
              userMenuOpen ? "bg-[var(--surface-overlay)]" : ""
            )}
            onMouseEnter={(e) => {
              if (!userMenuOpen)
                (e.currentTarget as HTMLElement).style.background = "var(--surface-overlay)";
            }}
            onMouseLeave={(e) => {
              if (!userMenuOpen)
                (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Avatar name={user?.full_name ?? "User"} size="sm" />
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={cn("transition-transform duration-200", userMenuOpen && "rotate-180")}
              style={{ color: "var(--ink-muted)" }}
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl border overflow-hidden z-50 animate-fade-up"
              style={{
                background:  "var(--surface-overlay)",
                borderColor: "var(--surface-border)",
                boxShadow:   "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {/* User info */}
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "var(--surface-border)" }}
              >
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--ink-primary)" }}
                >
                  {user?.full_name}
                </p>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {user?.email}
                </p>
                <div className="mt-1.5">
                  <Badge variant={planVariant} className="text-[9px]">
                    {plan}
                  </Badge>
                </div>
              </div>

              {/* Theme switcher */}
              <ThemeSwitcher />

              {/* Menu items */}
              <div className="py-1">
                {[
                  { label: "Dashboard",    href: ROUTES.DASHBOARD },
                  { label: "Subscription", href: ROUTES.SUBSCRIBE },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm transition-colors"
                    style={{ color: "var(--ink-secondary)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--surface-subtle)";
                      (e.currentTarget as HTMLElement).style.color = "var(--ink-primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--ink-secondary)";
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Sign out */}
              <div
                className="border-t py-1"
                style={{ borderColor: "var(--surface-border)" }}
              >
                <button
                  onClick={() => { logout(); setUserMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-2 text-sm transition-colors"
                  style={{ color: "var(--danger)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}