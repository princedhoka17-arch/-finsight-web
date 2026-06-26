import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import type { User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    setUser,
    setPlan,
    setOnboardingCompleted,
  } = useAppStore();

  const [loading, setLoading] = useState(true);

  // ── Refs to prevent duplicate syncs ───────────────────────────
  // syncing:           prevents two concurrent sync calls
  // lastSyncedUid:     prevents re-syncing the same user within 30s
  // lastSyncTime:      timestamp of last successful sync
  // initialHandled:    ensures getSession and SIGNED_IN don't both sync
  const syncing          = useRef(false);
  const lastSyncedUid    = useRef<string | null>(null);
  const lastSyncTime     = useRef<number>(0);
  const initialHandled   = useRef(false);

  useEffect(() => {
    // ── 1. Get initial session ONCE ──────────────────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        initialHandled.current = true;
        syncAndFetchProfile(session);
      } else {
        setLoading(false);
      }
    });

    // ── 2. Listen for auth state changes ─────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Skip if getSession already handled this user
          // This prevents the double-call on page load
          if (
            initialHandled.current &&
            session.user.id === lastSyncedUid.current
          ) {
            console.log("[useAuth] SIGNED_IN skipped — already handled by getSession");
            return;
          }
          initialHandled.current = true;
          await syncAndFetchProfile(session);
        }

        if (event === "SIGNED_OUT") {
          lastSyncedUid.current  = null;
          lastSyncTime.current   = 0;
          initialHandled.current = false;
          setUser(null);
          setPlan("free");
          setOnboardingCompleted(false);
          setLoading(false);
          router.push("/login");
        }

        if (event === "TOKEN_REFRESHED" && session) {
          // Only re-fetch profile — do NOT re-sync on token refresh
          await fetchProfile(session.access_token);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      // Reset on unmount so re-mount (Strict Mode) works cleanly
      initialHandled.current = false;
    };
  }, []);

  // ── Sync + fetch — with deduplication guard ───────────────────
  async function syncAndFetchProfile(session: any) {
    const uid = session.user.id;
    const now = Date.now();

    // Guard 1 — already syncing
    if (syncing.current) {
      console.log("[useAuth] Sync skipped — already in progress");
      return;
    }

    // Guard 2 — same user synced within last 30 seconds
    if (
      lastSyncedUid.current === uid &&
      now - lastSyncTime.current < 30_000
    ) {
      console.log("[useAuth] Sync skipped — same user synced recently");
      // Still fetch profile in case store was cleared
      if (!user) await fetchProfile(session.access_token);
      else setLoading(false);
      return;
    }

    syncing.current = true;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          supabase_uid: uid,
          email:        session.user.email ?? "",
          full_name:
            session.user.user_metadata?.full_name ??
            session.user.email?.split("@")[0] ??
            "Investor",
        }),
      });

      if (!res.ok) throw new Error(`Sync ${res.status}`);

      // Mark this user as synced
      lastSyncedUid.current = uid;
      lastSyncTime.current  = Date.now();

    } catch (err) {
      console.warn("[useAuth] FastAPI sync failed — using Supabase fallback", err);

      const fallback: User = {
        id:                   uid,
        email:                session.user.email ?? "",
        full_name:
          session.user.user_metadata?.full_name ??
          session.user.email?.split("@")[0] ??
          "Investor",
        level:                "unknown",
        plan:                 "free",
        onboarding_completed: session.user.user_metadata?.onboarding_completed ?? false,
        created_at:           session.user.created_at ?? new Date().toISOString(),
      };
      setUser(fallback);
      setPlan("free");
      setOnboardingCompleted(fallback.onboarding_completed);

      // Still mark as synced so we don't loop
      lastSyncedUid.current = uid;
      lastSyncTime.current  = Date.now();

      setLoading(false);
      syncing.current = false;
      return;
    } finally {
      syncing.current = false;
    }

    await fetchProfile(session.access_token);
  }

  // ── Fetch profile from FastAPI ────────────────────────────────
  async function fetchProfile(accessToken?: string) {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Profile ${res.status}`);
      const profile: User = await res.json();
      setUser(profile);
      setPlan(profile.plan);
      setOnboardingCompleted(profile.onboarding_completed);
    } catch (err) {
      console.warn("[useAuth] Profile fetch failed — keeping existing state", err);
      if (!user) { setUser(null); setPlan("free"); }
    } finally {
      setLoading(false);
    }
  }

  // ── Complete onboarding ───────────────────────────────────────
  async function completeOnboarding(data: {
    level: string;
    selected_companies: string[];
    platform_pick_id?: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    const res = await fetch(`${API_URL}/auth/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) console.warn("[useAuth] Onboarding save failed:", res.status);

    setOnboardingCompleted(true);

    // Update Supabase metadata so fallback also shows completed
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });

    // Reset sync timer so next load re-fetches updated profile
    lastSyncTime.current = 0;

    router.push("/subscribe");
  }

  // ── Logout ─────────────────────────────────────────────────────
  async function logout() {
    lastSyncedUid.current  = null;
    lastSyncTime.current   = 0;
    initialHandled.current = false;
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setPlan("free");
    setOnboardingCompleted(false);
    setLoading(false);
    router.push("/login");
  }

  // ── Route guards ───────────────────────────────────────────────
  function requireAuth() {
    if (!loading && !isAuthenticated && !user) {
      router.push("/login");
    }
  }

  function requireOnboarding() {
    if (!loading && isAuthenticated && user && !user.onboarding_completed) {
      router.push("/onboarding");
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    logout,
    requireAuth,
    requireOnboarding,
    completeOnboarding,
    fetchProfile,
  };
}