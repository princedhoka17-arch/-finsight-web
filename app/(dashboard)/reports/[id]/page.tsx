"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { reportsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { PLAN_LIMITS, REPORT_TYPE_LABELS } from "@/types";
import type {
  Report, ReportSection, ChatMessage, RiskLevel,
  SectionBlock, ParagraphBlock, HeadingBlock, SummaryBlock,
  MetricBlock, RiskFlagBlock, QuoteBlock, WatchItemBlock,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRiskColor(risk: RiskLevel | string, theme: any): string {
  if (risk === "Low"  || risk === "low")  return theme.success;
  if (risk === "High" || risk === "high") return theme.danger;
  return theme.info;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function hexToRgb(colour: string): string {
  if (!colour || !colour.startsWith("#")) return "168,112,61";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
  if (!r) return "168,112,61";
  return `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`;
}

// ─── Highlight system ─────────────────────────────────────────────────────────

type HighlightType = "growth" | "loss" | "caution" | "product" | "metric";

const HIGHLIGHT_TOKENS: { pattern: RegExp; type: HighlightType }[] = [
  {
    pattern: /\b(raised? guidance|raised? FY|beats? (?:estimates?|consensus)|re-?accelerat\w+|outperform\w*|strong (?:demand|growth|beat)|record (?:revenue|growth|profit)|upgrades?|raised? (?:outlook|target|forecast)|positive (?:momentum|outlook)|above (?:expectations?|estimates?|consensus)|margin expansion|continued acceleration|broad-?based (?:beat|growth)|re-rating|re-?rate)\b/gi,
    type: "growth",
  },
  {
    pattern: /\b(operating loss|net loss|miss\w*|declin\w+|restructuring|impairment|widen\w+|lowers? (?:outlook|margin|guidance|forecast)|pressure\w*|headwind\w*|sharply (?:lower|down|fell)|layoffs?|write-?down|below (?:expectations?|estimates?|consensus)|margin compression|loss widened?|panic sell|pulled back)\b/gi,
    type: "loss",
  },
  {
    pattern: /\b(export (?:restrictions?|controls?)|supply (?:constraint|chain|shortage)|tariff\w*|regulat\w+|litigation|probe|investigation|antitrust|cautious|monitor|uncertain\w*|unresolved|cap upside|consider selling)\b/gi,
    type: "caution",
  },
  {
    pattern: /\b(BharatNet|RVNL|Rail Vikas|NSE|BSE|Blackwell|H200|H100|Azure|Copilot|Apple Intelligence|iPhone|ChatGPT|Gemini|AWS|GCP|TSMC|HBM\d?|defence|Defense|5G|optical fibre|optic fibre|telecom)\b/gi,
    type: "product",
  },
  {
    pattern: /(\$[\d.,]+[BbMmKk]?|€[\d.,]+[BbMmKk]?|₹[\d.,]+\s*(?:crore|lakh|Cr|L)?[BbMmKk]?|[\d.,]+%|[\d.,]+x\b|EPS|ARPU|EBITDA|EBIT|ROE|FCF|gross margin|operating margin|net margin|revenue|earnings|guidance|FY\s?\d{2,4}|Q[1-4]\s?FY?\d{2,4}|YoY|QoQ|basis points?|bps)/gi,
    type: "metric",
  },
];

const HIGHLIGHT_STYLES: Record<HighlightType, { color: string; bg: string }> = {
  growth:  { color: "#2A6647", bg: "#3C7A5F18" },
  loss:    { color: "#943428", bg: "#B0503F18" },
  caution: { color: "#A0701A", bg: "#C18A2E18" },
  product: { color: "#185FA5", bg: "#185FA518" },
  metric:  { color: "#534AB7", bg: "#534AB718" },
};

function renderRichText(text: string, theme: any): React.ReactNode {
  if (!text) return null;
  const combined = new RegExp(
    HIGHLIGHT_TOKENS.map(t => `(${t.pattern.source})`).join("|"),
    "gi"
  );
  const parts: { text: string; type: HighlightType | null }[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = combined.exec(text)) !== null) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), type: null });
    const matched = match[0];
    let detected: HighlightType = "metric";
    for (const token of HIGHLIGHT_TOKENS) {
      const re = new RegExp(`^(?:${token.pattern.source})$`, "i");
      if (re.test(matched)) { detected = token.type; break; }
    }
    parts.push({ text: matched, type: detected });
    last = match.index + matched.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), type: null });
  return (
    <>
      {parts.map((p, i) => {
        if (!p.type) return <span key={i}>{p.text}</span>;
        const s = HIGHLIGHT_STYLES[p.type];
        const isNum = /^[\$€₹]?[\d.,]+/.test(p.text.trim());
        return (
          <span
            key={i}
            style={{
              fontWeight: 600,
              color: s.color,
              background: s.bg,
              padding: isNum ? "1px 6px" : "1px 5px",
              borderRadius: 4,
              fontFamily: isNum ? "IBM Plex Mono, monospace" : "inherit",
              fontSize: isNum ? "14px" : "inherit",
              letterSpacing: isNum ? "0.03em" : "inherit",
              whiteSpace: "nowrap",
              display: "inline",
            }}
          >
            {p.text}
          </span>
        );
      })}
    </>
  );
}

