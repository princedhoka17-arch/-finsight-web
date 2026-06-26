"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { watchlistApi, reportsApi } from "@/lib/api";
import type { WatchlistItem } from "@/types";

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketQuote {
  price: number | null;
  change_percent: number | null;
  prev_close: number | null;
  currency: string;
}

interface SparklineData {
  timestamps: number[];
  closes: number[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pctColor(pct: number | null | undefined, theme: any): string {
  if (pct == null) return theme.textMuted;
  if (pct > 0) return theme.success;
  if (pct < 0) return theme.danger;
  return theme.textMuted;
}

function pctLabel(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return `${pct > 0 ? "+" : ""}${fmt(pct)}%`;
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ closes, color }: { closes: number[]; color: string }) {
  if (closes.length < 2) return null;
  const W = 280, H = 56, pad = 4;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const pts = closes.map((c, i) => {
    const x = pad + (i / (closes.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (c - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${(W - pad).toFixed(1)},${H - pad} L ${pad},${H - pad} Z`;
  const [lx, ly] = pts[pts.length - 1].split(",").map(Number);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={3} fill={color} />
    </svg>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({ closes, color, highlightColor }: { closes: number[]; color: string; highlightColor: string }) {
  if (!closes.length) return null;
  const bars = closes.slice(-7);
  const maxBar = Math.max(...bars) || 1;
  const maxIdx = bars.indexOf(Math.max(...bars));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
      {bars.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(v / maxBar) * 100}%`,
            minHeight: 4,
            borderRadius: "3px 3px 0 0",
            background: i === maxIdx ? highlightColor : color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ w = "100%", h = 13, theme }: { w?: string | number; h?: number; theme: any }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 3,
      background: theme.border, opacity: 0.4,
      animation: "pulse 1.4s ease-in-out infinite",
    }} />
  );
}

// ─── Stock card (mobile table replacement) ────────────────────────────────────

function StockCard({
  item, quote, loadingQuotes, isActive, isRemoving, theme, mono, serif,
  onSelect, onRemove, onToggleUpdates,
}: {
  item: WatchlistItem;
  quote: MarketQuote | undefined;
  loadingQuotes: boolean;
  isActive: boolean;
  isRemoving: boolean;
  theme: any; mono: React.CSSProperties; serif: React.CSSProperties;
  onSelect: () => void;
  onRemove: () => void;
  onToggleUpdates: () => void;
}) {
  const chg = quote?.change_percent ?? null;

  return (
    <div
      onClick={onSelect}
      style={{
        background: isActive ? `${theme.accent}0c` : theme.bgSecondary,
        border: `0.5px solid ${isActive ? theme.accent + "40" : theme.border}`,
        borderRadius: 8, padding: "11px 12px",
        marginBottom: 8, cursor: "pointer",
        opacity: isRemoving ? 0.4 : 1,
        transition: "background 0.1s, border-color 0.1s",
      }}
    >
      {/* Top row: ticker + price + remove */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <span style={{ ...mono, fontSize: 13, fontWeight: 600, color: theme.text }}>
          {item.company.ticker}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ ...mono, fontSize: 13, color: theme.text }}>
            {loadingQuotes ? "…" : quote?.price != null ? `₹${fmt(quote.price)}` : "—"}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            disabled={isRemoving}
            style={{
              background: "none", border: "none",
              color: "#B0503F", cursor: "pointer",
              fontSize: 18, lineHeight: 1, padding: "2px 4px",
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Company name */}
      <p style={{ ...serif, fontSize: 12, color: theme.textMuted, margin: "0 0 8px", lineHeight: 1.4 }}>
        {item.company.name}
      </p>

      {/* Bottom row: change + updates toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          ...mono, fontSize: 11,
          color: loadingQuotes ? theme.textMuted : pctColor(chg, theme),
        }}>
          {loadingQuotes ? "—" : pctLabel(chg)}
        </span>
        <span style={{ ...mono, fontSize: 9, color: theme.textFaint }}>1D</span>
        <span
          onClick={e => { e.stopPropagation(); onToggleUpdates(); }}
          style={{
            ...mono, fontSize: 9, borderRadius: 999,
            padding: "2px 7px", cursor: "pointer", userSelect: "none" as const,
            marginLeft: "auto",
            background: item.daily_updates_enabled ? "#EAF3DE" : theme.bgSecondary,
            color:      item.daily_updates_enabled ? "#3B6D11" : theme.textFaint,
            border: `0.5px solid ${item.daily_updates_enabled ? "#3B6D11" : theme.border}`,
          }}
        >
          Updates {item.daily_updates_enabled ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const { theme } = useThemeStore();
  const width    = useWindowWidth();
  const isMobile = width > 0 && width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [items,          setItems]          = useState<WatchlistItem[]>([]);
  const [quotes,         setQuotes]         = useState<Record<string, MarketQuote>>({});
  const [sparkline,      setSparkline]      = useState<SparklineData | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const [loadingItems,     setLoadingItems]     = useState(true);
  const [loadingQuotes,    setLoadingQuotes]    = useState(false);
  const [loadingSparkline, setLoadingSparkline] = useState(false);

  const [addOpen,    setAddOpen]    = useState(false);
  const [addTicker,  setAddTicker]  = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError,   setAddError]   = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch items ──────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await watchlistApi.getAll();
      const fetched: WatchlistItem[] = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.data ?? [];
      setItems(fetched);
      if (fetched.length > 0 && !selectedTicker) {
        setSelectedTicker(fetched[0].company.ticker);
      }
    } catch {
      // handled via empty state
    } finally {
      setLoadingItems(false);
    }
  }, [selectedTicker]);

  useEffect(() => { fetchItems(); }, []); // eslint-disable-line

  // ── Fetch quotes ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!items.length) return;
    setLoadingQuotes(true);
    const tickers = items.map(i => i.company.ticker).join(",");
    fetch(`/api/market/quote?symbols=${tickers}`)
      .then(r => r.json())
      .then(d => setQuotes(d))
      .catch(() => {})
      .finally(() => setLoadingQuotes(false));
  }, [items]);

  // ── Fetch sparkline ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTicker) return;
    setLoadingSparkline(true);
    setSparkline(null);
    fetch(`/api/market/history?symbol=${selectedTicker}&range=7d`)
      .then(r => r.json())
      .then(d => setSparkline(d))
      .catch(() => {})
      .finally(() => setLoadingSparkline(false));
  }, [selectedTicker]);

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const ticker = addTicker.trim().toUpperCase();
    if (!ticker) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const searchRes = await reportsApi.searchCompanies(ticker, 1, 5);
      const results: Array<{ id: string; ticker: string; name: string }> =
        Array.isArray(searchRes.data) ? searchRes.data : (searchRes.data as any)?.data ?? [];
      const match = results.find(c => c.ticker.toUpperCase() === ticker);
      if (!match) {
        setAddError(`No company found for "${ticker}"`);
        return;
      }
      await watchlistApi.add({ company_id: match.id });
      setAddOpen(false);
      setAddTicker("");
      await fetchItems();
    } catch {
      setAddError("Could not add stock. Try again.");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Remove ───────────────────────────────────────────────────────────────────
  const handleRemove = async (item: WatchlistItem) => {
    setRemovingId(item.id);
    try {
      await watchlistApi.remove(item.company_id);
      const next = items.filter(i => i.id !== item.id);
      setItems(next);
      if (selectedTicker === item.company.ticker) {
        setSelectedTicker(next[0]?.company.ticker ?? null);
      }
    } catch {}
    finally { setRemovingId(null); }
  };

  // ── Toggle daily updates ─────────────────────────────────────────────────────
  const handleToggleUpdates = async (item: WatchlistItem) => {
    try {
      await watchlistApi.toggleDailyUpdates(item.id, !item.daily_updates_enabled);
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, daily_updates_enabled: !i.daily_updates_enabled } : i
      ));
    } catch {}
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedQuote = selectedTicker ? quotes[selectedTicker] : null;
  const sparkColor    = selectedQuote?.change_percent == null
    ? theme.info
    : selectedQuote.change_percent >= 0 ? theme.success : theme.danger;

  const equalPct = items.length > 0 ? 100 / items.length : 0;

  // ── Style helpers ────────────────────────────────────────────────────────────
  const mono: React.CSSProperties  = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const serif: React.CSSProperties = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const card: React.CSSProperties  = {
    background: theme.bgSecondary,
    border: `0.5px solid ${theme.border}`,
    borderRadius: 8, overflow: "hidden",
  };
  const cardHeader: React.CSSProperties = {
    padding: isMobile ? "10px 12px" : "12px 14px",
    borderBottom: `0.5px solid ${theme.border}`,
    display: "flex", alignItems: "center", gap: 8,
  };
  const cardTitle: React.CSSProperties = {
    ...mono, fontSize: isMobile ? 10 : 11, fontWeight: 500,
    letterSpacing: "0.07em", color: theme.text,
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        .wl-row:hover { background: ${theme.border}28 !important; }
        .wl-row.active { background: ${theme.accent}0c !important; }
        .rm-btn { opacity: 0 !important; transition: opacity 0.15s; }
        .wl-row:hover .rm-btn { opacity: 1 !important; }
        .upd-toggle:hover { opacity: 0.8; }
        @keyframes pulse { 0%,100% { opacity:.4 } 50% { opacity:.2 } }
      `}</style>

      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: isMobile ? "16px 14px" : "20px",
        paddingBottom: isMobile ? 86 : 20,
        display: "flex", flexDirection: "column",
        gap: isMobile ? 12 : 14,
      }}>

        {/* ── Breadcrumb / Page title ── */}
        {isMobile ? (
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 20, fontWeight: 600,
            color: theme.text, margin: 0,
          }}>
            Watchlist
          </h1>
        ) : (
          <div style={{ ...mono, fontSize: 10, color: theme.textFaint, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5 }}>
            Home <span>›</span> <span style={{ color: theme.text }}>Watchlist</span>
          </div>
        )}

        {/* ── Top row: Allocation + Price Activity ── */}
        {/* Mobile: stacked; Tablet+: side by side */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 12 : 14,
        }}>

