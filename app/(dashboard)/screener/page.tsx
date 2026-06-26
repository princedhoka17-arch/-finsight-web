"use client";

// app/(dashboard)/screener/page.tsx
// Screener page — fully wired to GET /screener/companies + GET /screener/meta
// Filters: sector (from /meta), market cap, sentiment, text search
// Features: pagination, watchlist badge, report count, live price + 1D chg

import { useState, useEffect, useCallback, useRef } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

// ── Responsive hook ───────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────

interface ScreenerRow {
  id:             string;
  ticker:         string;
  name:           string;
  exchange:       string;
  sector:         string | null;
  market_cap:     string;
  market_cap_raw: number | null;
  sentiment:      string | null;
  price:          number | null;
  change_percent: number | null;
  in_watchlist:   boolean;
  report_count:   number;
}

interface ScreenerResponse {
  items:    ScreenerRow[];
  total:    number;
  page:     number;
  per_page: number;
  pages:    number;
}

// ── Constants ─────────────────────────────────────────────────────

const MCAPS      = ["All", "Large cap", "Mid cap", "Small cap"];
const SENTIMENTS = ["All", "Positive", "Neutral", "Cautious", "Negative"];
const PER_PAGE   = 20;

// ── Helpers ───────────────────────────────────────────────────────

function sentimentStyle(s: string | null): { bg: string; color: string } {
  if (s === "Positive") return { bg: "#3C7A5F18", color: "#3C7A5F" };
  if (s === "Negative") return { bg: "#B0503F18", color: "#B0503F" };
  if (s === "Cautious") return { bg: "#C18A2E18", color: "#C18A2E" };
  if (s === "Neutral")  return { bg: "#185FA518", color: "#185FA5" };
  return { bg: "transparent", color: "#888" };
}

function mcapStyle(m: string): { bg: string; color: string } {
  if (m === "Large cap") return { bg: "#534AB718", color: "#534AB7" };
  if (m === "Mid cap")   return { bg: "#185FA518", color: "#185FA5" };
  return { bg: "#88888818", color: "#888" };
}

