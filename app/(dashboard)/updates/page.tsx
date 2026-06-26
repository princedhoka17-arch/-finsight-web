"use client";

import { useState, useEffect, useRef } from "react";

import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { DailyUpdate } from "@/types";

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

type SentimentFilter = "All" | "Positive" | "Neutral" | "Cautious" | "Negative";

interface SlotCompany {
  id: string;
  name: string;
  ticker: string;
  enabled: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  ticker: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSentimentColor(sentiment: string, theme: any): string {
  if (sentiment === "Positive") return theme.success;
  if (sentiment === "Negative") return theme.danger;
  if (sentiment === "Cautious") return theme.info;
  return theme.textMuted;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function renderHighlightedContent(content: string, keyPhrases: string[], theme: any) {
  if (!keyPhrases || keyPhrases.length === 0) return <>{content}</>;
  const sorted  = [...keyPhrases].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");
  const parts   = content.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        keyPhrases.includes(part) ? (
          <span key={i} style={{
            background: `${theme.accent2}22`, color: theme.accent2,
            padding: "0 4px", borderRadius: 3, fontWeight: 500,
          }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const MAX_FREE_SLOTS = 3;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfirmModal({
  company, slotIndex, onConfirm, onCancel, theme,
}: {
  company: SearchResult;
  slotIndex: number;
  onConfirm: () => void;
  onCancel: () => void;
  theme: any;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const ordinal = ["first", "second", "third"][slotIndex] ?? `#${slotIndex + 1}`;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{
        background: theme.bg,
        border: `0.5px solid ${theme.border}`,
        borderRadius: 12, padding: "28px 28px 24px",
        maxWidth: 420, width: "100%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "#FAECE7", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22, marginBottom: 16,
        }}>📰</div>
        <h2 style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: 17, fontWeight: 600, color: theme.text, margin: "0 0 8px",
        }}>
          Add {company.name} as your {ordinal} daily update company?
        </h2>
        <p style={{ ...mono, fontSize: 11, color: theme.textMuted, lineHeight: 1.6, margin: "0 0 24px" }}>
          You'll receive AI-generated morning briefings for{" "}
          <span style={{ color: theme.text, fontWeight: 500 }}>{company.ticker}</span>{" "}
          every trading day. This will use one of your {MAX_FREE_SLOTS} free slots.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px 0",
            background: "#B0503F", color: "#fff",
            border: "none", borderRadius: 8,
            ...mono, fontSize: 11, letterSpacing: "0.06em", cursor: "pointer",
          }}>
            YES, ENABLE UPDATES
          </button>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0",
            background: "transparent", color: theme.textMuted,
            border: `0.5px solid ${theme.border}`, borderRadius: 8,
            ...mono, fontSize: 11, letterSpacing: "0.06em", cursor: "pointer",
          }}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoveModal({
  company, onConfirm, onCancel, theme,
}: {
  company: SlotCompany;
  onConfirm: () => void;
  onCancel: () => void;
  theme: any;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{
        background: theme.bg,
        border: `0.5px solid ${theme.border}`,
        borderRadius: 12, padding: "28px 28px 24px",
        maxWidth: 400, width: "100%",
      }}>
        <h2 style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: 17, fontWeight: 600, color: theme.text, margin: "0 0 8px",
        }}>
          Disable updates for {company.name}?
        </h2>
        <p style={{ ...mono, fontSize: 11, color: theme.textMuted, lineHeight: 1.6, margin: "0 0 24px" }}>
          You can re-enable it any time. This frees up a slot for another company.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px 0",
            background: theme.danger ?? "#B0503F", color: "#fff",
            border: "none", borderRadius: 8,
            ...mono, fontSize: 11, letterSpacing: "0.06em", cursor: "pointer",
          }}>
            DISABLE
          </button>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0",
            background: "transparent", color: theme.textMuted,
            border: `0.5px solid ${theme.border}`, borderRadius: 8,
            ...mono, fontSize: 11, letterSpacing: "0.06em", cursor: "pointer",
          }}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Slot card ────────────────────────────────────────────────────────────────

