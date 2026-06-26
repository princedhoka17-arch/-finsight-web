import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser Client ───────────────────────────────────────────────────────────
// Uses createBrowserClient from @supabase/ssr so the session is stored
// in COOKIES — this is required for middleware to read the session
// server-side on every request.
// Previously used createClient with localStorage which middleware cannot read.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

// ── SERVER-SIDE CLIENT (for API routes only) ──────────────────────────────────
// Never import or use this on the client side.
// Uses service role key which has full DB access — never expose to browser.
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}