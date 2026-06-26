import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { watchlistApi, updatesApi, alertsApi } from "@/lib/api";
import type { WatchlistItem, DailyUpdate, Alert } from "@/types";
import { useAppStore } from "@/store/useAppStore";

// ── WATCHLIST ──────────────────────────────────────────────────
export function useWatchlist() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const res = await watchlistApi.getAll();
      return res.data as WatchlistItem[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const addMutation = useMutation({
    mutationFn: ({
      companyId,
      dailyUpdates,
    }: {
      companyId: string;
      dailyUpdates: boolean;
    }) =>
      // FIX: add() takes an object, not two separate args
      watchlistApi.add({
        company_id: companyId,
        daily_updates_enabled: dailyUpdates,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => watchlistApi.remove(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const toggleUpdatesMutation = useMutation({
    mutationFn: ({
      companyId,
      enabled,
    }: {
      companyId: string;
      enabled: boolean;
    }) =>
      // FIX: use toggleDailyUpdates — the correct method name
      watchlistApi.toggleDailyUpdates(companyId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  function isInWatchlist(companyId: string): boolean {
    return query.data?.some((w) => w.company_id === companyId) ?? false;
  }

  return {
    watchlist:      query.data ?? [],
    loading:        query.isLoading,
    error:          query.error,
    add:            addMutation.mutate,
    remove:         removeMutation.mutate,
    toggleUpdates:  toggleUpdatesMutation.mutate,
    isAdding:       addMutation.isPending,
    isRemoving:     removeMutation.isPending,
    isInWatchlist,
  };
}

// ── DAILY UPDATES ──────────────────────────────────────────────
export function useDailyUpdates() {
  return useQuery({
    queryKey: ["daily-updates"],
    queryFn: async () => {
      // FIX: getForUser() → getMy() — correct method name in updatesApi
      const res = await updatesApi.getMy();
      return res.data as DailyUpdate[];
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });
}

// ── ALERTS ─────────────────────────────────────────────────────
export function useAlerts() {
  const queryClient  = useQueryClient();
  const { setAlerts, markAlertRead } = useAppStore();

  const query = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res    = await alertsApi.getAll();
      const alerts = res.data as Alert[];
      setAlerts(alerts); // sync to global store for unread count badge
      return alerts;
    },
    staleTime:       1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  const markReadMutation = useMutation({
    mutationFn: (alertId: string) => alertsApi.markRead(alertId),
    onSuccess: (_, alertId) => {
      markAlertRead(alertId);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  return {
    alerts:      query.data ?? [],
    loading:     query.isLoading,
    markRead:    markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}