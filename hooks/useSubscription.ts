import { useAppStore } from "@/store/useAppStore";
import { PLAN_LIMITS } from "@/types/index";
import type { PlanType } from "@/types/index";

export function useSubscription() {
  const plan = useAppStore((state) => state.plan);

  const limits = PLAN_LIMITS[plan];

  function hasAccess(requiredPlan: PlanType): boolean {
    const rank: Record<PlanType, number> = {
      free: 0,
      beginner: 1,
      pay_per_report: 1,
      intermediate: 2,
    };
    return rank[plan] >= rank[requiredPlan];
  }

  function canAccessReport(reportRequiredPlan: PlanType): boolean {
    return hasAccess(reportRequiredPlan);
  }

  const isPro = plan === "intermediate";
  const isBeginner = plan === "beginner";
  const isFree = plan === "free";
  const isPPR = plan === "pay_per_report";

  return {
    plan,
    limits,
    hasAccess,
    canAccessReport,
    isPro,
    isBeginner,
    isFree,
    isPPR,
  };
}