// ─── Text structure helpers ───────────────────────────────────────────────────

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (t === t.toUpperCase() && /[A-Z]/.test(t)) return true;
  if (t.endsWith(":") && t.length < 60) return true;
  return false;
}

function isBulletLine(line: string): boolean {
  return /^\s*[•\-*–—]\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^\s*[•\-*–—]\s+/, "").trim();
}

// ─── Highlight legend ─────────────────────────────────────────────────────────

function HighlightLegend({ theme }: { theme: any }) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const items: { label: string; type: HighlightType }[] = [
    { label: "Growth",  type: "growth"  },
    { label: "Risk",    type: "loss"    },
    { label: "Watch",   type: "caution" },
    { label: "Company", type: "product" },
    { label: "Metric",  type: "metric"  },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18, alignItems: "center" }}>
      <span style={{ ...mono, fontSize: 9, color: theme.textFaint, letterSpacing: "0.07em", marginRight: 2 }}>KEY:</span>
      {items.map(({ label, type }) => {
        const s = HIGHLIGHT_STYLES[type];
        return (
          <span
            key={type}
            style={{ ...mono, fontSize: 9, fontWeight: 600, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 4 }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Segment type ─────────────────────────────────────────────────────────────

type Segment = { type: "heading" | "bullet" | "para" | "footer"; text: string };

// Splits flat text (with or without newlines) into structured segments.
// Handles the case where the entire section is one continuous string.
function splitIntoSegments(text: string): Segment[] {
  const segments: Segment[] = [];

  // Try splitting by newlines first
  const byNewline = text.split(/\n+/).map(s => s.trim()).filter(Boolean);

  if (byNewline.length > 1) {
    for (const line of byNewline) {
      if (isBulletLine(line)) {
        segments.push({ type: "bullet", text: stripBullet(line) });
      } else if (/^(Sources?|DISCLAIMER|Data sourced)/i.test(line)) {
        segments.push({ type: "footer", text: line });
      } else if (isHeadingLine(line)) {
        segments.push({ type: "heading", text: line.replace(/:$/, "").trim() });
      } else {
        segments.push({ type: "para", text: line });
      }
    }
    return segments;
  }

  // Flat text — find known section label boundaries
  const LABEL_RE = /(?:Positives?[^:]{0,30}:|Negatives?[^:]{0,30}:|Score[^:]{0,30}:|Summary[^:]{0,20}:|Verdict[^:]{0,20}:|What to expect[^:]{0,40}:|Key (?:technical )?levels?[^:]{0,20}:|If you (?:already )?own[^:]{0,30}:|Technical[^:]{0,20}:|Outlook[^:]{0,20}:|DISCLAIMER[^:]{0,10}:|Sources?[^:]{0,10}:)/gi;

  const matches: { index: number; label: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = LABEL_RE.exec(text)) !== null) {
    matches.push({ index: m.index, label: m[0] });
  }

  // No labels found — split into ~250 char sentence chunks
  if (matches.length === 0) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    let chunk = "";
    for (const s of sentences) {
      chunk += s;
      if (chunk.length > 250) {
        segments.push({ type: "para", text: chunk.trim() });
        chunk = "";
      }
    }
    if (chunk.trim()) segments.push({ type: "para", text: chunk.trim() });
    return segments;
  }

  // Preamble before first label
  if (matches[0].index > 0) {
    const preamble = text.slice(0, matches[0].index).trim();
    if (preamble) segments.push({ type: "para", text: preamble });
  }

  // Each labelled section
  for (let i = 0; i < matches.length; i++) {
    const labelStart = matches[i].index;
    const labelLen   = matches[i].label.length;
    const bodyEnd    = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const label      = matches[i].label.trim();
    const body       = text.slice(labelStart + labelLen, bodyEnd).trim();
    const isFooter   = /^(sources?|disclaimer)/i.test(label);

    if (isFooter) {
      segments.push({ type: "footer", text: `${label} ${body}`.trim() });
      continue;
    }

    // Section heading
    segments.push({ type: "heading", text: label.replace(/:$/, "").trim() });

    if (!body) continue;

    // Split body into sentence-sized paragraphs
    const sentences = body.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [body];
    let para = "";
    for (const s of sentences) {
      para += s;
      if (para.length > 220) {
        segments.push({ type: "para", text: para.trim() });
        para = "";
      }
    }
    if (para.trim()) segments.push({ type: "para", text: para.trim() });
  }

  return segments;
}

// ─── Rich legacy content renderer ────────────────────────────────────────────

function RichLegacyContent({ text, theme }: { text: string; theme: any }) {
  const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em" };
  const segments = splitIntoSegments(text);
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  function flushBullets() {
    if (!bulletBuffer.length) return;
    elements.push(
      <ul key={`b${elements.length}`} style={{ margin: "0 0 16px", paddingLeft: 0, listStyle: "none" }}>
        {bulletBuffer.map((b, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#B0503F", flexShrink: 0, marginTop: 9 }} />
            <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, lineHeight: 1.75, color: theme.text }}>
              {renderRichText(b, theme)}
            </span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  }

  for (const seg of segments) {
    if (seg.type === "bullet") {
      bulletBuffer.push(seg.text);
      continue;
    }
    flushBullets();

    if (seg.type === "heading") {
      elements.push(
        <div
          key={`h${elements.length}`}
          style={{
            ...mono,
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
            color: theme.textMuted, textTransform: "uppercase",
            margin: "22px 0 10px", paddingBottom: 6,
            borderBottom: `0.5px solid ${theme.border}`,
          }}
        >
          {seg.text}
        </div>
      );
    } else if (seg.type === "footer") {
      elements.push(
        <div
          key={`f${elements.length}`}
          style={{
            ...mono,
            fontSize: 10, color: theme.textFaint,
            lineHeight: 1.7, marginTop: 20,
            paddingTop: 12, borderTop: `0.5px solid ${theme.border}`,
          }}
        >
          {seg.text}
        </div>
      );
    } else {
      elements.push(
        <p
          key={`p${elements.length}`}
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 15, lineHeight: 1.85,
            color: theme.text, margin: "0 0 14px",
          }}
        >
          {renderRichText(seg.text, theme)}
        </p>
      );
    }
  }

  flushBullets();
  return <>{elements}</>;
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function BlockParagraph({ block, theme }: { block: ParagraphBlock; theme: any }) {
  return (
    <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, lineHeight: 1.85, color: theme.text, margin: "0 0 14px" }}>
      {renderRichText(block.text, theme)}
    </p>
  );
}

function BlockHeading({ block, theme }: { block: HeadingBlock; theme: any }) {
  return (
    <h4 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 400, fontSize: 17, color: theme.text, margin: "28px 0 10px", borderBottom: `1px solid ${theme.border}`, paddingBottom: 6 }}>
      {block.text}
    </h4>
  );
}

