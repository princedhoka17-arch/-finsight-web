import { PlanType } from "@/types";

export const PLAN_NAMES: Record<PlanType, string> = {
  free: "Free",
  beginner: "Beginner",
  intermediate: "Intermediate",
  pay_per_report: "Pay Per Report",
};

export const PLAN_COLORS: Record<PlanType, string> = {
  free: "#888780",
  beginner: "#5DCAA5",
  intermediate: "#C9A84C",
  pay_per_report: "#7F77DD",
};

export const SECTORS = [
  "All Sectors",
  "Banking",
  "IT Services",
  "Conglomerate",
  "Automobiles",
  "Pharmaceuticals",
  "FMCG",
  "Energy",
  "Telecom",
  "Infrastructure",
  "Real Estate",
  "Metals",
];

export const RISK_COLORS = {
  Low:    { color: "#5DCAA5", bg: "rgba(93,202,165,0.12)",  border: "rgba(93,202,165,0.3)"  },
  Medium: { color: "#C9A84C", bg: "rgba(201,168,76,0.12)",  border: "rgba(201,168,76,0.3)"  },
  High:   { color: "#E24B4A", bg: "rgba(226,75,74,0.12)",   border: "rgba(226,75,74,0.3)"   },
};

export const SENTIMENT_COLORS = {
  Positive: { color: "#5DCAA5", bg: "rgba(93,202,165,0.12)",  border: "rgba(93,202,165,0.3)"  },
  Neutral:  { color: "#C9A84C", bg: "rgba(201,168,76,0.12)",  border: "rgba(201,168,76,0.3)"  },
  Cautious: { color: "#C9A84C", bg: "rgba(201,168,76,0.12)",  border: "rgba(201,168,76,0.3)"  },
  Negative: { color: "#E24B4A", bg: "rgba(226,75,74,0.12)",   border: "rgba(226,75,74,0.3)"   },
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  REPORTS: "/reports",
  REPORT: (id: string) => `/reports/${id}`,
  WATCHLIST: "/watchlist",
  REQUEST: "/request",
  SUBSCRIBE: "/subscribe",
  ADMIN: "/admin",
};

export const APP_CONFIG = {
  name: "Finsight",
  tagline: "AI-powered financial research for every investor",
  disclaimer: "Educational research only. Not financial advice.",
  supportEmail: "support@finsight.in",
  maxDevices: 2,
  sessionExpiry: 30, // minutes
  signedUrlExpiry: 30, // minutes
};