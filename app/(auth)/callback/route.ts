/**
 * app/(auth)/callback/route.ts
 *
 * Handles Supabase email confirmation redirect.
 *
 * FIX: The previous version passed access_token + refresh_token as URL hash
 * fragments. With @supabase/ssr + createBrowserClient, sessions are stored
 * in COOKIES — not localStorage or URL fragments. The browser client cannot
 * pick up hash fragments, so users landed on a broken session after confirming
 * their email.
 *
 * Correct approach: use createServerClient to exchange the code and write
 * the session into cookies, then redirect cleanly.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (!code) {
    console.error("[auth/callback] No code param — bad confirmation link");
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  // Use createServerClient so the session is written into cookies
  // This is what createBrowserClient (in lib/supabase.ts) will read
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Code exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=confirmation_failed&message=${encodeURIComponent(
        error.message
      )}`
    );
  }

  // Session is now in cookies — redirect cleanly, no hash fragments needed
  return NextResponse.redirect(`${origin}${next}`);
}