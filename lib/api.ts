import axios from "axios";
import { supabase } from "./supabase";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── REQUEST INTERCEPTOR — attach Supabase JWT on every request ────
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    // no session — request goes without token
  }
  return config;
});

// ── RESPONSE INTERCEPTOR — handle auth errors globally ────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════
// AUTH   /auth
// ═══════════════════════════════════════════════════════════════════
export const authApi = {
  sync: (data: {
    supabase_uid: string;
    email: string;
    full_name: string;
  }) => api.post("/auth/sync", data),

  getProfile: () => api.get("/auth/profile"),

  updateProfile: (data: {
    full_name?: string;
    avatar_url?: string;
    theme_id?: string;
  }) => api.patch("/auth/profile", data),

  completeOnboarding: (data: {
    level: string;
    selected_companies: string[];
    platform_pick_id?: string;
  }) => api.post("/auth/onboarding", data),

  getDashboardStats: () => api.get("/auth/dashboard-stats"),
};

// ═══════════════════════════════════════════════════════════════════
// REPORTS   /reports
// ═══════════════════════════════════════════════════════════════════
export const reportsApi = {
  getAll: (params?: {
    page?: number;
    per_page?: number;
    q?: string;
    sector?: string;
    report_type?: string;
    risk_level?: string;
    sort?: string;
  }) => api.get("/reports", { params }),

  getRecent: (limit = 5) =>
    api.get("/reports/recent", { params: { limit } }),

  getById: (id: string) => api.get(`/reports/${id}`),

  getAccess: (id: string) => api.get(`/reports/${id}/access`),

  getSignedUrl: (id: string) => api.get(`/api/reports/${id}/signed-url`),

  getByCompany: (companyId: string) =>
    api.get(`/reports/company/${companyId}`),

  getSections: (id: string) => api.get(`/reports/${id}/sections`),

  // FIX: was "/companies/search" — route lives under the reports router
  searchCompanies: (query: string, page = 1, perPage = 10) =>
    api.get("/reports/companies/search", {
      params: { q: query, page, per_page: perPage },
    }),
};

// ═══════════════════════════════════════════════════════════════════
// CHAT   /chat
// NOTE: POST /chat is SSE — use raw fetch in components, not axios.
//       Only history (non-streaming) goes through axios here.
// ═══════════════════════════════════════════════════════════════════
export const chatApi = {
  getHistory: (reportId: string, sessionId?: string) =>
    api.get("/chat/history", {
      params: { report_id: reportId, session_id: sessionId },
    }),
};

// ═══════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS   /subscriptions
// ═══════════════════════════════════════════════════════════════════
export const subscriptionsApi = {
  getStatus: () => api.get("/subscriptions/status"),

  createOrder: (data: {
    plan: string;
    billing_cycle: "monthly" | "yearly";
  }) => api.post("/subscriptions/create-order", data),

  verify: (data: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    plan: string;
    billing_cycle: "monthly" | "yearly";
  }) => api.post("/subscriptions/verify", data),

  cancel: () => api.post("/subscriptions/cancel"),

  webhook: (data: unknown) => api.post("/subscriptions/webhook", data),
};

// ═══════════════════════════════════════════════════════════════════
// WATCHLIST   /watchlist
// ═══════════════════════════════════════════════════════════════════
export const watchlistApi = {
  getAll: () => api.get("/watchlist"),

  add: (data: {
    company_id: string;
    daily_updates_enabled?: boolean;
  }) => api.post("/watchlist", data),

  remove: (itemId: string) => api.delete(`/watchlist/${itemId}`),

  toggleDailyUpdates: (itemId: string, enabled: boolean) =>
    api.patch(`/watchlist/${itemId}/daily-updates`, { enabled }),

  getAlerts: () => api.get("/watchlist/alerts"),

  markAlertRead: (alertId: string) =>
    api.patch(`/watchlist/alerts/${alertId}/read`),
};

// ═══════════════════════════════════════════════════════════════════
// REQUESTS   /requests
// ═══════════════════════════════════════════════════════════════════
export const requestsApi = {
  getMy: () => api.get("/requests/my"),

  submit: (data: {
    company_name: string;
    ticker?: string;
    exchange?: string;
    message?: string;
  }) => api.post("/requests", data),

  getById: (requestId: string) => api.get(`/requests/${requestId}`),
};

// ═══════════════════════════════════════════════════════════════════
// DAILY UPDATES   /watchlist/daily-updates
// ═══════════════════════════════════════════════════════════════════
export const updatesApi = {
  getMy: (limit = 4) =>
    api.get("/watchlist/daily-updates", { params: { limit } }),
};

// ═══════════════════════════════════════════════════════════════════
// ALERTS   /watchlist/alerts
// ═══════════════════════════════════════════════════════════════════
export const alertsApi = {
  getAll: () => api.get("/watchlist/alerts"),
  markAllRead: () => api.patch("/watchlist/alerts/read-all"),

  markRead: (alertId: string) =>
    api.patch(`/watchlist/alerts/${alertId}/read`),
};

// ═══════════════════════════════════════════════════════════════════
// ADMIN   /admin
// ═══════════════════════════════════════════════════════════════════
export const adminApi = {
  getStats: () => api.get("/admin/stats"),

  getUsers: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    plan?: string;
  }) => api.get("/admin/users", { params }),

  updateUserPlan: (userId: string, plan: string) =>
    api.patch(`/admin/users/${userId}/plan`, null, { params: { plan } }),

  getReports: (params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }) => api.get("/admin/reports", { params }),

  uploadPdf: (formData: FormData) =>
    api.post("/admin/reports/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getSignedPdfUrl: (reportId: string) =>
    api.get(`/admin/reports/${reportId}/signed-pdf-url`),

  processAI: (reportId: string) =>
    api.post(`/admin/reports/${reportId}/process-ai`),

  getDailyUpdates: (params?: { status?: string; page?: number }) =>
    api.get("/admin/daily-updates", { params }),

  reviewDailyUpdate: (
    updateId: string,
    data: {
      action: string;
      headline?: string;
      content?: string;
      sentiment?: string;
    }
  ) => api.patch(`/admin/daily-updates/${updateId}`, data),

  getRequests: (params?: { status?: string; page?: number }) =>
    api.get("/admin/requests", { params }),

  updateRequest: (
    requestId: string,
    data: { new_status: string; admin_note?: string }
  ) => api.patch(`/admin/requests/${requestId}`, null, { params: data }),

  getAuditLogs: (params?: { page?: number; per_page?: number }) =>
    api.get("/admin/audit-logs", { params }),
};