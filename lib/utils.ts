import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReportType } from "@/types";
type PlanId   = "free" | "pro" | "premium";
type UserRole = "admin" | "user";

// ─── Class Name Merger ────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatter ───────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency = "INR",
  compact = false
): string {
  if (compact && amount >= 1_00_00_000) {
    return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
  }
  if (compact && amount >= 1_00_000) {
    return `₹${(amount / 1_00_000).toFixed(1)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Date Formatters ──────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);

  if (minutes < 1)  return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days < 7)     return `${days}d ago`;
  return formatDate(dateStr);
}

// ─── Report Type Label ────────────────────────────────────────────
export function getReportTypeLabel(type: ReportType): string {
  const map: Record<ReportType, string> = {
    annual_report:  "Annual Report",
    quarterly:      "Quarterly Report",
    concall:        "Earnings Call",
    research_note:  "Research Note",
  };
  return map[type] ?? type;
}

// ─── Plan Helpers ─────────────────────────────────────────────────
export function canAccessReports(role: UserRole, plan: PlanId): boolean {
  return plan !== "free" || role === "admin";
}

export function canUseChat(plan: PlanId): boolean {
  return plan === "pro" || plan === "premium";
}

export function canUseWatchlist(plan: PlanId): boolean {
  return plan === "pro" || plan === "premium";
}

export function getPlanColor(plan: PlanId): string {
  const map: Record<PlanId, string> = {
    free:    "#8a96a8",
    pro:     "#e8c547",
    premium: "#2dd4bf",
  };
  return map[plan];
}

// ─── String Helpers ───────────────────────────────────────────────
export function truncate(str: string, length = 120): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + "…";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─── Validation ───────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

// ─── Number Helpers ───────────────────────────────────────────────
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Risk Level ───────────────────────────────────────────────────
export function getRiskColor(level: "low" | "medium" | "high"): string {
  return { low: "#4ade80", medium: "#fbbf24", high: "#f87171" }[level];
}

export function getRiskLabel(level: "low" | "medium" | "high"): string {
  return { low: "Low Risk", medium: "Moderate Risk", high: "High Risk" }[level];
}

// ─── Local Storage ────────────────────────────────────────────────
export const storage = {
  get: (key: string) => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(key) ?? "null"); }
    catch { return null; }
  },
  set: (key: string, value: unknown) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};

// ─── Delay ───────────────────────────────────────────────────────
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));