function formatPrice(p: number | null): string {
  if (p == null) return "—";
  return `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChg(c: number | null): string {
  if (c == null) return "—";
  return `${c > 0 ? "+" : ""}${c.toFixed(2)}%`;
}

// ── FilterSelect ──────────────────────────────────────────────────

function FilterSelect({
  label, value, options, onChange, theme,
}: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; theme: any;
}) {
  return (
    <div>
      <p style={{
        fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
        color: theme.textMuted, textTransform: "uppercase" as const,
        letterSpacing: "0.07em", margin: "0 0 6px",
      }}>
        {label}
      </p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
          width: "100%", padding: "8px 10px",
          background: theme.bg, border: `0.5px solid ${theme.border}`,
          borderRadius: 6, color: theme.text,
          outline: "none", cursor: "pointer",
          appearance: "none" as any,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          paddingRight: 28,
          boxSizing: "border-box" as const,
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── SkeletonRow ───────────────────────────────────────────────────

function SkeletonRow({ theme, isMobile }: { theme: any; isMobile: boolean }) {
  if (isMobile) {
    return (
      <div style={{
        padding: "12px 0",
        borderBottom: `0.5px solid ${theme.border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ height: 12, width: 60, borderRadius: 4, background: theme.border, opacity: 0.5, animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ height: 12, width: 50, borderRadius: 4, background: theme.border, opacity: 0.5, animation: "pulse 1.4s ease-in-out infinite" }} />
        </div>
        <div style={{ height: 11, width: 140, borderRadius: 4, background: theme.border, opacity: 0.4, animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    );
  }
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "90px 1fr 90px 100px 70px 70px",
      gap: 8, padding: "12px 0",
      borderBottom: `0.5px solid ${theme.border}`,
      alignItems: "center",
    }}>
      {[40, 120, 60, 70, 40, 50].map((w, i) => (
        <div key={i} style={{
          height: 12, width: w, borderRadius: 4,
          background: theme.border, opacity: 0.5,
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.07}s`,
        }} />
      ))}
    </div>
  );
}

// ── MobileResultCard ──────────────────────────────────────────────
// On mobile the table becomes a card list

function MobileResultCard({ row, theme }: { row: ScreenerRow; theme: any }) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const ss = sentimentStyle(row.sentiment);
  const ms = mcapStyle(row.market_cap);
  const chgColor = row.change_percent == null
    ? theme.textMuted
    : row.change_percent >= 0 ? "#3C7A5F" : "#B0503F";

  return (
    <div style={{
      padding: "12px 0",
      borderBottom: `0.5px solid ${theme.border}`,
    }}>
      {/* Row 1: ticker + price + change */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: theme.text }}>
            {row.ticker}
          </span>
          {row.in_watchlist && (
            <span title="In your watchlist" style={{ width: 6, height: 6, borderRadius: "50%", background: "#3C7A5F", flexShrink: 0 }} />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ ...mono, fontSize: 12, color: theme.text }}>{formatPrice(row.price)}</span>
          <span style={{ ...mono, fontSize: 11, color: chgColor }}>{formatChg(row.change_percent)}</span>
        </div>
      </div>

      {/* Row 2: company name */}
      <div style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 12, color: theme.textMuted,
        marginBottom: 6,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {row.name}
        {row.report_count > 0 && (
          <span style={{ ...mono, fontSize: 9, color: theme.textFaint, marginLeft: 8 }}>
            {row.report_count} report{row.report_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Row 3: badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          ...mono, fontSize: 9, borderRadius: 999,
          padding: "2px 7px", background: ms.bg, color: ms.color,
        }}>
          {row.market_cap}
        </span>
        {row.sentiment && (
          <span style={{
            ...mono, fontSize: 9, borderRadius: 999,
            padding: "2px 8px", background: ss.bg, color: ss.color,
          }}>
            {row.sentiment}
          </span>
        )}
        {row.sector && (
          <span style={{ ...mono, fontSize: 9, color: theme.textFaint }}>
            {row.sector}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────

function Pagination({
  page, pages, total, perPage, onPage, theme, isMobile,
}: {
  page: number; pages: number; total: number;
  perPage: number; onPage: (p: number) => void; theme: any; isMobile: boolean;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: isMobile ? "space-between" : "space-between",
      padding: "12px 16px", borderTop: `0.5px solid ${theme.border}`,
      flexWrap: "wrap", gap: 8,
    }}>
      <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>
        {from}–{to} of {total}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          style={{
            ...mono, fontSize: 11, padding: "4px 12px",
            background: "transparent",
            border: `0.5px solid ${theme.border}`,
            borderRadius: 6, color: page <= 1 ? theme.textFaint : theme.text,
            cursor: page <= 1 ? "not-allowed" : "pointer",
          }}
        >
          ← Prev
        </button>
        {/* On mobile, only show current / total — no page buttons */}
        {!isMobile && Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          let p = i + 1;
          if (pages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= pages - 2) p = pages - 4 + i;
            else p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              style={{
                ...mono, fontSize: 11, padding: "4px 10px",
                background: p === page ? theme.text : "transparent",
                border: `0.5px solid ${p === page ? theme.text : theme.border}`,
                borderRadius: 6,
                color: p === page ? theme.bg : theme.textMuted,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          );
        })}
        {isMobile && (
          <span style={{ ...mono, fontSize: 11, color: theme.textMuted, padding: "4px 8px" }}>
            {page} / {pages}
          </span>
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          style={{
            ...mono, fontSize: 11, padding: "4px 12px",
            background: "transparent",
            border: `0.5px solid ${theme.border}`,
            borderRadius: 6, color: page >= pages ? theme.textFaint : theme.text,
            cursor: page >= pages ? "not-allowed" : "pointer",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function ScreenerPage() {
  const { theme }                             = useThemeStore();
  const { loading: authLoading, requireAuth } = useAuth();

  const width    = useWindowWidth();
  const isMobile = width > 0 && width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [mounted,   setMounted]   = useState(false);
  const [sectors,   setSectors]   = useState<string[]>([]);
  const [results,   setResults]   = useState<ScreenerRow[]>([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [sector,    setSector]    = useState("All sectors");
  const [mcap,      setMcap]      = useState("All");
  const [sentiment, setSentiment] = useState("All");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    requireAuth();
  }, [mounted, authLoading]);

  useEffect(() => {
    if (!mounted || authLoading) return;
    api.get("/screener/meta")
      .then(res => setSectors(["All sectors", ...(res.data?.sectors ?? [])]))
      .catch(() => setSectors(["All sectors"]));
  }, [mounted, authLoading]);

  const fetchResults = useCallback(async (params: {
    sector: string; mcap: string; sentiment: string;
    search: string; page: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const query: Record<string, string> = {
        page:     String(params.page),
        per_page: String(PER_PAGE),
      };
      if (params.sector    !== "All sectors") query.sector     = params.sector;
      if (params.mcap      !== "All")         query.market_cap = params.mcap;
      if (params.sentiment !== "All")         query.sentiment  = params.sentiment;
      if (params.search.trim())               query.q          = params.search.trim();

      const res = await api.get<ScreenerResponse>("/screener/companies", { params: query });
      setResults(res.data?.items ?? []);
      setTotal  (res.data?.total ?? 0);
      setPages  (res.data?.pages ?? 1);
    } catch {
      setError("Failed to load screener results. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setPage(1);
      fetchResults({ sector, mcap, sentiment, search, page: 1 });
    }, search ? 350 : 0);
  }, [sector, mcap, sentiment, search, mounted, authLoading]);

  useEffect(() => {
    if (!mounted || authLoading || page === 1) return;
    fetchResults({ sector, mcap, sentiment, search, page });
  }, [page]);

  const hasFilters = sector !== "All sectors" || mcap !== "All" || sentiment !== "All" || search.trim() !== "";

  function clearFilters() {
    setSector("All sectors");
    setMcap("All");
    setSentiment("All");
    setSearch("");
    setPage(1);
  }

  if (!mounted) return null;

  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const card: React.CSSProperties = {
    background: theme.bgSecondary,
    border: `0.5px solid ${theme.border}`,
    borderRadius: 10, overflow: "hidden",
  };

  // Desktop table columns (tablet gets a trimmed version)
  const tableColumns = isTablet
    ? "90px 1fr 90px 100px 70px 70px"          // drop sector col on tablet
    : "90px 1fr 90px 100px 110px 80px 80px";    // full desktop

  const tableHeaders = isTablet
    ? ["TICKER", "COMPANY", "MKT CAP", "SENTIMENT", "PRICE", "1D CHG"]
    : ["TICKER", "COMPANY", "SECTOR", "MKT CAP", "SENTIMENT", "PRICE", "1D CHG"];

  return (
    <div style={{
      maxWidth: 1100, margin: "0 auto",
      display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16,
      padding: isMobile ? "16px 14px" : "20px",
      paddingBottom: isMobile ? 88 : 20,
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:0.25}}`}</style>

      {/* Breadcrumb — hidden on mobile */}
      {!isMobile && (
        <div style={{ ...mono, fontSize: 10, color: theme.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
          Home <span>›</span> <span style={{ color: theme.text }}>Screener</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: isMobile ? 20 : 22, fontWeight: 600, color: theme.text, margin: "0 0 4px",
        }}>
          Stock Screener
        </h1>
        {!isMobile && (
          <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: 0 }}>
            Filter by sector, market cap, and sentiment — live from AI daily updates
          </p>
        )}
      </div>

      {/* Filter card */}
      <div style={card}>
        <div style={{
          padding: isMobile ? "10px 14px" : "12px 16px",
          borderBottom: `0.5px solid ${theme.border}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ ...mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: theme.text }}>
            FILTER STOCKS
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{ ...mono, marginLeft: "auto", fontSize: 10, color: "#B0503F", background: "none", border: "none", cursor: "pointer" }}
            >
              clear all ×
            </button>
          )}
        </div>

        {/* Selects: 1-col on mobile, 3-col on tablet/desktop */}
        <div style={{
          padding: isMobile ? "12px 14px" : "16px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
          gap: isMobile ? 10 : 14,
        }}>
          <FilterSelect label="Sector"     value={sector}    options={sectors}    onChange={v => { setSector(v);    setPage(1); }} theme={theme} />
          <FilterSelect label="Market Cap" value={mcap}      options={MCAPS}      onChange={v => { setMcap(v);      setPage(1); }} theme={theme} />
          {/* On mobile, sentiment goes full-width below the 2-col row */}
          <div style={isMobile ? { gridColumn: "1 / -1" } : {}}>
            <FilterSelect label="Sentiment" value={sentiment} options={SENTIMENTS} onChange={v => { setSentiment(v); setPage(1); }} theme={theme} />
          </div>
        </div>

        <div style={{ padding: isMobile ? "0 14px 12px" : "0 16px 16px" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ticker or company name…"
            style={{
              ...mono, fontSize: 12, width: "100%",
              padding: "8px 12px",
              background: theme.bg, border: `0.5px solid ${theme.border}`,
              borderRadius: 6, color: theme.text, outline: "none",
              boxSizing: "border-box" as const,
            }}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          ...mono, fontSize: 11, color: "#B0503F",
          background: "#B0503F12", border: `0.5px solid #B0503F30`,
          borderRadius: 8, padding: "10px 16px",
        }}>
          {error}
        </div>
      )}

      {/* Results card */}
      <div style={card}>
        {/* Card header */}
        <div style={{
          padding: isMobile ? "10px 14px" : "12px 16px",
          borderBottom: `0.5px solid ${theme.border}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ ...mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: theme.text }}>
            RESULTS
          </span>
          <span style={{ ...mono, fontSize: 10, color: theme.textFaint, marginLeft: "auto" }}>
            {loading ? "Loading…" : `${total} stock${total !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── MOBILE: card list ── */}
        {isMobile && (
          <div style={{ padding: "0 14px" }}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} theme={theme} isMobile />)
            ) : results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 14, color: theme.textMuted, margin: "0 0 10px",
                }}>
                  No stocks match your filters.
                </p>
                <button
                  onClick={clearFilters}
                  style={{ ...mono, fontSize: 11, color: "#B0503F", background: "none", border: "none", cursor: "pointer" }}
                >
                  clear filters →
                </button>
              </div>
            ) : (
              results.map(row => <MobileResultCard key={row.id} row={row} theme={theme} />)
            )}
          </div>
        )}

        {/* ── TABLET + DESKTOP: table ── */}
        {!isMobile && (
          <>
            {/* Column headers */}
            <div style={{ padding: "8px 16px", borderBottom: `0.5px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: tableColumns, gap: 8 }}>
                {tableHeaders.map(h => (
                  <span key={h} style={{
                    ...mono, fontSize: 9, color: theme.textFaint,
                    letterSpacing: "0.07em",
                    textAlign: ["PRICE", "1D CHG"].includes(h) ? "right" : "left" as any,
                  }}>
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div style={{ padding: "4px 16px" }}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} theme={theme} isMobile={false} />)
              ) : results.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                  <p style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: 15, color: theme.textMuted, margin: "0 0 12px",
                  }}>
                    No stocks match your filters.
                  </p>
                  <button
                    onClick={clearFilters}
                    style={{ ...mono, fontSize: 11, color: "#B0503F", background: "none", border: "none", cursor: "pointer" }}
                  >
                    clear filters →
                  </button>
                </div>
              ) : (
                results.map(row => {
                  const ss       = sentimentStyle(row.sentiment);
                  const ms       = mcapStyle(row.market_cap);
                  const chgColor = row.change_percent == null
                    ? theme.textMuted
                    : row.change_percent >= 0 ? "#3C7A5F" : "#B0503F";

                  return (
                    <div
                      key={row.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: tableColumns,
                        gap: 8, padding: "11px 0",
                        borderBottom: `0.5px solid ${theme.border}`,
                        alignItems: "center",
                        transition: "background 0.1s",
                        borderRadius: 4,
                        cursor: "default",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${theme.border}22`}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                      {/* Ticker + watchlist dot */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: theme.text }}>
                          {row.ticker}
                        </span>
                        {row.in_watchlist && (
                          <span title="In your watchlist" style={{ width: 6, height: 6, borderRadius: "50%", background: "#3C7A5F", flexShrink: 0 }} />
                        )}
                      </div>

                      {/* Company name + report count */}
                      <div style={{ paddingRight: 12, overflow: "hidden" }}>
                        <span style={{
                          fontFamily: "'Source Serif 4', Georgia, serif",
                          fontSize: 13, color: theme.text,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          display: "block",
                        }}>
                          {row.name}
                        </span>
                        {row.report_count > 0 && (
                          <span style={{ ...mono, fontSize: 9, color: theme.textFaint }}>
                            {row.report_count} report{row.report_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Sector — only on desktop */}
                      {!isTablet && (
                        <span style={{ ...mono, fontSize: 10, color: theme.textMuted }}>
                          {row.sector ?? "—"}
                        </span>
                      )}

                      {/* Market cap badge */}
                      <span>
                        <span style={{
                          ...mono, fontSize: 9, borderRadius: 999,
                          padding: "2px 7px", background: ms.bg, color: ms.color,
                        }}>
                          {row.market_cap}
                        </span>
                      </span>

                      {/* Sentiment badge */}
                      <span>
                        {row.sentiment ? (
                          <span style={{
                            ...mono, fontSize: 9, borderRadius: 999,
                            padding: "2px 8px", background: ss.bg, color: ss.color,
                          }}>
                            {row.sentiment}
                          </span>
                        ) : (
                          <span style={{ ...mono, fontSize: 10, color: theme.textFaint }}>—</span>
                        )}
                      </span>

                      {/* Price */}
                      <span style={{ ...mono, fontSize: 11, color: theme.text, textAlign: "right" as const }}>
                        {formatPrice(row.price)}
                      </span>

                      {/* 1D change */}
                      <span style={{ ...mono, fontSize: 11, color: chgColor, textAlign: "right" as const }}>
                        {formatChg(row.change_percent)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && total > PER_PAGE && (
          <Pagination
            page={page} pages={pages} total={total}
            perPage={PER_PAGE} onPage={setPage} theme={theme}
            isMobile={isMobile}
          />
        )}

        {/* Footer note */}
        {!loading && results.length > 0 && (
          <p style={{
            ...mono, fontSize: 9, color: theme.textFaint,
            padding: isMobile ? "8px 14px" : "8px 16px",
            borderTop: `0.5px solid ${theme.border}`,
          }}>
            {isMobile
              ? "LIVE DATA · PRICES VIA YFINANCE · 🟢 IN WATCHLIST"
              : "LIVE DATA · PRICES VIA YFINANCE · SENTIMENT FROM LATEST AI DAILY UPDATES · 🟢 IN WATCHLIST"}
          </p>
        )}
      </div>
    </div>
  );
}