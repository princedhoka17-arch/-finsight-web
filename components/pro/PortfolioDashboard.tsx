"use client";

import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { useAppStore } from "@/store/useAppStore";

interface WatchlistCompany {
  id: string;
  company_id: string;
  company_name: string;
  ticker: string;
  sector: string;
  daily_updates_enabled: boolean;
  latest_update?: {
    headline: string;
    sentiment: "positive" | "neutral" | "negative";
    change_percent: number;
    created_at: string;
  };
  report_count: number;
  last_report_date?: string;
}

interface Alert {
  id: string;
  company_name: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  severity: "low" | "medium" | "high";
  created_at: string;
}

interface PortfolioDashboardProps {
  onCompanyClick?: (companyId: string) => void;
  onViewReport?: (companyId: string) => void;
}

const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral: "#f59e0b",
  negative: "#ef4444",
};

const SEVERITY_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function PortfolioDashboard({
  onCompanyClick,
  onViewReport,
}: PortfolioDashboardProps) {
  const { theme } = useThemeStore();
  const { user } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [companies, setCompanies] = useState<WatchlistCompany[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"portfolio" | "alerts">("portfolio");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchPortfolioData();
  }, [mounted]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      // TODO: FastAPI — GET /watchlist?include_updates=true
      // Returns: { companies: WatchlistCompany[], alerts: Alert[] }
      const [watchlistRes, alertsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist?include_updates=true`, {
          headers: {
            // TODO: Supabase — attach JWT
            // Authorization: `Bearer ${session.access_token}`,
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts?unread_only=false&limit=10`, {
          headers: {
            // TODO: Supabase — attach JWT
          },
        }),
      ]);

      if (watchlistRes.ok) {
        const data = await watchlistRes.json();
        setCompanies(data.companies ?? []);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const markAlertRead = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
    // TODO: FastAPI — PATCH /alerts/{alertId}/read
  };

  if (!mounted) return null;

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${theme.border}`,
          marginBottom: "20px",
        }}
      >
        {(["portfolio", "alerts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${
                activeTab === tab ? theme.accent : "transparent"
              }`,
              color: activeTab === tab ? theme.accent : theme.textMuted,
              fontFamily: "Courier New, monospace",
              fontSize: "12px",
              letterSpacing: "0.06em",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {tab.toUpperCase()}
            {tab === "alerts" && unreadCount > 0 && (
              <span
                style={{
                  background: theme.accent,
                  color: theme.accentText,
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Portfolio tab */}
      {activeTab === "portfolio" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: "88px",
                  background: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  animation: "pd-pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))
          ) : companies.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                background: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "12px",
                }}
              >
                📊
              </div>
              <p
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "14px",
                  color: theme.textMuted,
                }}
              >
                Your watchlist is empty. Add companies to track their daily updates.
              </p>
            </div>
          ) : (
            companies.map((company) => (
              <div
                key={company.id}
                style={{
                  padding: "16px",
                  background: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onClick={() => onCompanyClick?.(company.company_id)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = theme.borderHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = theme.border)
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  {/* Company info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: theme.text,
                        }}
                      >
                        {company.company_name}
                      </span>
                      <span
                        style={{
                          fontFamily: "Courier New, monospace",
                          fontSize: "11px",
                          color: theme.accent,
                          background: `${theme.accent}18`,
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                      >
                        {company.ticker}
                      </span>
                      {company.daily_updates_enabled && (
                        <span
                          style={{
                            fontFamily: "Courier New, monospace",
                            fontSize: "10px",
                            color: theme.success,
                            background: `${theme.success}18`,
                            padding: "2px 6px",
                            borderRadius: "3px",
                          }}
                        >
                          DAILY
                        </span>
                      )}
                    </div>

                    {/* Latest update headline */}
                    {company.latest_update ? (
                      <p
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "13px",
                          color: theme.textMuted,
                          lineHeight: "1.5",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {company.latest_update.headline}
                      </p>
                    ) : (
                      <p
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "13px",
                          color: theme.textFaint,
                          margin: 0,
                          fontStyle: "italic",
                        }}
                      >
                        No updates yet
                      </p>
                    )}
                  </div>

                  {/* Right side: sentiment + change + action */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    {company.latest_update && (
                      <>
                        <span
                          style={{
                            fontFamily: "Courier New, monospace",
                            fontSize: "14px",
                            fontWeight: 700,
                            color:
                              SENTIMENT_COLORS[
                                company.latest_update.sentiment
                              ],
                          }}
                        >
                          {company.latest_update.change_percent > 0 ? "+" : ""}
                          {company.latest_update.change_percent.toFixed(2)}%
                        </span>
                        <span
                          style={{
                            fontFamily: "Courier New, monospace",
                            fontSize: "10px",
                            color:
                              SENTIMENT_COLORS[
                                company.latest_update.sentiment
                              ],
                            background: `${
                              SENTIMENT_COLORS[company.latest_update.sentiment]
                            }15`,
                            padding: "2px 8px",
                            borderRadius: "3px",
                            textTransform: "uppercase",
                          }}
                        >
                          {company.latest_update.sentiment}
                        </span>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewReport?.(company.company_id);
                      }}
                      style={{
                        padding: "4px 10px",
                        background: "none",
                        border: `1px solid ${theme.border}`,
                        borderRadius: "4px",
                        color: theme.textMuted,
                        fontFamily: "Courier New, monospace",
                        fontSize: "10px",
                        cursor: "pointer",
                        letterSpacing: "0.04em",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.accent;
                        e.currentTarget.style.color = theme.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.border;
                        e.currentTarget.style.color = theme.textMuted;
                      }}
                    >
                      {company.report_count} REPORTS
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Alerts tab */}
      {activeTab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: "64px",
                  background: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "8px",
                  animation: "pd-pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))
          ) : alerts.length === 0 ? (
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                background: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: "12px",
                fontFamily: "Georgia, serif",
                fontSize: "14px",
                color: theme.textMuted,
              }}
            >
              No alerts yet.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => markAlertRead(alert.id)}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px 14px",
                  background: alert.is_read ? theme.bgSecondary : `${theme.accent}08`,
                  border: `1px solid ${
                    alert.is_read ? theme.border : `${theme.accent}30`
                  }`,
                  borderLeft: `3px solid ${SEVERITY_COLORS[alert.severity]}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Courier New, monospace",
                        fontSize: "11px",
                        color: theme.accent,
                        fontWeight: 600,
                      }}
                    >
                      {alert.company_name}
                    </span>
                    <span
                      style={{
                        fontFamily: "Courier New, monospace",
                        fontSize: "10px",
                        color: theme.textFaint,
                      }}
                    >
                      {new Date(alert.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "13px",
                      color: alert.is_read ? theme.textMuted : theme.text,
                      margin: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    {alert.message}
                  </p>
                </div>
                {!alert.is_read && (
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: theme.accent,
                      flexShrink: 0,
                      marginTop: "4px",
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      <p
        style={{
          fontFamily: "Courier New, monospace",
          fontSize: "11px",
          color: theme.textFaint,
          marginTop: "20px",
          textAlign: "center",
        }}
      >
        Educational research only. Not financial advice.
      </p>

      <style>{`
        @keyframes pd-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}