function BlockSummary({ block, theme }: { block: SummaryBlock; theme: any }) {
  return (
    <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2, padding: "16px 20px", margin: "20px 0" }}>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 600, color: theme.accent2, fontStyle: "italic", marginBottom: 8 }}>In short</div>
      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, lineHeight: 1.7, color: theme.text, margin: 0 }}>
        {renderRichText(block.text, theme)}
      </p>
    </div>
  );
}

function BlockMetric({ block, theme }: { block: MetricBlock; theme: any }) {
  function changeColor(sentiment?: string): string {
    if (sentiment === "good")    return theme.success;
    if (sentiment === "bad")     return theme.info;
    return theme.textMuted;
  }
  function arrow(direction?: string): string {
    return direction === "up" ? "↑" : direction === "down" ? "↓" : "";
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${block.items.length}, 1fr)`, gap: 1, background: theme.border, border: `1px solid ${theme.border}`, borderRadius: 2, overflow: "hidden", margin: "20px 0" }}>
      {block.items.map((item, i) => (
        <div key={i} style={{ background: theme.bgSecondary, padding: "14px 16px" }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, letterSpacing: "0.04em", color: theme.textMuted, marginBottom: 8, fontWeight: 500 }}>{item.label}</div>
          <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, color: theme.text, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            {item.value}
            {item.change && (
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, color: changeColor(item.sentiment) }}>
                {arrow(item.direction)} {item.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BlockRiskFlag({ block, theme }: { block: RiskFlagBlock; theme: any }) {
  const color = getRiskColor(block.level, theme);
  const rgb   = hexToRgb(color);
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", borderLeft: `3px solid ${color}`, borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, background: theme.bgSecondary, borderRadius: 2, padding: "16px 20px", margin: "20px 0" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: `rgba(${rgb},0.14)`, color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 600, marginTop: 1 }}>!</div>
      <div>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color, marginBottom: 6 }}>
          {block.level.charAt(0).toUpperCase() + block.level.slice(1)} — {block.title}
        </div>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, lineHeight: 1.7, color: theme.text, margin: 0 }}>{block.text}</p>
      </div>
    </div>
  );
}

function BlockQuote({ block, theme }: { block: QuoteBlock; theme: any }) {
  return (
    <div style={{ borderLeft: `2px solid ${theme.borderHover ?? theme.border}`, paddingLeft: 20, margin: "24px 0" }}>
      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", fontSize: 17, lineHeight: 1.7, color: theme.text, margin: "0 0 8px" }}>
        "{renderRichText(block.text, theme)}"
      </p>
      {block.speaker && (
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: theme.textMuted }}>
          — {block.speaker}
        </div>
      )}
    </div>
  );
}

function BlockWatchItem({ block, theme }: { block: WatchItemBlock; theme: any }) {
  const rgb = hexToRgb(theme.accent2 ?? theme.info);
  return (
    <div style={{ background: `rgba(${rgb},0.06)`, border: `1px dashed ${theme.accent2 ?? theme.info}`, borderRadius: 2, padding: "16px 20px", margin: "20px 0" }}>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, color: theme.accent2 ?? theme.info, marginBottom: 8 }}>
        Worth tracking next quarter
      </div>
      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, lineHeight: 1.7, color: theme.text, margin: 0 }}>
        {block.text}
      </p>
    </div>
  );
}

function BlockRenderer({ block, theme }: { block: SectionBlock; theme: any }) {
  switch (block.type) {
    case "paragraph":  return <BlockParagraph  block={block as ParagraphBlock}  theme={theme} />;
    case "heading":    return <BlockHeading    block={block as HeadingBlock}    theme={theme} />;
    case "summary":    return <BlockSummary    block={block as SummaryBlock}    theme={theme} />;
    case "metric":     return <BlockMetric     block={block as MetricBlock}     theme={theme} />;
    case "risk_flag":  return <BlockRiskFlag   block={block as RiskFlagBlock}   theme={theme} />;
    case "quote":      return <BlockQuote      block={block as QuoteBlock}      theme={theme} />;
    case "watch_item": return <BlockWatchItem  block={block as WatchItemBlock}  theme={theme} />;
    default:           return null;
  }
}

// ─── Section content ──────────────────────────────────────────────────────────

function SectionContent({ section, theme }: { section: ReportSection; theme: any }) {
  const content = section.content;

  // Plain string legacy
  if (typeof content === "string") {
    return (
      <>
        <HighlightLegend theme={theme} />
        <RichLegacyContent text={content} theme={theme} />
      </>
    );
  }

  // Legacy block — text stored in blocks[0]
  if (content?.legacy) {
    const firstBlock = content?.blocks?.[0];
    const rawText = (firstBlock && "text" in firstBlock) ? (firstBlock as any).text as string : "";
    return (
      <>
        <HighlightLegend theme={theme} />
        <RichLegacyContent text={rawText} theme={theme} />
      </>
    );
  }

  // Still processing
  if (!content?.blocks?.length) {
    return (
      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textFaint, fontStyle: "italic" }}>
        This section is still being processed.
      </p>
    );
  }

  // Structured blocks
  return (
    <>
      <HighlightLegend theme={theme} />
      {content.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} theme={theme} />
      ))}
    </>
  );
}

// ─── Beginner cards ───────────────────────────────────────────────────────────

function parseBeginnerCards(sections: ReportSection[]): { title: string; content: string }[] {
  const s = sections.find(sec => sec.section_type === "beginner_cards");
  if (!s) return [];
  try {
    const firstBlock = s.content?.blocks?.[0];
    const text = (firstBlock && "text" in firstBlock) ? (firstBlock as any).text as string : undefined;
    if (!text) return [];
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function getContentSections(sections: ReportSection[]): ReportSection[] {
  return sections
    .filter(s => s.section_type !== "beginner_cards")
    .sort((a, b) => a.order_index - b.order_index);
}

function BeginnerCard({ title, content, theme }: { title: string; content: string; theme: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 12 }}
      >
        <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.accent, textAlign: "left" }}>{title}</span>
        <span style={{ color: theme.accent, fontSize: 14, flexShrink: 0, fontFamily: "IBM Plex Mono, monospace", transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "12px 18px 16px", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.textMuted, lineHeight: 1.7, borderTop: `1px solid ${theme.border}` }}>
          {content}
        </div>
      )}
    </div>
  );
}

// ─── Section tab ──────────────────────────────────────────────────────────────

function SectionTab({ label, active, onClick, theme }: { label: string; active: boolean; onClick: () => void; theme: any }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none", border: "none",
        borderBottom: `2px solid ${active ? theme.accent : "transparent"}`,
        color: active ? theme.accent : hovered ? (theme.accent2 ?? theme.accent) : theme.textMuted,
        padding: "10px 16px",
        fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
        cursor: "pointer", letterSpacing: "0.06em",
        textTransform: "uppercase", whiteSpace: "nowrap", transition: "color 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ msg, theme }: { msg: ChatMessage; theme: any }) {
  const isUser    = msg.role === "user";
  const accentRgb = hexToRgb(theme.accent);
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <div style={{ maxWidth: "80%", background: isUser ? `rgba(${accentRgb},0.08)` : theme.bgSecondary, border: `1px solid ${isUser ? theme.accent + "40" : theme.border}`, borderRadius: 2, padding: "10px 14px" }}>
        <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.text, lineHeight: 1.6, margin: 0 }}>
          {msg.content || <span style={{ opacity: 0.4 }}>Thinking…</span>}
        </p>
        <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.textFaint, marginTop: 4, textAlign: isUser ? "right" : "left" }}>
          {formatTime(new Date(msg.timestamp))}
        </p>
      </div>
    </div>
  );
}

// ─── PDF in-app viewer ────────────────────────────────────────────────────────

function PdfViewer({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    function blockKeys(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && ["s", "S", "p", "P"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    window.addEventListener("keydown", blockKeys, true);
    return () => window.removeEventListener("keydown", blockKeys, true);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#1a1a1a", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ height: 48, flexShrink: 0, background: "#111111", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", padding: "0 16px", gap: 16 }}>
        <button
          onClick={onClose}
          style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "rgba(255,255,255,0.85)", padding: "5px 14px", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, cursor: "pointer", letterSpacing: "0.04em", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          ← Back to Report
        </button>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3C7A5F" }} />
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>
            VIEWING IN APP
          </span>
        </div>
      </div>
      {/* PDF area — #toolbar=0 hides browser download/print toolbar */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <object
          data={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
          type="application/pdf"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        >
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            title={title}
            sandbox="allow-scripts allow-same-origin"
          />
        </object>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportViewerPage() {
  const { theme }       = useThemeStore();
  const { plan }        = useAppStore();
  const { requireAuth } = useAuth();
  const params          = useParams();
  const router          = useRouter();
  const reportId        = params.id as string;

  const [mounted,       setMounted]       = useState(false);
  const [report,        setReport]        = useState<Report | null>(null);
  const [allSections,   setAllSections]   = useState<ReportSection[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [accessDenied,  setAccessDenied]  = useState(false);
  const [accessMessage, setAccessMessage] = useState("This report requires a higher plan.");

  const [pdfOpen,    setPdfOpen]    = useState(false);
  const [pdfUrl,     setPdfUrl]     = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const planLimits  = PLAN_LIMITS[plan];
  const chatEnabled = planLimits.ai_questions_per_report !== 0;

  const [chatOpen,      setChatOpen]      = useState(false);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [chatInput,     setChatInput]     = useState("");
  const [chatLoading,   setChatLoading]   = useState(false);
  const [sessionId,     setSessionId]     = useState<string | null>(null);
  const [questionsLeft, setQuestionsLeft] = useState<number | typeof Infinity>(
    planLimits.ai_questions_per_report === -1 ? Infinity : planLimits.ai_questions_per_report
  );

  const abortRef      = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) requireAuth(); }, [mounted]);
  useEffect(() => { if (mounted && reportId) fetchReport(); }, [mounted, reportId]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    return () => document.removeEventListener("contextmenu", prevent);
  }, []);

  async function fetchReport() {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res  = await reportsApi.getById(reportId);
      const data = res.data as Report & { sections?: ReportSection[] };
      setReport(data);
      setAllSections(data.sections ?? []);
    } catch (err: any) {
      if (err?.response?.status === 403)      setAccessMessage("This report requires a higher plan. Upgrade to access the full library.");
      else if (err?.response?.status === 404) setAccessMessage("This report could not be found.");
      else                                    setAccessMessage("Unable to load this report. Please try again.");
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  }

  async function openPdf() {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const res = await reportsApi.getAccess(reportId);
      const url = res.data?.pdf_url as string | undefined;
      if (!url) throw new Error("PDF not available for this report.");
      setPdfUrl(url);
      setPdfOpen(true);
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Could not load PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  function closePdf() { setPdfOpen(false); setPdfUrl(null); }

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading || questionsLeft === 0) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: "user",
      content: chatInput.trim(), timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: "assistant", content: "", timestamp: new Date() }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ report_id: reportId, message: userMsg.content, session_id: sessionId ?? undefined }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${response.status}`);
      }

      const reader    = response.body!.getReader();
      const decoder   = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === "session" && parsed.session_id) setSessionId(parsed.session_id);
            if (parsed.type === "text" && parsed.content) {
              accumulated += parsed.content;
              setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, content: accumulated } : msg));
            }
            if (parsed.type === "error") throw new Error(parsed.message);
          } catch { /* ignore partial SSE chunks */ }
        }
      }

      if (questionsLeft !== Infinity) setQuestionsLeft(q => Math.max(0, (q as number) - 1));
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages(prev => prev.map(msg =>
        msg.id === aiMsgId
          ? { ...msg, content: err.message || "Sorry, I couldn't process that. Please try again." }
          : msg
      ));
    } finally {
      setChatLoading(false);
    }
  }

  if (!mounted) return null;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${theme.accent}4D`, borderTopColor: theme.accent, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: theme.textMuted, letterSpacing: "0.08em" }}>
            LOADING REPORT…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Access denied ─────────────────────────────────────────────────────────────
  if (accessDenied || !report) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>🔒</div>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, color: theme.text, marginBottom: 12, fontWeight: "normal" }}>
            Report Access Restricted
          </h2>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textMuted, marginBottom: 24, lineHeight: 1.7 }}>
            {accessMessage}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.back()}
              style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 2, color: theme.textMuted, padding: "10px 20px", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, cursor: "pointer", letterSpacing: "0.04em" }}
            >
              ← Go back
            </button>
            <button
              onClick={() => router.push("/subscribe")}
              style={{ background: theme.accent, border: "none", borderRadius: 2, color: theme.accentText, padding: "10px 20px", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, cursor: "pointer", letterSpacing: "0.04em" }}
            >
              View plans →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const beginnerCards     = parseBeginnerCards(allSections);
  const contentSections   = getContentSections(allSections);
  const currentSection    = contentSections[activeSection];
  const showBeginnerCards = (plan === "free" || plan === "beginner") && beginnerCards.length > 0;
  const accentRgb         = hexToRgb(theme.accent);

  return (
    <>
      {pdfOpen && pdfUrl && <PdfViewer url={pdfUrl} title={report.title} onClose={closePdf} />}

      <div
        style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Source Serif 4', Georgia, serif" }}
        onCopy={e => e.preventDefault()}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 28px" }}>

          {/* Back */}
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: theme.textMuted, fontFamily: "IBM Plex Mono, monospace", fontSize: 12, cursor: "pointer", marginBottom: 24, padding: 0, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Back to Reports
          </button>

          {/* Header card */}
          <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2, padding: "24px 28px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
              {/* Ticker box */}
              <div style={{ width: 48, height: 48, borderRadius: 2, flexShrink: 0, background: `rgba(${accentRgb},0.12)`, border: `1px solid ${theme.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 700, color: theme.accent }}>
                {report.company?.ticker?.slice(0, 4) ?? "—"}
              </div>
              {/* Title */}
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: "normal", color: theme.text, marginBottom: 6, lineHeight: 1.3 }}>
                  {report.title}
                </h1>
                <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textMuted, letterSpacing: "0.04em" }}>
                  {report.company?.name} · {report.company?.exchange} · {REPORT_TYPE_LABELS?.[report.report_type] ?? report.report_type} · FY {report.fiscal_year}
                </p>
              </div>
              {/* View PDF button */}
              <button
                onClick={openPdf}
                disabled={pdfLoading}
                style={{ flexShrink: 0, background: pdfLoading ? "transparent" : "#B0503F", border: `1px solid ${pdfLoading ? theme.border : "#B0503F"}`, borderRadius: 6, color: pdfLoading ? theme.textMuted : "#fff", padding: "8px 16px", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, cursor: pdfLoading ? "wait" : "pointer", letterSpacing: "0.05em", opacity: pdfLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: 7, transition: "opacity 0.15s", whiteSpace: "nowrap" }}
              >
                <svg width="12" height="13" viewBox="0 0 12 13" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1.5 1a.5.5 0 01.5-.5h5l3 3V12a.5.5 0 01-.5.5h-8A.5.5 0 011.5 12V1z" stroke="currentColor" strokeWidth="1" fill="none" />
                  <path d="M7 .5V4h3.5" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
                {pdfLoading ? "Opening…" : "View PDF"}
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              {report.risk_level && (
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, fontWeight: 600, color: getRiskColor(report.risk_level, theme), letterSpacing: "0.04em" }}>
                  {report.risk_level} Risk
                </span>
              )}
              {report.ai_score != null && (
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: theme.accent, letterSpacing: "0.04em" }}>
                  AI Score: {report.ai_score}/100
                </span>
              )}
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textFaint, letterSpacing: "0.04em" }}>
                Published: {formatDate(report.published_at)}
              </span>
              {report.company?.sector && (
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.accent2 ?? theme.info, letterSpacing: "0.04em" }}>
                  {report.company.sector}
                </span>
              )}
            </div>
          </div>

          {/* AI Summary */}
          {report.summary && (
            <div style={{ background: `rgba(${accentRgb},0.05)`, border: `1px solid ${theme.accent}22`, borderRadius: 2, padding: "18px 22px", marginBottom: 16 }}>
              <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                AI Summary
              </p>
              <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16, color: theme.text, lineHeight: 1.75, margin: 0 }}>
                {report.summary}
              </p>
            </div>
          )}

          {/* Beginner cards */}
          {showBeginnerCards && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 17, fontWeight: "normal", color: theme.text, marginBottom: 12 }}>
                Key Insights — Simplified
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {beginnerCards.map((card, i) => (
                  <BeginnerCard key={i} title={card.title} content={card.content} theme={theme} />
                ))}
              </div>
            </div>
          )}

          {/* Section tabs + content */}
          {contentSections.length > 0 ? (
            <div style={{ marginBottom: 24 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${theme.border}`, overflowX: "auto", marginBottom: 20 }}>
                {contentSections.map((s, i) => (
                  <SectionTab key={s.id} label={s.title} active={activeSection === i} onClick={() => setActiveSection(i)} theme={theme} />
                ))}
              </div>

              {/* Prev / Next */}
              {contentSections.length > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <button
                    onClick={() => setActiveSection(s => Math.max(0, s - 1))}
                    disabled={activeSection === 0}
                    style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 2, color: activeSection === 0 ? theme.textFaint : theme.textMuted, padding: "6px 14px", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, cursor: activeSection === 0 ? "not-allowed" : "pointer", opacity: activeSection === 0 ? 0.4 : 1, letterSpacing: "0.04em" }}
                  >
                    ← Prev
                  </button>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textFaint, letterSpacing: "0.04em" }}>
                    {activeSection + 1} / {contentSections.length}
                  </span>
                  <button
                    onClick={() => setActiveSection(s => Math.min(contentSections.length - 1, s + 1))}
                    disabled={activeSection === contentSections.length - 1}
                    style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 2, color: activeSection === contentSections.length - 1 ? theme.textFaint : theme.textMuted, padding: "6px 14px", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, cursor: activeSection === contentSections.length - 1 ? "not-allowed" : "pointer", opacity: activeSection === contentSections.length - 1 ? 0.4 : 1, letterSpacing: "0.04em" }}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Section body */}
              {currentSection && (
                <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2, padding: "28px 32px", userSelect: "none" }}>
                  <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: "normal", color: theme.text, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${theme.border}` }}>
                    {currentSection.title}
                  </h3>
                  <SectionContent section={currentSection} theme={theme} />
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2, padding: "40px 24px", textAlign: "center", marginBottom: 24 }}>
              <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textMuted }}>
                Report sections are being processed. Check back shortly.
              </p>
            </div>
          )}

          {/* AI Chat */}
          <div style={{ background: theme.bgSecondary, border: `1px solid ${chatOpen ? theme.accent + "40" : theme.border}`, borderRadius: 2, marginBottom: 32, overflow: "hidden", transition: "border-color 0.2s" }}>
            <button
              onClick={() => chatEnabled && setChatOpen(o => !o)}
              style={{ width: "100%", background: "none", border: "none", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: chatEnabled ? "pointer" : "not-allowed", gap: 12 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🤖</span>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.text, margin: 0 }}>Ask AI about this report</p>
                  <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    {!chatEnabled
                      ? "Upgrade to use AI chat"
                      : questionsLeft === Infinity
                      ? "Unlimited questions"
                      : `${questionsLeft} questions remaining`}
                  </p>
                </div>
              </div>
              {chatEnabled
                ? <span style={{ color: theme.accent, fontSize: 14, fontFamily: "IBM Plex Mono, monospace", transform: chatOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                : <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.accent, border: `1px solid ${theme.accent}40`, borderRadius: 2, padding: "3px 10px", letterSpacing: "0.04em" }}>UPGRADE</span>
              }
            </button>

            {chatOpen && chatEnabled && (
              <div style={{ borderTop: `1px solid ${theme.border}` }}>
                <div style={{ height: 320, overflowY: "auto", padding: "16px 20px" }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: theme.textFaint }}>
                      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, lineHeight: 1.7 }}>
                        Ask anything about this report. I'll answer using the actual report content.
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                        {["What are the main risks?", "How is revenue trending?", "What did management say about growth?", "Is this company profitable?"].map(q => (
                          <button
                            key={q}
                            onClick={() => setChatInput(q)}
                            style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 2, padding: "5px 12px", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textMuted, cursor: "pointer", letterSpacing: "0.02em", transition: "color 0.15s, border-color 0.15s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.accent; (e.currentTarget as HTMLElement).style.color = theme.accent; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; (e.currentTarget as HTMLElement).style.color = theme.textMuted; }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map(msg => <ChatBubble key={msg.id} msg={msg} theme={theme} />)}
                  {chatLoading && (
                    <div style={{ display: "flex", gap: 4, padding: "8px 0" }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: theme.accent, opacity: 0.6, animation: `bounce 0.8s ${i * 0.15}s infinite` }} />
                      ))}
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
                <div style={{ borderTop: `1px solid ${theme.border}`, padding: "12px 16px", display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                    placeholder={questionsLeft === 0 ? "No questions remaining" : "Ask about this report…"}
                    disabled={questionsLeft === 0}
                    style={{ flex: 1, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 2, padding: "10px 14px", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.text, outline: "none", opacity: questionsLeft === 0 ? 0.5 : 1, transition: "border-color 0.15s" }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = theme.accent}
                    onBlur={e  => (e.target as HTMLElement).style.borderColor = theme.border}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim() || questionsLeft === 0}
                    style={{ background: theme.accent, border: "none", borderRadius: 2, color: theme.accentText, padding: "10px 18px", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, cursor: "pointer", letterSpacing: "0.04em", opacity: chatLoading || !chatInput.trim() || questionsLeft === 0 ? 0.5 : 1 }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Legal */}
          <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: theme.textFaint, textAlign: "center", letterSpacing: "0.04em", paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
            Educational research only. Not financial advice. FinSight does not provide SEBI-registered investment recommendations.
          </p>
        </div>

        <style>{`
          @keyframes spin   { to { transform: rotate(360deg); } }
          @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        `}</style>
      </div>
    </>
  );
}