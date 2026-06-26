import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, PlanType, Alert, WatchlistItem } from "@/types/index";

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  plan: PlanType;
  setPlan: (plan: PlanType) => void;

  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;

  alerts: Alert[];
  unreadCount: number;
  setAlerts: (alerts: Alert[]) => void;
  markAlertRead: (id: string) => void;

  watchlist: WatchlistItem[];
  setWatchlist: (items: WatchlistItem[]) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      plan: "free" as PlanType,
      setPlan: (plan) => set({ plan }),

      onboardingCompleted: false,
      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

      alerts: [],
      unreadCount: 0,
      setAlerts: (alerts) =>
        set({
          alerts,
          unreadCount: alerts.filter((a) => !a.is_read).length,
        }),
      markAlertRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, is_read: true } : a
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      watchlist: [],
      setWatchlist: (items) => set({ watchlist: items }),

      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
    }),
    {
      name: "finsight-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);   