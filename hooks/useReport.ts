import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import type { Report, ReportSection } from "@/types";

// ── REPORT LIST ────────────────────────────────────────────────
export function useReports(filters?: {
  search?: string;
  sector?: string;
  risk_level?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["reports", filters],
    queryFn: async () => {
      const res = await reportsApi.getAll({
        page: filters?.page || 1,
        q: filters?.search,
        sector: filters?.sector,
      });
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

// ── SINGLE REPORT ──────────────────────────────────────────────
export function useReport(reportId: string | null) {
  return useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const res = await reportsApi.getById(reportId);
      return res.data as Report;
    },
    enabled: !!reportId,
    staleTime: 1000 * 60 * 10,
  });
}

// ── REPORT SECTIONS ────────────────────────────────────────────
export function useReportSections(reportId: string | null) {
  return useQuery({
    queryKey: ["report-sections", reportId],
    queryFn: async () => {
      if (!reportId) return [];
      const res = await reportsApi.getSections(reportId);
      return res.data as ReportSection[];
    },
    enabled: !!reportId,
    staleTime: 1000 * 60 * 10,
  });
}

// ── RECENT REPORTS ─────────────────────────────────────────────
export function useRecentReports(limit = 5) {
  return useQuery({
    queryKey: ["recent-reports", limit],
    queryFn: async () => {
      // Uses dedicated /reports/recent endpoint — not getAll with client-side slice
      const res = await reportsApi.getRecent(limit);
      return res.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── REPORT ACCESS SESSION ──────────────────────────────────────
export function useReportAccess(reportId: string | null) {
  const [session, setSession] = useState<{
    session_id: string;
    watermark_text: string;
    user_email: string;
    signed_url?: string;
    expires_in: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestAccess() {
    if (!reportId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getSignedUrl(reportId);
      setSession(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to get report access"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (reportId) requestAccess();
  }, [reportId]);

  // Refresh session 2 minutes before expiry
  useEffect(() => {
    if (!session) return;
    const refreshIn = (session.expires_in - 120) * 1000;
    const timer = setTimeout(requestAccess, refreshIn);
    return () => clearTimeout(timer);
  }, [session]);

  return { session, loading, error, requestAccess };
}