          {/* Portfolio allocation */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={{ fontSize: 14, color: theme.textMuted }}>◫</span>
              <span style={cardTitle}>PORTFOLIO ALLOCATION</span>
            </div>
            <div style={{ padding: isMobile ? "6px 12px" : "8px 14px" }}>
              {loadingItems ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
                  {[1,2,3].map(k => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Skel w={52} h={11} theme={theme} />
                      <Skel w="100%" h={5} theme={theme} />
                      <Skel w={32} h={11} theme={theme} />
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <p style={{ ...mono, fontSize: 11, color: theme.textMuted }}>No stocks in watchlist yet</p>
                </div>
              ) : (
                items.map(item => {
                  const q = quotes[item.company.ticker];
                  const chg = q?.change_percent ?? null;
                  const barColor = chg == null ? "#B0503F" : chg >= 0 ? "#3C7A5F" : "#C18A2E";
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: isMobile ? "8px 0" : "9px 0",
                        borderBottom: `0.5px solid ${theme.border}`,
                      }}
                    >
                      <span style={{ ...mono, fontSize: isMobile ? 11 : 12, fontWeight: 500, color: theme.text, width: 56, flexShrink: 0 }}>
                        {item.company.ticker}
                      </span>
                      <div style={{ flex: 1, height: 6, background: theme.border, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${equalPct}%`, background: barColor, borderRadius: 3 }} />
                      </div>
                      <span style={{
                        ...mono, fontSize: isMobile ? 10 : 11,
                        color: chg == null ? theme.textMuted : chg >= 0 ? "#3B6D11" : "#993C1D",
                        width: 44, textAlign: "right", flexShrink: 0,
                      }}>
                        {loadingQuotes ? "…" : pctLabel(chg)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Price activity — on mobile, only show if a ticker is selected */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={{ fontSize: 14, color: theme.textMuted }}>↗</span>
              <span style={cardTitle}>PRICE ACTIVITY (7D)</span>
              {selectedTicker && (
                <span style={{
                  ...mono, fontSize: 9, marginLeft: "auto",
                  background: `${sparkColor}18`, color: sparkColor,
                  border: `0.5px solid ${sparkColor}40`,
                  borderRadius: 999, padding: "2px 8px",
                }}>
                  {selectedTicker}
                </span>
              )}
            </div>
            <div style={{ padding: isMobile ? "10px 12px" : "12px 14px" }}>
              {!selectedTicker ? (
                <p style={{ ...mono, fontSize: 11, color: theme.textMuted }}>
                  {isMobile ? "Tap a stock below to view chart" : "Select a stock below"}
                </p>
              ) : loadingSparkline ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
                  {[55,80,60,45,90,70,100].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, height: `${h * 0.44}px`, borderRadius: "3px 3px 0 0",
                      background: theme.border, opacity: 0.3,
                      animation: "pulse 1.4s ease-in-out infinite",
                    }} />
                  ))}
                </div>
              ) : sparkline && sparkline.closes.length > 1 ? (
                <>
                  <MiniBarChart
                    closes={sparkline.closes}
                    color={`${sparkColor}40`}
                    highlightColor={sparkColor}
                  />
                  <div style={{ ...mono, fontSize: 10, color: theme.textFaint, marginTop: 6 }}>
                    {sparkline.timestamps.length > 0
                      ? `${new Date(sparkline.timestamps[0] * 1000).toLocaleDateString("en-IN", { weekday: "short" })} → ${new Date(sparkline.timestamps[sparkline.timestamps.length - 1] * 1000).toLocaleDateString("en-IN", { weekday: "short" })} · ${selectedTicker} daily range`
                      : `7-day range · ${selectedTicker}`}
                  </div>
                </>
              ) : (
                <>
                  <MiniBarChart
                    closes={[55, 80, 60, 45, 90, 70, 100]}
                    color={`${theme.danger}30`}
                    highlightColor={theme.danger}
                  />
                  <div style={{ ...mono, fontSize: 10, color: theme.textFaint, marginTop: 6 }}>
                    No chart data available
                  </div>
                </>
              )}

              {selectedQuote && !loadingSparkline && (
                <div style={{
                  display: "flex",
                  gap: isMobile ? 14 : 20,
                  marginTop: 12, paddingTop: 10,
                  borderTop: `0.5px solid ${theme.border}`,
                  flexWrap: isMobile ? "wrap" : "nowrap",
                }}>
                  {[
                    { label: "Price", value: selectedQuote.price != null ? `₹${fmt(selectedQuote.price)}` : "—" },
                    { label: "1D Chg", value: pctLabel(selectedQuote.change_percent), colored: true },
                    { label: "Prev Close", value: selectedQuote.prev_close != null ? `₹${fmt(selectedQuote.prev_close)}` : "—" },
                  ].map(({ label, value, colored }) => (
                    <div key={label}>
                      <p style={{ ...mono, fontSize: 9, color: theme.textFaint, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 3px" }}>{label}</p>
                      <p style={{ ...mono, fontSize: isMobile ? 13 : 14, margin: 0, color: colored ? pctColor(selectedQuote.change_percent, theme) : theme.text }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── All stocks ── */}
        <div style={card}>
          <div style={cardHeader}>
            <span style={{ fontSize: 14, color: theme.textMuted }}>☰</span>
            <span style={cardTitle}>ALL STOCKS</span>
            <button
              onClick={() => { setAddOpen(v => !v); setTimeout(() => addInputRef.current?.focus(), 50); }}
              style={{
                marginLeft: "auto", background: "none",
                border: `0.5px solid ${theme.border}`,
                borderRadius: 6,
                padding: isMobile ? "5px 10px" : "4px 10px",
                ...mono, fontSize: isMobile ? 9 : 10, color: theme.textMuted,
                cursor: "pointer",
              }}
            >
              + Add stock
            </button>
          </div>

          {/* Add stock panel */}
          {addOpen && (
            <div style={{
              padding: isMobile ? "10px 12px" : "12px 14px",
              borderBottom: `0.5px solid ${theme.border}`,
              background: theme.bg,
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ display: "flex", gap: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <input
                  ref={addInputRef}
                  value={addTicker}
                  onChange={e => setAddTicker(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  placeholder="NSE ticker — e.g. RELIANCE, TCS"
                  style={{
                    ...mono, fontSize: isMobile ? 11 : 12,
                    flex: 1, minWidth: 0,
                    padding: "7px 10px",
                    background: theme.bgSecondary,
                    border: `0.5px solid ${theme.border}`,
                    borderRadius: 6, color: theme.text, outline: "none",
                    // Full width on mobile when wrapped
                    width: isMobile ? "100%" : undefined,
                  }}
                />
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={handleAdd}
                    disabled={addLoading || !addTicker.trim()}
                    style={{
                      ...mono, fontSize: 10, padding: "7px 16px",
                      background: "#B0503F", color: "#fff", border: "none",
                      borderRadius: 6, cursor: addLoading ? "not-allowed" : "pointer",
                      opacity: addLoading ? 0.6 : 1, letterSpacing: "0.06em",
                    }}
                  >
                    {addLoading ? "ADDING…" : "ADD"}
                  </button>
                  <button
                    onClick={() => { setAddOpen(false); setAddTicker(""); setAddError(null); }}
                    style={{
                      ...mono, fontSize: 10, padding: "7px 12px",
                      background: "none", color: theme.textMuted,
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: 6, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {addError && (
                <p style={{ ...mono, fontSize: 10, color: "#993C1D", margin: 0 }}>{addError}</p>
              )}
            </div>
          )}

          {/* ── Mobile: card list ── */}
          {isMobile ? (
            <div style={{ padding: "8px 12px" }}>
              {loadingItems ? (
                [1,2,3,4].map(k => (
                  <div key={k} style={{
                    background: theme.bgSecondary,
                    border: `0.5px solid ${theme.border}`,
                    borderRadius: 8, padding: "11px 12px",
                    marginBottom: 8,
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Skel w={52} h={13} theme={theme} />
                      <Skel w={64} h={13} theme={theme} />
                    </div>
                    <Skel w="70%" h={11} theme={theme} />
                    <Skel w={40} h={11} theme={theme} />
                  </div>
                ))
              ) : items.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                  <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: 0 }}>
                    Your watchlist is empty — add a stock above
                  </p>
                </div>
              ) : (
                items.map(item => (
                  <StockCard
                    key={item.id}
                    item={item}
                    quote={quotes[item.company.ticker]}
                    loadingQuotes={loadingQuotes}
                    isActive={selectedTicker === item.company.ticker}
                    isRemoving={removingId === item.id}
                    theme={theme} mono={mono} serif={serif}
                    onSelect={() => setSelectedTicker(item.company.ticker)}
                    onRemove={() => handleRemove(item)}
                    onToggleUpdates={() => handleToggleUpdates(item)}
                  />
                ))
              )}
              {!loadingItems && items.length > 0 && (
                <p style={{ ...mono, fontSize: 9, color: theme.textFaint, marginTop: 4, letterSpacing: "0.05em" }}>
                  Prices via Yahoo Finance · 60s cache · tap row to view 7d chart
                </p>
              )}
            </div>
          ) : (
            /* ── Tablet / Desktop: table ── */
            <>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 80px 60px 64px 28px",
                padding: "6px 14px",
                borderBottom: `0.5px solid ${theme.border}`,
              }}>
                {["Ticker", "Company", "Price", "1D chg", "Updates", ""].map((h, i) => (
                  <span key={h + i} style={{
                    ...mono, fontSize: 10, color: theme.textFaint,
                    textAlign: i >= 2 && i <= 3 ? "right" : "left",
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              <div style={{ padding: "4px 14px" }}>
                {loadingItems ? (
                  [1,2,3,4].map(k => (
                    <div key={k} style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 80px 60px 64px 28px",
                      alignItems: "center", gap: 0,
                      padding: "11px 0",
                      borderBottom: `0.5px solid ${theme.border}`,
                    }}>
                      <Skel w={44} h={11} theme={theme} />
                      <Skel w={120} h={11} theme={theme} />
                      <Skel w={56} h={11} theme={theme} />
                      <Skel w={44} h={11} theme={theme} />
                      <Skel w={36} h={16} theme={theme} />
                      <div />
                    </div>
                  ))
                ) : items.length === 0 ? (
                  <div style={{ padding: "32px 0", textAlign: "center" }}>
                    <p style={{ ...mono, fontSize: 11, color: theme.textMuted, margin: 0 }}>
                      Your watchlist is empty — add a stock above
                    </p>
                  </div>
                ) : (
                  items.map(item => {
                    const q          = quotes[item.company.ticker];
                    const isActive   = selectedTicker === item.company.ticker;
                    const isRemoving = removingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`wl-row${isActive ? " active" : ""}`}
                        onClick={() => setSelectedTicker(item.company.ticker)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "60px 1fr 80px 60px 64px 28px",
                          alignItems: "center", gap: 0,
                          padding: "10px 0",
                          borderBottom: `0.5px solid ${theme.border}`,
                          cursor: "pointer", transition: "background 0.1s",
                          opacity: isRemoving ? 0.4 : 1,
                        }}
                      >
                        <span style={{ ...mono, fontSize: 12, fontWeight: 500, color: theme.text }}>
                          {item.company.ticker}
                        </span>
                        <span style={{ ...serif, fontSize: 12, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                          {item.company.name}
                        </span>
                        <span style={{ ...mono, fontSize: 12, color: theme.text, textAlign: "right", paddingRight: 12 }}>
                          {loadingQuotes ? "…" : q?.price != null ? `₹${fmt(q.price)}` : "—"}
                        </span>
                        <span style={{
                          ...mono, fontSize: 11,
                          color: loadingQuotes ? theme.textMuted : pctColor(q?.change_percent, theme),
                          textAlign: "right", paddingRight: 12,
                        }}>
                          {loadingQuotes ? "…" : pctLabel(q?.change_percent)}
                        </span>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span
                            className="upd-toggle"
                            onClick={async e => {
                              e.stopPropagation();
                              await handleToggleUpdates(item);
                            }}
                            style={{
                              ...mono, fontSize: 9, borderRadius: 999,
                              padding: "2px 7px", cursor: "pointer", userSelect: "none",
                              background: item.daily_updates_enabled ? "#EAF3DE" : theme.bgSecondary,
                              color:      item.daily_updates_enabled ? "#3B6D11" : theme.textFaint,
                              border: `0.5px solid ${item.daily_updates_enabled ? "#3B6D11" : theme.border}`,
                            }}
                          >
                            {item.daily_updates_enabled ? "ON" : "OFF"}
                          </span>
                        </div>
                        <button
                          className="rm-btn"
                          onClick={e => { e.stopPropagation(); handleRemove(item); }}
                          disabled={isRemoving}
                          style={{
                            background: "none", border: "none",
                            color: "#B0503F", cursor: "pointer",
                            fontSize: 16, lineHeight: 1, padding: "2px 4px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {!loadingItems && items.length > 0 && (
                <div style={{ padding: "8px 14px" }}>
                  <span style={{ ...mono, fontSize: 9, color: theme.textFaint, letterSpacing: "0.05em" }}>
                    Prices via Yahoo Finance · 60s cache · click row to view 7d chart
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}