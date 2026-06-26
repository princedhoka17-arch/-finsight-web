"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b"
          : ""
      }`}
      style={{
        background: scrolled ? "rgba(8,11,16,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderColor: "var(--surface-border)",
      }}
    >
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2 shrink-0">
          <span
            className="font-serif italic text-xl"
            style={{ color: "var(--brand-gold)" }}
          >
            FinSight
          </span>
          <span
            className="text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-full hidden sm:inline-flex"
            style={{
              background: "rgba(232,197,71,0.1)",
              color: "var(--brand-gold)",
              border: "1px solid rgba(232,197,71,0.2)",
            }}
          >
            AI
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Pricing", "Companies"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm transition-colors duration-200"
              style={{ color: "var(--ink-secondary)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--ink-primary)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--ink-secondary)")
              }
            >
              {item}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href={ROUTES.LOGIN}>
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href={ROUTES.SIGNUP}>
            <Button variant="primary" size="sm">Start free</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ color: "var(--ink-secondary)" }}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            {menuOpen ? (
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <>
                <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-6 py-4 space-y-3"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--surface-border)",
          }}
        >
          {["Features", "Pricing", "Companies"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="block text-sm py-2"
              style={{ color: "var(--ink-secondary)" }}
            >
              {item}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Link href={ROUTES.LOGIN} onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" size="md" fullWidth>Sign in</Button>
            </Link>
            <Link href={ROUTES.SIGNUP} onClick={() => setMenuOpen(false)}>
              <Button variant="primary" size="md" fullWidth>Start free</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}