"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useThemeStore } from "@/store/useThemeStore";

interface Company {
  id: string;
  name: string;
  ticker: string;
  exchange: "BSE" | "NSE";
  sector: string;
  logo_url?: string;
  market_cap?: number;
  is_platform_pick?: boolean;
}

interface CompanyPickerProps {
  /** Max companies user can select */
  maxSelections?: number;
  selectedIds?: string[];
  onSelectionChange?: (companies: Company[]) => void;
  /** If true, shows platform-recommended badge */
  showPlatformPicks?: boolean;
  placeholder?: string;
}

const SECTORS = [
  "All", "Banking", "IT", "FMCG", "Auto", "Pharma",
  "Energy", "Infra", "Telecom", "Metals", "Realty",
];

export default function CompanyPicker({
  maxSelections = 4,
  selectedIds = [],
  onSelectionChange,
  showPlatformPicks = true,
  placeholder = "Search company or ticker...",
}: CompanyPickerProps) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All");
  const [results, setResults] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const searchCompanies = useCallback(async (q: string, sec: string) => {
    if (q.length < 1 && sec === "All") {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      // TODO: FastAPI — GET /companies?query={q}&sector={sec}&limit=10
      // Returns: Company[]
      const params = new URLSearchParams();
      if (q) params.set("query", q);
      if (sec !== "All") params.set("sector", sec);
      params.set("limit", "10");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies?${params.toString()}`,
        {
          headers: {
            // TODO: Supabase — attach JWT
            // Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.companies ?? []);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!mounted) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => searchCompanies(query, sector), 300);
    setDebounceTimer(t);
    return () => clearTimeout(t);
  }, [query, sector, mounted]);

  const toggleCompany = (company: Company) => {
    const isSelected = selected.some((c) => c.id === company.id);
    let updated: Company[];
    if (isSelected) {
      updated = selected.filter((c) => c.id !== company.id);
    } else {
      if (selected.length >= maxSelections) return;
      updated = [...selected, company];
    }
    setSelected(updated);
    if (onSelectionChange) onSelectionChange(updated);
  };

  const removeSelected = (id: string) => {
    const updated = selected.filter((c) => c.id !== id);
    setSelected(updated);
    if (onSelectionChange) onSelectionChange(updated);
  };

  if (!mounted) return null;

  const isAtMax = selected.length >= maxSelections;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {selected.map((company) => (
            <div
              key={company.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px 6px 12px",
                background: `${theme.accent}18`,
                border: `1px solid ${theme.accent}50`,
                borderRadius: "6px",
                fontFamily: "Courier New, monospace",
                fontSize: "12px",
                color: theme.accent,
              }}
            >
              <span style={{ fontWeight: 600 }}>{company.ticker}</span>
              <span style={{ color: theme.textMuted, fontSize: "11px" }}>
                {company.name.length > 18
                  ? company.name.slice(0, 18) + "…"
                  : company.name}
              </span>
              <button
                onClick={() => removeSelected(company.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.textMuted,
                  cursor: "pointer",
                  padding: "0 2px",
                  fontSize: "14px",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
          <div
            style={{
              padding: "6px 10px",
              fontFamily: "Courier New, monospace",
              fontSize: "11px",
              color: isAtMax ? theme.accent : theme.textFaint,
              alignSelf: "center",
            }}
          >
            {selected.length}/{maxSelections} selected
          </div>
        </div>
      )}

      {/* Search input */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={isAtMax ? `Max ${maxSelections} companies selected` : placeholder}
          disabled={isAtMax}
          style={{
            width: "100%",
            padding: "12px 40px 12px 16px",
            background: theme.bgSecondary,
            border: `1px solid ${focused ? theme.accent : theme.border}`,
            borderRadius: "8px",
            color: isAtMax ? theme.textFaint : theme.text,
            fontFamily: "Georgia, serif",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
            cursor: isAtMax ? "not-allowed" : "text",
          }}
        />
        {/* Search icon / spinner */}
        <div
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: theme.textFaint,
            fontSize: "16px",
            pointerEvents: "none",
          }}
        >
          {loading ? (
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                border: `2px solid ${theme.border}`,
                borderTopColor: theme.accent,
                borderRadius: "50%",
                animation: "cp-spin 0.7s linear infinite",
              }}
            />
          ) : (
            "⌕"
          )}
        </div>
      </div>

      {/* Sector filter pills */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
        }}
      >
        {SECTORS.map((s) => (
          <button
            key={s}
            onClick={() => setSector(s)}
            style={{
              padding: "4px 12px",
              background: sector === s ? theme.accent : theme.bgSecondary,
              color: sector === s ? theme.accentText : theme.textMuted,
              border: `1px solid ${sector === s ? theme.accent : theme.border}`,
              borderRadius: "4px",
              fontFamily: "Courier New, monospace",
              fontSize: "11px",
              letterSpacing: "0.04em",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Results dropdown */}
      {focused && results.length > 0 && (
        <div
          style={{
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {results.map((company, i) => {
            const isSelected = selected.some((c) => c.id === company.id);
            const isDisabled = !isSelected && isAtMax;

            return (
              <div
                key={company.id}
                onClick={() => !isDisabled && toggleCompany(company)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom:
                    i < results.length - 1
                      ? `1px solid ${theme.border}`
                      : "none",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.4 : 1,
                  background: isSelected ? `${theme.accent}10` : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled && !isSelected)
                    e.currentTarget.style.background = `${theme.border}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected
                    ? `${theme.accent}10`
                    : "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Logo placeholder */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: `${theme.accent}20`,
                      border: `1px solid ${theme.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Courier New, monospace",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: theme.accent,
                      flexShrink: 0,
                    }}
                  >
                    {company.ticker.slice(0, 3)}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "14px",
                          color: theme.text,
                          fontWeight: 500,
                        }}
                      >
                        {company.name}
                      </span>
                      {showPlatformPicks && company.is_platform_pick && (
                        <span
                          style={{
                            fontFamily: "Courier New, monospace",
                            fontSize: "10px",
                            color: theme.accent,
                            background: `${theme.accent}18`,
                            border: `1px solid ${theme.accent}40`,
                            padding: "1px 6px",
                            borderRadius: "3px",
                            letterSpacing: "0.05em",
                          }}
                        >
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                      <span
                        style={{
                          fontFamily: "Courier New, monospace",
                          fontSize: "11px",
                          color: theme.accent,
                        }}
                      >
                        {company.ticker}
                      </span>
                      <span
                        style={{
                          fontFamily: "Courier New, monospace",
                          fontSize: "11px",
                          color: theme.textFaint,
                        }}
                      >
                        {company.exchange} · {company.sector}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Select indicator */}
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: `1.5px solid ${isSelected ? theme.accent : theme.border}`,
                    background: isSelected ? theme.accent : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && (
                    <span
                      style={{
                        color: theme.accentText,
                        fontSize: "11px",
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {focused && !loading && query.length > 1 && results.length === 0 && (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: "10px",
            fontFamily: "Georgia, serif",
            fontSize: "14px",
            color: theme.textMuted,
          }}
        >
          No companies found for &ldquo;{query}&rdquo;
        </div>
      )}

      <style>{`@keyframes cp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}