function SlotCard({
  index, slot, onSearch, onRemove, onToggle, theme, isMobile,
}: {
  index: number;
  slot: SlotCompany | null;
  onSearch: (index: number) => void;
  onRemove: (index: number) => void;
  onToggle: (index: number) => void;
  theme: any;
  isMobile: boolean;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const label = ["First", "Second", "Third"][index] ?? `Slot ${index + 1}`;

  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 10,
      padding: isMobile ? "12px 12px" : "14px 16px",
      display: "flex", alignItems: "center", gap: isMobile ? 10 : 12,
    }}>
      {/* Slot number pill */}
      <div style={{
        ...mono, fontSize: 11, fontWeight: 500,
        width: 26, height: 26, borderRadius: "50%",
        background: slot ? "#B0503F" : theme.border,
        color: slot ? "#fff" : theme.textFaint,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {index + 1}
      </div>

      {slot ? (
        <>
          {/* Company info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...mono, fontSize: isMobile ? 11 : 12, fontWeight: 500, color: theme.text, margin: "0 0 2px" }}>
              {slot.ticker}
            </p>
            <p style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: isMobile ? 11 : 12, color: theme.textMuted, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {slot.name}
            </p>
          </div>

          {/* Toggle — label hidden on mobile to save space */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, flexShrink: 0 }}>
            {!isMobile && (
              <span style={{ ...mono, fontSize: 10, color: slot.enabled ? "#3C7A5F" : theme.textFaint }}>
                {slot.enabled ? "ON" : "OFF"}
              </span>
            )}
            <button
              onClick={() => onToggle(index)}
              title={slot.enabled ? "Pause updates" : "Enable updates"}
              style={{
                width: 36, height: 20, borderRadius: 999,
                background: slot.enabled ? "#3C7A5F" : theme.border,
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.2s", padding: 0, flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute",
                width: 14, height: 14, borderRadius: "50%",
                background: "#fff",
                top: 3,
                left: slot.enabled ? 19 : 3,
                transition: "left 0.2s",
              }} />
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(index)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: theme.textFaint, fontSize: 18, padding: "0 2px",
              lineHeight: 1, flexShrink: 0,
            }}
            title="Remove company"
          >
            ×
          </button>
        </>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textFaint, margin: 0 }}>
              {label} company — empty
            </p>
          </div>
          <button
            onClick={() => onSearch(index)}
            style={{
              ...mono, fontSize: isMobile ? 10 : 11, letterSpacing: "0.06em",
              padding: isMobile ? "5px 12px" : "6px 14px",
              background: "transparent",
              border: `0.5px solid ${theme.border}`,
              borderRadius: 8, color: theme.textMuted, cursor: "pointer",
              flexShrink: 0,
            }}
          >
            + ADD
          </button>
        </>
      )}
    </div>
  );
}

// ─── Search panel ─────────────────────────────────────────────────────────────

