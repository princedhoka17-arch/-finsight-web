// components/report/SectionBlockRenderer.tsx
// Renders the `blocks` array from ReportSectionOut.content.blocks.
// Each block type maps 1:1 to a visual treatment from the approved mock.
// Uses inline styles only — no Tailwind, no CSS modules, matching the
// rest of the app's styling convention.
//
// Import and use:
//   <SectionBlockRenderer blocks={section.content.blocks} theme={theme} />

import React from "react";
import { Theme } from "@/store/useThemeStore";

// ── Block types — mirror app/schemas/report.py exactly ────────────────────
// Field names must match the API response:
//   change (not delta), level (not severity), speaker (not attribution)

export type MetricDirection = "up" | "down";
export type MetricSentiment = "good" | "bad" | "neutral";
export type RiskLevel       = "low" | "medium" | "high";

export interface MetricItem {
  label:     string;
  value:     string;
  change?:   string;
  direction?: MetricDirection;
  sentiment?: MetricSentiment;
}

export type SectionBlock =
  | { type: "paragraph";  text: string }
  | { type: "heading";    text: string }
  | { type: "summary";    text: string }
  | { type: "metric";     items: MetricItem[] }
  | { type: "risk_flag";  level: RiskLevel; title: string; text: string }
  | { type: "quote";      text: string; speaker?: string }
  | { type: "watch_item"; text: string };

