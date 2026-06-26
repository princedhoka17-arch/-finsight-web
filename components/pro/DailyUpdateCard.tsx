"use client";

interface DailyUpdateCardProps {
  company: string;
  ticker: string;
  date: string;
  headline: string;
  summary: string;
  sentiment: "Positive" | "Neutral" | "Negative" | "Cautious";
  changePercent?: number;
  tags?: string[];
}

const SENTIMENT_COLORS = {
  Positive: { color: "#5DCAA5", bg: "rgba(93,202,165,0.12)",  border: "rgba(93,202,165,0.3)"  },
  Neutral:  { color: "#C9A84C", bg: "rgba(201,168,76,0.12)",  border: "rgba(201,168,76,0.3)"  },
  Cautious: { color: "#C9A84C", bg: "rgba(201,168,76,0.12)",  border: "rgba(201,168,76,0.3)"  },
  Negative: { color: "#E24B4A", bg: "rgba(226,75,74,0.12)",   border: "rgba(226,75,74,0.3)"   },
};

export default function DailyUpdateCard({
  company,
  ticker,
  date,
  headline,
  summary,
  sentiment,
  changePercent,
  tags = [],
}: DailyUpdateCardProps) {
  const s = SENTIMENT_COLORS[sentiment];
  const isPositiveChange = changePercent !== undefined && changePercent >= 0;

  return (
    <div className="card">
      <div className="card-top">
        <div className="company-row">
          <div className="avatar">{company.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="company">{company}</div>
            <div className="ticker-date">
              <span className="ticker">{ticker}</span>
              <span className="dot">·</span>
              <span className="date">{date}</span>
            </div>
          </div>
        </div>
        <div className="right-badges">
          {changePercent !== undefined && (
            <span className="change" style={{ color: isPositiveChange ? "#5DCAA5" : "#E24B4A" }}>
              {isPositiveChange ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
            </span>
          )}
          <span
            className="sentiment"
            style={{ color: s.color, background: s.bg, borderColor: s.border }}
          >
            {sentiment}
          </span>
        </div>
      </div>

      <div className="divider" />

      <div className="headline">{headline}</div>
      <p className="summary">{summary}</p>

      {tags.length > 0 && (
        <div className="tags">
          {tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <style jsx>{`
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-family: 'Georgia', serif;
          transition: border-color 0.2s;
        }
        .card:hover { border-color: rgba(255,255,255,0.14); }
        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .company-row { display: flex; align-items: center; gap: 10px; }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #C9A84C;
          flex-shrink: 0;
        }
        .company {
          font-family: 'Georgia', serif;
          font-size: 14px;
          color: #E8E6DF;
        }
        .ticker-date {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 2px;
        }
        .ticker {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          color: #C9A84C;
        }
        .dot {
          color: rgba(232,230,223,0.2);
          font-size: 10px;
        }
        .date {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          color: rgba(232,230,223,0.35);
        }
        .right-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .change {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          font-weight: 700;
        }
        .sentiment {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 3px;
          border: 1px solid;
        }
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .headline {
          font-family: 'Georgia', serif;
          font-size: 14px;
          color: #E8E6DF;
          line-height: 1.4;
          font-weight: 400;
        }
        .summary {
          font-family: 'Georgia', serif;
          font-size: 13px;
          color: rgba(232,230,223,0.55);
          line-height: 1.65;
          margin: 0;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tag {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(232,230,223,0.4);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 3px 8px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}