"use client";

import Link from "next/link";

type RiskLevel = "Low" | "Medium" | "High";

interface ReportCardProps {
  id: string;
  company: string;
  ticker?: string;
  sector?: string;
  reportType: string;
  year: string;
  riskLevel: RiskLevel;
  aiScore?: number;
  summary?: string;
  isNew?: boolean;
  isLocked?: boolean;
  onUnlock?: () => void;
}

const RISK_COLORS: Record<RiskLevel, { color: string; bg: string; border: string }> = {
  Low:    { color: "#5DCAA5", bg: "rgba(93,202,165,0.12)",  border: "rgba(93,202,165,0.3)"  },
  Medium: { color: "#C9A84C", bg: "rgba(201,168,76,0.12)",  border: "rgba(201,168,76,0.3)"  },
  High:   { color: "#E24B4A", bg: "rgba(226,75,74,0.12)",   border: "rgba(226,75,74,0.3)"   },
};

export default function ReportCard({
  id,
  company,
  ticker,
  sector,
  reportType,
  year,
  riskLevel,
  aiScore,
  summary,
  isNew,
  isLocked,
  onUnlock,
}: ReportCardProps) {
  const risk = RISK_COLORS[riskLevel];
  const initials = company.slice(0, 2).toUpperCase();

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <div className="avatar">{initials}</div>
        <div className="card-meta">
          <div className="company-name">{company}</div>
          <div className="card-sub">
            {ticker && <span className="ticker">{ticker}</span>}
            {sector && <span className="sector">{sector}</span>}
          </div>
        </div>
        {isNew && <span className="badge-new">New</span>}
      </div>

      <div className="divider" />

      {/* Report type + year */}
      <div className="report-info-row">
        <span className="report-type">{reportType}</span>
        <span className="report-year">{year}</span>
      </div>

      {/* AI Summary */}
      {summary && (
        <p className={`summary ${isLocked ? "locked-text" : ""}`}>
          {isLocked ? summary.slice(0, 80) + "..." : summary}
        </p>
      )}

      {/* Metrics row */}
      <div className="metrics-row">
        <div className="metric">
          <span className="metric-label">Risk</span>
          <span
            className="metric-val risk-badge"
            style={{ color: risk.color, background: risk.bg, borderColor: risk.border }}
          >
            {riskLevel}
          </span>
        </div>
        {aiScore !== undefined && (
          <div className="metric">
            <span className="metric-label">AI Score</span>
            <span className="metric-val" style={{ color: "#C9A84C" }}>
              {aiScore}/10
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      {isLocked ? (
        <button className="card-btn locked-btn" onClick={onUnlock}>
          Unlock Report — ₹99
        </button>
      ) : (
        <Link href={`/reports/${id}`} className="card-btn open-btn">
          Read Report
        </Link>
      )}

      <style jsx>{`
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.2s, transform 0.2s;
          font-family: 'Georgia', serif;
        }
        .card:hover {
          border-color: rgba(201,168,76,0.25);
          transform: translateY(-1px);
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: 700;
          color: #C9A84C;
          flex-shrink: 0;
        }
        .card-meta { flex: 1; min-width: 0; }
        .company-name {
          font-size: 15px;
          color: #E8E6DF;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-sub {
          display: flex;
          gap: 8px;
          margin-top: 3px;
        }
        .ticker {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          color: #C9A84C;
          background: rgba(201,168,76,0.1);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .sector {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.04em;
          color: rgba(232,230,223,0.35);
        }
        .badge-new {
          font-family: 'Courier New', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #7F77DD;
          background: rgba(127,119,221,0.12);
          border: 1px solid rgba(127,119,221,0.3);
          padding: 3px 8px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .report-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .report-type {
          font-family: 'Georgia', serif;
          font-size: 13px;
          color: rgba(232,230,223,0.6);
        }
        .report-year {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          color: rgba(232,230,223,0.35);
        }
        .summary {
          font-family: 'Georgia', serif;
          font-size: 13px;
          line-height: 1.65;
          color: rgba(232,230,223,0.55);
          margin: 0;
        }
        .locked-text {
          filter: blur(3px);
          user-select: none;
          pointer-events: none;
        }
        .metrics-row {
          display: flex;
          gap: 20px;
        }
        .metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .metric-label {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(232,230,223,0.35);
        }
        .metric-val {
          font-family: 'Georgia', serif;
          font-size: 14px;
        }
        .risk-badge {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 3px;
          border: 1px solid;
          display: inline-block;
        }
        .card-btn {
          display: block;
          text-align: center;
          padding: 11px;
          border-radius: 6px;
          font-family: 'Georgia', serif;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: opacity 0.2s, background 0.2s;
          margin-top: auto;
        }
        .open-btn {
          background: rgba(201,168,76,0.12);
          color: #C9A84C;
          border: 1px solid rgba(201,168,76,0.3);
        }
        .open-btn:hover { background: rgba(201,168,76,0.2); }
        .locked-btn {
          background: rgba(255,255,255,0.05);
          color: rgba(232,230,223,0.6);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .locked-btn:hover {
          background: rgba(201,168,76,0.1);
          color: #C9A84C;
          border-color: rgba(201,168,76,0.3);
        }
      `}</style>
    </div>
  );
}