export interface SectionContent {
  blocks: SectionBlock[];
  legacy?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function metricChangeColor(
  direction?: MetricDirection,
  sentiment?: MetricSentiment,
  theme?: Theme,
): string {
  if (!theme || !direction || !sentiment || sentiment === "neutral") {
    return theme?.textMuted ?? "#75705F";
  }
  if (sentiment === "good")  return theme.success;
  if (sentiment === "bad")   return theme.danger;
  return theme.textMuted;
}

function riskColors(level: RiskLevel, theme: Theme) {
  switch (level) {
    case "high":   return { border: theme.danger,  icon: theme.danger,  label: theme.danger  };
    case "medium": return { border: theme.info,    icon: theme.info,    label: theme.info    };
    case "low":    return { border: theme.success, icon: theme.success, label: theme.success };
  }
}

function riskIconBg(level: RiskLevel, theme: Theme): string {
  // Translucent tint of the level color — matches the mock's icon badge
  switch (level) {
    case "high":   return `${theme.danger}22`;
    case "medium": return `${theme.info}22`;
    case "low":    return `${theme.success}22`;
  }
}

// ── Individual block renderers ────────────────────────────────────────────

function ParagraphBlock({ text, theme }: { text: string; theme: Theme }) {
  return (
    <p style={{
      fontSize:   "16px",
      lineHeight: "1.8",
      color:      theme.text,
      margin:     "0 0 16px",
      fontFamily: "'Source Serif 4', Georgia, serif",
    }}>
      {text}
    </p>
  );
}

function HeadingBlock({ text, theme }: { text: string; theme: Theme }) {
  // Sub-heading within a section — smaller than the section-level h3,
  // uses accent2 to distinguish from section titles which use plain text.
  // No mock precedent — designed to sit quietly without competing with
  // the section heading above it.
  return (
    <p style={{
      fontFamily:    "'IBM Plex Mono', monospace",
      fontSize:      "12px",
      fontWeight:    600,
      letterSpacing: ".06em",
      textTransform: "uppercase",
      color:         theme.accent2,
      margin:        "28px 0 10px",
    }}>
      {text}
    </p>
  );
}

function SummaryBlock({ text, theme }: { text: string; theme: Theme }) {
  return (
    <div style={{
      background:   theme.bgSecondary,
      border:       `1px solid ${theme.border}`,
      borderRadius: "2px",
      padding:      "16px 20px",
      margin:       "20px 0",
    }}>
      <div style={{
        fontFamily:  "'IBM Plex Mono', monospace",
        fontSize:    "13px",
        fontWeight:  600,
        fontStyle:   "italic",
        color:       theme.accent2,
        marginBottom:"8px",
      }}>
        In short
      </div>
      <p style={{
        margin:     0,
        fontSize:   "15px",
        lineHeight: "1.7",
        color:      theme.text,
        fontFamily: "'Source Serif 4', Georgia, serif",
      }}>
        {text}
      </p>
    </div>
  );
}

function MetricBlock({ items, theme }: { items: MetricItem[]; theme: Theme }) {
  // Max 3 items enforced by the schema (Field max_length=3).
  // If a section has 4+ figures the formatter emits a second metric block,
  // so this component just renders whatever items it receives as a grid.
  const capped = items.slice(0, 3);
  return (
    <div style={{
      display:             "grid",
      gridTemplateColumns: `repeat(${capped.length}, 1fr)`,
      gap:                 "1px",
      background:          theme.border,
      border:              `1px solid ${theme.border}`,
      borderRadius:        "2px",
      overflow:            "hidden",
      margin:              "20px 0",
    }}>
      {capped.map((item, i) => {
        const changeColor = metricChangeColor(item.direction, item.sentiment, theme);
        const arrow = item.direction === "up" ? "↑" : item.direction === "down" ? "↓" : "";
        return (
          <div key={i} style={{ background: theme.bgSecondary, padding: "14px 16px" }}>
            <div style={{
              fontFamily:    "'IBM Plex Mono', monospace",
              fontSize:      "11px",
              letterSpacing: ".04em",
              color:         theme.textMuted,
              marginBottom:  "8px",
              fontWeight:    500,
            }}>
              {item.label}
            </div>
            <div style={{
              fontFamily:  "'Source Serif 4', Georgia, serif",
              fontSize:    "22px",
              color:       theme.text,
              display:     "flex",
              alignItems:  "baseline",
              gap:         "8px",
              flexWrap:    "wrap",
            }}>
              {item.value}
              {item.change && (
                <span style={{
                  fontFamily:  "'IBM Plex Mono', monospace",
                  fontSize:    "11px",
                  fontWeight:  600,
                  color:       changeColor,
                }}>
                  {arrow} {item.change}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RiskFlagBlock({
  level, title, text, theme,
}: { level: RiskLevel; title: string; text: string; theme: Theme }) {
  const colors = riskColors(level, theme);
  const iconBg  = riskIconBg(level, theme);
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <div style={{
      display:       "flex",
      gap:           "14px",
      alignItems:    "flex-start",
      borderLeft:    `3px solid ${colors.border}`,
      borderTop:     `1px solid ${theme.border}`,
      borderRight:   `1px solid ${theme.border}`,
      borderBottom:  `1px solid ${theme.border}`,
      borderRadius:  "2px",
      background:    theme.bgSecondary,
      padding:       "16px 20px",
      margin:        "20px 0",
    }}>
      {/* Icon badge */}
      <div style={{
        width:          "22px",
        height:         "22px",
        borderRadius:   "50%",
        background:     iconBg,
        color:          colors.icon,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontFamily:     "'IBM Plex Mono', monospace",
        fontSize:       "13px",
        fontWeight:     600,
        flexShrink:     0,
        marginTop:      "1px",
      }}>
        !
      </div>
      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily:    "'IBM Plex Mono', monospace",
          fontSize:      "12px",
          fontWeight:    600,
          letterSpacing: ".03em",
          textTransform: "uppercase",
          color:         colors.label,
          marginBottom:  "6px",
        }}>
          {levelLabel} — {title}
        </div>
        <p style={{
          margin:     0,
          fontSize:   "15px",
          lineHeight: "1.7",
          color:      theme.text,
          fontFamily: "'Source Serif 4', Georgia, serif",
        }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function QuoteBlock({
  text, speaker, theme,
}: { text: string; speaker?: string; theme: Theme }) {
  return (
    <div style={{
      borderLeft:  `2px solid ${theme.borderHover}`,
      paddingLeft: "20px",
      margin:      "24px 0",
    }}>
      <p style={{
        fontStyle:   "italic",
        fontSize:    "17px",
        lineHeight:  "1.7",
        color:       theme.text,
        margin:      speaker ? "0 0 8px" : "0",
        fontFamily:  "'Source Serif 4', Georgia, serif",
      }}>
        "{text}"
      </p>
      {/* speaker is Optional in schema — render conditionally */}
      {speaker && (
        <div style={{
          fontFamily:  "'IBM Plex Mono', monospace",
          fontSize:    "12px",
          color:       theme.textMuted,
          fontWeight:  500,
        }}>
          — {speaker}
        </div>
      )}
    </div>
  );
}

function WatchItemBlock({ text, theme }: { text: string; theme: Theme }) {
  return (
    <div style={{
      background:   `${theme.accent2}0f`,   // ~6% opacity tint
      border:       `1px dashed ${theme.accent2}`,
      borderRadius: "2px",
      padding:      "16px 20px",
      margin:       "20px 0",
    }}>
      <div style={{
        fontFamily:    "'IBM Plex Mono', monospace",
        fontSize:      "11px",
        letterSpacing: ".08em",
        textTransform: "uppercase",
        fontWeight:    600,
        color:         theme.accent2,
        marginBottom:  "8px",
      }}>
        Worth tracking next quarter
      </div>
      <p style={{
        margin:     0,
        fontSize:   "15px",
        lineHeight: "1.7",
        color:      theme.text,
        fontFamily: "'Source Serif 4', Georgia, serif",
      }}>
        {text}
      </p>
    </div>
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────

interface Props {
  blocks: SectionBlock[];
  theme:  Theme;
}

export default function SectionBlockRenderer({ blocks, theme }: Props) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return <ParagraphBlock  key={i} text={block.text}  theme={theme} />;
          case "heading":
            return <HeadingBlock    key={i} text={block.text}  theme={theme} />;
          case "summary":
            return <SummaryBlock    key={i} text={block.text}  theme={theme} />;
          case "metric":
            return <MetricBlock     key={i} items={block.items} theme={theme} />;
          case "risk_flag":
            return (
              <RiskFlagBlock
                key={i}
                level={block.level}
                title={block.title}
                text={block.text}
                theme={theme}
              />
            );
          case "quote":
            return (
              <QuoteBlock
                key={i}
                text={block.text}
                speaker={block.speaker}
                theme={theme}
              />
            );
          case "watch_item":
            return <WatchItemBlock key={i} text={block.text} theme={theme} />;
          default:
            // Unknown block type from a future schema version — render
            // nothing rather than crashing. TypeScript exhaustiveness check.
            return null;
        }
      })}
    </>
  );
}