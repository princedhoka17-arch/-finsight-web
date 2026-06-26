"use client";

import { useState, useEffect, useCallback } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { api } from "@/lib/api";

interface AuditItem {
  id: string;
  admin_email: string;
  action: string;
  target_table: string;
  target_id: string;
  timestamp: string;
}

function LoadingRow({ theme }: { theme: any }) {
  return <div style={{ height: 48, borderRadius: 2, background: theme.border, opacity: 0.3, marginBottom: 8 }} />;
}

export default function AdminAuditLogsPage() {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchAudit = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${p}&per_page=50`);
      const data = res.data;
      const newItems = data?.data ?? [];
      if (p === 1) {
        setAudit(newItems);
      } else {
        setAudit(prev => [...prev, ...newItems]);
      }
      setHasMore(!!data?.has_more);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) fetchAudit(1); }, [mounted, fetchAudit]);

  if (!mounted) return null;

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchAudit(next);
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24,
          fontWeight: "normal", color: theme.text, marginBottom: 6,
        }}>Audit log</h1>
        <p style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
          color: theme.textMuted, letterSpacing: "0.04em",
        }}>Every admin action, timestamped and attributed</p>
      </div>

      {loading && audit.length === 0 ? (
        <>{[1, 2, 3, 4, 5].map(i => <LoadingRow key={i} theme={theme} />)}</>
      ) : audit.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2 }}>
          <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 15, color: theme.textMuted }}>
            No audit logs yet. Admin actions will appear here.
          </p>
        </div>
      ) : (
        <>
          <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 2, overflow: "hidden" }}>
            {audit.map((log, i) => (
              <div key={log.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 18px",
                borderBottom: i < audit.length - 1 ? `1px solid ${theme.border}` : "none",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.accent, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, color: theme.text, margin: 0 }}>
                    <span style={{ color: theme.accent }}>{log.admin_email}</span>
                    {" — "}{log.action}
                  </p>
                  <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.textFaint, marginTop: 2 }}>
                    {log.target_table} · {log.target_id}
                  </p>
                </div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: theme.textFaint, flexShrink: 0 }}>
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button onClick={loadMore} disabled={loading} style={{
              display: "block", margin: "16px auto 0",
              background: "none", border: `1px solid ${theme.border}`, borderRadius: 2,
              padding: "8px 20px", fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
              color: theme.textMuted, cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
            }}>
              {loading ? "Loading…" : "Load more →"}
            </button>
          )}
        </>
      )}
    </div>
  );
}