function SearchPanel({
  onSelect, onClose, theme,
}: {
  onSelect: (company: SearchResult) => void;
  onClose: () => void;
  theme: any;
}) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/companies/search?q=${encodeURIComponent(query)}&limit=8`);
        setResults(res.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, [query]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{
        background: theme.bg,
        border: `0.5px solid ${theme.border}`,
        borderRadius: 12, padding: "20px",
        maxWidth: 460, width: "100%",
        maxHeight: "80vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ ...mono, fontSize: 11, color: theme.text, fontWeight: 500, letterSpacing: "0.07em" }}>
            SEARCH COMPANY
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type company name or ticker…"
          style={{
            width: "100%", padding: "10px 14px",
            background: theme.bgSecondary,
            border: `0.5px solid ${theme.border}`,
            borderRadius: 8, color: theme.text,
            ...mono, fontSize: 12,
            outline: "none", marginBottom: 12,
            boxSizing: "border-box",
          }}
        />
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading && (
            <p style={{ ...mono, fontSize: 11, color: theme.textFaint, textAlign: "center", padding: "16px 0" }}>
              searching…
            </p>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p style={{ ...mono, fontSize: 11, color: theme.textFaint, textAlign: "center", padding: "16px 0" }}>
              No companies found for "{query}"
            </p>
          )}
          {!loading && results.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              style={{
                width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 8,
                background: "transparent", border: "none",
                cursor: "pointer", transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.bgSecondary)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 7,
                background: "#FAECE7",
                display: "flex", alignItems: "center", justifyContent: "center",
                ...mono, fontSize: 10, fontWeight: 700, color: "#993C1D",
                flexShrink: 0,
              }}>
                {r.ticker?.slice(0, 3)}
              </div>
              <div>
                <p style={{ ...mono, fontSize: 12, fontWeight: 500, color: theme.text, margin: "0 0 2px" }}>
                  {r.ticker}
                </p>
                <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 12, color: theme.textMuted, margin: 0 }}>
                  {r.name}
                </p>
              </div>
            </button>
          ))}
          {!loading && query.length < 2 && (
            <p style={{ ...mono, fontSize: 11, color: theme.textFaint, textAlign: "center", padding: "16px 0" }}>
              Type at least 2 characters to search
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Update card ──────────────────────────────────────────────────────────────

function UpdateCard({
  update, theme, mono, isMobile,
}: {
  update: DailyUpdate;
  theme: any;
  mono: React.CSSProperties;
  isMobile: boolean;
}) {
  const sentimentColor = getSentimentColor(update.sentiment, theme);
  const hasMove  = update.change_percent != null;
  const moveIsUp = hasMove && update.change_percent! >= 0;

  return (
    <div style={{
      background: theme.bgSecondary,
      border: `0.5px solid ${theme.border}`,
      borderRadius: 10,
      padding: isMobile ? "14px 14px" : "18px 22px",
    }}>
      {/* Top row: company identity + sentiment badge */}
      <div style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        marginBottom: 10,
        gap: 8,
      }}>
        {/* Left: icon + name/date */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12 }}>
          <div style={{
            width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, borderRadius: 7,
            background: "#FAECE7", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            ...mono, fontSize: isMobile ? 9 : 10, fontWeight: 700, color: "#993C1D",
          }}>
            {update.company?.ticker?.slice(0, 3) ?? "—"}
          </div>
          <div>
            <p style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: isMobile ? 12 : 13, color: theme.text,
              margin: "0 0 2px", fontWeight: 500,
            }}>
              {update.company?.name}
            </p>
            <p style={{ ...mono, fontSize: 9, color: theme.textFaint, margin: 0 }}>
              {formatDate(update.created_at)}
            </p>
          </div>
        </div>

        {/* Right: change % + sentiment pill — stack vertically on mobile */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-end" : "center",
          gap: isMobile ? 4 : 8,
          flexShrink: 0,
        }}>
          {hasMove && (
            <span style={{
              ...mono, fontSize: isMobile ? 10 : 10,
              color: moveIsUp ? "#3B6D11" : "#993C1D",
            }}>
              {moveIsUp ? "+" : ""}{update.change_percent}%
            </span>
          )}
          <span style={{
            ...mono, fontSize: 9,
            color: sentimentColor,
            background: `${sentimentColor}18`,
            border: `0.5px solid ${sentimentColor}33`,
            borderRadius: 999, padding: "2px 8px",
            whiteSpace: "nowrap",
          }}>
            {update.sentiment.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Headline */}
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: isMobile ? 13 : 15, fontWeight: 500,
        color: theme.text, lineHeight: 1.45,
        margin: "0 0 8px",
      }}>
        {update.headline}
      </p>

      {/* Body */}
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: isMobile ? 13 : 14, color: theme.textMuted,
        lineHeight: 1.65, margin: "0 0 14px",
      }}>
        {renderHighlightedContent(update.content, update.key_phrases ?? [], theme)}
      </p>

      {/* Stat boxes — stack on mobile */}
      {(hasMove || update.watch_for) && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : (hasMove && update.watch_for ? "repeat(2,minmax(0,1fr))" : "1fr"),
          gap: isMobile ? 8 : 10,
          marginBottom: 12,
        }}>
          {hasMove && (
            <div style={{ background: `${theme.border}40`, borderRadius: 8, padding: isMobile ? "8px 12px" : "10px 14px" }}>
              <p style={{ ...mono, fontSize: 9, color: theme.textMuted, margin: "0 0 4px" }}>EST. MOVE TODAY</p>
              <p style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: isMobile ? 16 : 18, fontWeight: 500, margin: 0,
                color: moveIsUp ? "#3B6D11" : "#993C1D",
              }}>
                {moveIsUp ? "+" : ""}{update.change_percent}%
              </p>
            </div>
          )}
          {update.watch_for && (
            <div style={{ background: `${theme.border}40`, borderRadius: 8, padding: isMobile ? "8px 12px" : "10px 14px" }}>
              <p style={{ ...mono, fontSize: 9, color: theme.textMuted, margin: "0 0 4px" }}>WATCH FOR</p>
              <p style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: isMobile ? 12 : 13, fontWeight: 500, margin: 0,
                color: theme.text, lineHeight: 1.4,
              }}>
                {update.watch_for}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {update.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {update.tags.map((tag) => (
            <span key={tag} style={{
              ...mono, fontSize: 9,
              color: theme.textMuted, background: "transparent",
              border: `0.5px solid ${theme.border}`,
              borderRadius: 999, padding: "2px 8px",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UpdatesPage() {
  const { theme }                             = useThemeStore();
  const { plan }                              = useAppStore();
  const { loading: authLoading, requireAuth } = useAuth();
  const width    = useWindowWidth();
  const isMobile = width > 0 && width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [mounted,  setMounted]  = useState(false);
  const [updates,  setUpdates]  = useState<DailyUpdate[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<SentimentFilter>("All");

  const [slots, setSlots] = useState<(SlotCompany | null)[]>([null, null, null]);

  const [searchingSlot,  setSearchingSlot]  = useState<number | null>(null);
  const [confirmAdd,     setConfirmAdd]     = useState<{ company: SearchResult; slotIndex: number } | null>(null);
  const [confirmRemove,  setConfirmRemove]  = useState<{ company: SlotCompany; index: number } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    requireAuth();
  }, [mounted, authLoading]);

  useEffect(() => {
    if (!mounted || authLoading) return;
    fetchData();
  }, [mounted, authLoading]);

  async function fetchData() {
    setLoading(true);
    try {
      const [subsRes, updatesRes] = await Promise.allSettled([
        api.get("/watchlist?daily_updates=true"),
        api.get("/watchlist/daily-updates?limit=30"),
      ]);

      if (subsRes.status === "fulfilled") {
        const items = subsRes.value.data ?? [];
        const enabled = items
          .filter((w: any) => w.daily_updates_enabled)
          .slice(0, MAX_FREE_SLOTS)
          .map((w: any): SlotCompany => ({
            id: w.company?.id ?? w.company_id,
            name: w.company?.name ?? "",
            ticker: w.company?.ticker ?? "",
            enabled: true,
          }));
        const newSlots: (SlotCompany | null)[] = [null, null, null];
        enabled.forEach((c: SlotCompany, i: number) => { newSlots[i] = c; });
        setSlots(newSlots);
      }

      if (updatesRes.status === "fulfilled") {
        setUpdates(updatesRes.value.data ?? []);
      }
    } catch {
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchOpen(index: number) { setSearchingSlot(index); }

  function handleSearchSelect(company: SearchResult) {
    if (searchingSlot === null) return;
    setSearchingSlot(null);
    setConfirmAdd({ company, slotIndex: searchingSlot });
  }

  async function handleConfirmAdd() {
    if (!confirmAdd) return;
    const { company, slotIndex } = confirmAdd;
    setConfirmAdd(null);
    try {
      await api.post("/watchlist", { company_id: company.id });
      await api.patch(`/watchlist/${company.id}/daily-updates`, { enabled: true });
    } catch {
      try { await api.patch(`/watchlist/${company.id}/daily-updates`, { enabled: true }); } catch {}
    }
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { ...company, enabled: true };
      return next;
    });
  }

  function handleToggle(index: number) {
    const slot = slots[index];
    if (!slot) return;
    if (slot.enabled) {
      setConfirmRemove({ company: slot, index });
    } else {
      setConfirmAdd({ company: slot, slotIndex: index });
    }
  }

  async function handleConfirmDisable() {
    if (!confirmRemove) return;
    const { company, index } = confirmRemove;
    setConfirmRemove(null);
    try { await api.patch(`/watchlist/${company.id}/daily-updates`, { enabled: false }); } catch {}
    setSlots((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index]!, enabled: false };
      return next;
    });
  }

  function handleRemove(index: number) {
    const slot = slots[index];
    if (!slot) return;
    setConfirmRemove({ company: slot, index });
  }

  async function handleConfirmRemoveSlot() {
    if (!confirmRemove) return;
    const { company, index } = confirmRemove;
    setConfirmRemove(null);
    try { await api.patch(`/watchlist/${company.id}/daily-updates`, { enabled: false }); } catch {}
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  if (!mounted) return null;

  const filledSlots = slots.filter(Boolean).length;
  const isLocked    = plan === "free";

  const filtered = filter === "All"
    ? updates
    : updates.filter((u) => u.sentiment === filter);

  const sentiments: SentimentFilter[] = ["All", "Positive", "Neutral", "Cautious", "Negative"];

  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };

  return (
    <div style={{ color: theme.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: isMobile ? "16px 14px" : "20px",
        paddingBottom: isMobile ? 86 : 20,
      }}>

        {/* ── Breadcrumb / Page title ── */}
        {isMobile ? (
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 20, fontWeight: 600, color: theme.text,
            margin: "0 0 14px",
          }}>
            Daily Updates
          </h1>
        ) : (
          <>
            <div style={{ ...mono, fontSize: 10, color: theme.textFaint, display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
              Home <span>›</span> <span style={{ color: theme.text }}>Daily Updates</span>
            </div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 22, fontWeight: 600, color: theme.text, margin: "0 0 6px",
              }}>
                Daily Updates
              </h1>
              <p style={{ ...mono, fontSize: 11, color: theme.textMuted }}>
                AI-generated morning briefings for up to {MAX_FREE_SLOTS} companies
              </p>
            </div>
          </>
        )}

        {/* ── Company slots section ── */}
        <div style={{
          background: theme.bgSecondary,
          border: `0.5px solid ${theme.border}`,
          borderRadius: 10,
          marginBottom: isMobile ? 14 : 20,
          overflow: "hidden",
        }}>
          {/* Card header */}
          <div style={{
            padding: isMobile ? "10px 12px" : "12px 16px",
            borderBottom: `0.5px solid ${theme.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ ...mono, fontSize: isMobile ? 10 : 11, fontWeight: 500, color: theme.text, letterSpacing: "0.07em" }}>
              YOUR DAILY UPDATE COMPANIES
            </span>
            <span style={{
              ...mono, fontSize: 10, marginLeft: "auto",
              color: filledSlots >= MAX_FREE_SLOTS ? "#B0503F" : theme.textFaint,
            }}>
              {filledSlots}/{MAX_FREE_SLOTS} slots
            </span>
          </div>

          {/* Slot cards */}
          <div style={{ padding: isMobile ? "10px 10px" : "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {slots.map((slot, i) => (
              <SlotCard
                key={i}
                index={i}
                slot={slot}
                onSearch={handleSearchOpen}
                onRemove={handleRemove}
                onToggle={handleToggle}
                theme={theme}
                isMobile={isMobile}
              />
            ))}
          </div>

          {/* Upsell footer */}
          <div style={{
            borderTop: `0.5px solid ${theme.border}`,
            padding: isMobile ? "10px 12px" : "12px 16px",
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 10,
            flexDirection: isMobile ? "column" : "row",
          }}>
            <div>
              <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, margin: "0 0 2px" }}>
                Need more than 3 companies?
              </p>
              <p style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.textFaint, margin: 0 }}>
                Intermediate: ₹39/month · Beginner: ₹79/month per extra company
              </p>
            </div>
            <a
              href="/subscribe"
              style={{
                ...mono, fontSize: isMobile ? 10 : 11, letterSpacing: "0.06em",
                padding: "8px 16px",
                background: "#B0503F", color: "#fff",
                borderRadius: 8, textDecoration: "none",
                whiteSpace: "nowrap", flexShrink: 0,
                // Full width on mobile
                width: isMobile ? "100%" : "auto",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              ADD MORE →
            </a>
          </div>
        </div>

        {/* ── Updates feed ── */}
        {isLocked ? (
          <div style={{
            background: theme.bgSecondary,
            border: `0.5px solid ${theme.border}`,
            borderRadius: 10,
            padding: isMobile ? "36px 20px" : "48px 32px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: isMobile ? 30 : 36, marginBottom: 16 }}>📈</div>
            <h2 style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: isMobile ? 16 : 18, fontWeight: 600,
              color: theme.text, margin: "0 0 10px",
            }}>
              Daily Updates require a paid plan
            </h2>
            <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, lineHeight: 1.7, margin: "0 auto 24px", maxWidth: 420 }}>
              Beginner plan includes daily updates as a ₹79/company/month add-on.
              Intermediate plan includes {MAX_FREE_SLOTS} companies free.
            </p>
            <a href="/subscribe" style={{
              background: theme.accent, color: "#fff",
              borderRadius: 6, padding: "10px 24px",
              ...mono, fontSize: isMobile ? 11 : 12, letterSpacing: "0.06em",
              cursor: "pointer", textDecoration: "none", display: "inline-block",
            }}>
              VIEW PLANS →
            </a>
          </div>
        ) : (
          <>
            {/* Date label */}
            <div style={{ ...mono, fontSize: isMobile ? 9 : 10, color: theme.textFaint, marginBottom: isMobile ? 10 : 12, letterSpacing: "0.06em" }}>
              TODAY · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
            </div>

            {/* Sentiment filter — scrollable on mobile */}
            <div style={{
              display: "flex", gap: 8,
              marginBottom: isMobile ? 14 : 20,
              overflowX: isMobile ? "auto" : "visible",
              flexWrap: isMobile ? "nowrap" : "wrap",
              scrollbarWidth: "none",
              msOverflowStyle: "none" as any,
              paddingBottom: isMobile ? 2 : 0,
            }}>
              {sentiments.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    padding: isMobile ? "5px 11px" : "5px 13px",
                    background: filter === s ? `${theme.accent}18` : "transparent",
                    border: `0.5px solid ${filter === s ? theme.accent : theme.border}`,
                    borderRadius: 999,
                    ...mono, fontSize: isMobile ? 9 : 10, letterSpacing: "0.06em",
                    color: filter === s ? theme.accent : theme.textMuted,
                    cursor: "pointer", transition: "all 0.15s",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{
                    height: isMobile ? 100 : 120, borderRadius: 10,
                    background: theme.bgSecondary,
                    border: `0.5px solid ${theme.border}`,
                    opacity: 0.5,
                    animation: "pulse 1.4s ease-in-out infinite",
                  }} />
                ))}
                <style>{`@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:0.25}}`}</style>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                background: theme.bgSecondary,
                border: `0.5px solid ${theme.border}`,
                borderRadius: 10,
                padding: isMobile ? "36px 20px" : "48px 32px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <p style={{ ...mono, fontSize: isMobile ? 10 : 11, color: theme.textMuted, lineHeight: 1.6 }}>
                  {filledSlots === 0
                    ? "Add companies above to start receiving daily updates."
                    : filter === "All"
                    ? "No updates yet today. Check back after market open."
                    : `No ${filter.toLowerCase()} updates today.`}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 12 }}>
                {filtered.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    theme={theme}
                    mono={mono}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <p style={{
          ...mono, fontSize: 10,
          color: theme.textFaint, textAlign: "center",
          letterSpacing: "0.04em", paddingTop: 24, marginTop: 32,
          borderTop: `0.5px solid ${theme.border}`,
        }}>
          Educational research only. Not financial advice.
        </p>
      </div>

      {/* ── Modals ── */}
      {searchingSlot !== null && (
        <SearchPanel
          onSelect={handleSearchSelect}
          onClose={() => setSearchingSlot(null)}
          theme={theme}
        />
      )}
      {confirmAdd && (
        <ConfirmModal
          company={confirmAdd.company}
          slotIndex={confirmAdd.slotIndex}
          onConfirm={handleConfirmAdd}
          onCancel={() => setConfirmAdd(null)}
          theme={theme}
        />
      )}
      {confirmRemove && (
        <RemoveModal
          company={confirmRemove.company}
          onConfirm={slots[confirmRemove.index] === null
            ? handleConfirmDisable
            : handleConfirmRemoveSlot}
          onCancel={() => setConfirmRemove(null)}
          theme={theme}
        />
      )}
    </div>
  );
}