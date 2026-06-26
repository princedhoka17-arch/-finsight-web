export type UserLevel = "beginner" | "intermediate" | "unknown";
export type PlanType = "free" | "beginner" | "intermediate" | "pay_per_report";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  level: UserLevel;
  plan: PlanType;
  plan_expires_at?: string;
  onboarding_completed: boolean;
  is_admin?: boolean;
  role?: "super_admin" | "editor" | "viewer";
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  level: UserLevel;
  selected_companies: string[];
  platform_pick_id?: string;
  daily_update_companies: string[];
  onboarding_completed: boolean;
}

export type RiskLevel = "Low" | "Medium" | "High";

export interface Company {
  id: string;
  name: string;
  ticker: string;
  exchange: "BSE" | "NSE";
  sector: string;
  description: string;
  logo_url?: string;
  market_cap?: string;
  is_platform_pick: boolean;
  is_active: boolean;
  created_at: string;
}

export type ReportType =
  | "annual_report"
  | "quarterly"
  | "concall"
  | "research_note";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  annual_report: "Annual Report",
  quarterly:     "Quarterly Report",
  concall:       "Earnings Call",
  research_note: "Research Note",
};

export type ReportStatus = "draft" | "published" | "archived";

export interface Report {
  id: string;
  company_id: string;
  company: Company;
  report_type: ReportType;
  fiscal_year: string;
  title: string;
  status: ReportStatus;
  risk_level: RiskLevel;
  ai_score?: number;
  summary: string;
  required_plan: PlanType;
  published_at?: string;
  created_at: string;
  sections?: ReportSection[];
}

export interface ParagraphBlock { type: "paragraph"; text: string; }
export interface HeadingBlock   { type: "heading";   text: string; }
export interface SummaryBlock   { type: "summary";   text: string; }
export interface MetricItem {
  label:      string;
  value:      string;
  change?:    string;
  direction?: "up" | "down";
  sentiment?: "good" | "bad" | "neutral";
}
export interface MetricBlock    { type: "metric";     items: MetricItem[]; }
export interface RiskFlagBlock  { type: "risk_flag";  level: "low"|"medium"|"high"; title: string; text: string; }
export interface QuoteBlock     { type: "quote";      text: string; speaker?: string; }
export interface WatchItemBlock { type: "watch_item"; text: string; }

export type SectionBlock =
  | ParagraphBlock | HeadingBlock | SummaryBlock
  | MetricBlock | RiskFlagBlock | QuoteBlock | WatchItemBlock;

export interface SectionContent {
  blocks: SectionBlock[];
  legacy?: boolean;
}

export interface ReportSection {
  id: string;
  report_id: string;
  section_type:
    | "overview" | "financials" | "risks" | "growth"
    | "debt" | "news" | "beginner_summary" | "beginner_cards" | "general";
  title: string;
  content: SectionContent;
  order_index: number;
}

export interface ReportAccess {
  report_id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  watermark_text: string;
}

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "grace"
  | "cancelled"
  | "expired";

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  amount: number;
  billing_cycle: "monthly" | "yearly";
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  company_id: string;
  company: Company;
  daily_updates_enabled: boolean;
  added_at: string;
}

export type UpdateStatus = "pending" | "approved" | "rejected" | "sent";
export type UpdateSentiment = "Positive" | "Neutral" | "Cautious" | "Negative";

export interface DailyUpdate {
  id: string;
  company_id: string;
  company: Company;
  headline: string;
  content: string;
  key_phrases: string[];
  watch_for?: string;
  sentiment: UpdateSentiment;
  change_percent?: number;
  tags: string[];
  status: UpdateStatus;
  ai_generated: boolean;
  admin_edited: boolean;
  is_alert_worthy: boolean;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export type RequestStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "rejected";

export interface CompanyRequest {
  id: string;
  user_id: string;
  company_name: string;
  ticker?: string;
  exchange?: string;
  message?: string;
  status: RequestStatus;
  admin_note?: string;
  created_at: string;
}

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";
export type PaymentType =
  | "subscription"
  | "per_report"
  | "daily_update_addon";

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  status: PaymentStatus;
  type: PaymentType;
  plan?: PlanType;
  report_id?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  session_id: string;
  report_id: string;
  company_name: string;
  messages: ChatMessage[];
}

// FIX: added "daily_update" and "broadcast" — broadcast alerts from admin
// were failing TypeScript build and causing 500s on GET /watchlist/alerts
export type AlertType =
  | "earnings"
  | "risk"
  | "news"
  | "management"
  | "price"
  | "report_published"
  | "daily_update"
  | "broadcast";

export interface Alert {
  id: string;
  user_id: string;
  company_id?: string;       // optional — null for broadcast alerts
  company_name: string;
  alert_type: AlertType;
  message: string;
  is_read: boolean;
  severity: "low" | "medium" | "high";
  created_at: string;
}

export type AdminRole = "super_admin" | "editor" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_table: string;
  target_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface PlanLimits {
  report_limit: number;
  user_picks: number;
  platform_picks: number;
  platform_pick_options: number;
  watchlist_limit: number;
  daily_updates_included: number;
  daily_update_addon_price: number;
  ai_questions_per_report: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    report_limit: 1,
    user_picks: 0,
    platform_picks: 0,
    platform_pick_options: 0,
    watchlist_limit: 0,
    daily_updates_included: 0,
    daily_update_addon_price: 0,
    ai_questions_per_report: 3,
  },
  beginner: {
    report_limit: 5,
    user_picks: 4,
    platform_picks: 1,
    platform_pick_options: 3,
    watchlist_limit: 5,
    daily_updates_included: 0,
    daily_update_addon_price: 79,
    ai_questions_per_report: 20,
  },
  intermediate: {
    report_limit: 13,
    user_picks: 11,
    platform_picks: 2,
    platform_pick_options: 6,
    watchlist_limit: 15,
    daily_updates_included: 3,
    daily_update_addon_price: 39,
    ai_questions_per_report: -1,
  },
  pay_per_report: {
    report_limit: 1,
    user_picks: 1,
    platform_picks: 0,
    platform_pick_options: 0,
    watchlist_limit: 0,
    daily_updates_included: 0,
    daily_update_addon_price: 0,
    ai_questions_per_report: 10,
  },
};

export const PLAN_PRICES = {
  beginner:       { monthly: 249,  yearly: 2499 },
  intermediate:   { monthly: 799,  yearly: 7999 },
  pay_per_report: { one_time: 149 },
};
