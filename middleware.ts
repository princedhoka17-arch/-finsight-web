import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/signup"];

// Routes that require authentication
// NOTE: /onboarding is intentionally NOT here —
// new users are authenticated but haven't completed onboarding yet
const PROTECTED_ROUTES = [
  "/dashboard",
  "/reports",
  "/watchlist",
  "/subscribe",
  "/request",
  "/updates",  // ← added: app/(dashboard)/updates/page.tsx
  "/profile",  // ← added: app/(dashboard)/profile/page.tsx
  "/admin",
];

// Routes that require authentication but allow incomplete onboarding
const ONBOARDING_ALLOWED = ["/onboarding", "/subscribe"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes and auth callback
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // Rule 1: Logged-in user visiting login/signup → redirect to dashboard
  if (isAuthenticated && AUTH_ROUTES.some(r => pathname === r)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rule 2: Unauthenticated user on protected route → redirect to login
  const isProtected = PROTECTED_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + "/")
  );

  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rule 3: Unauthenticated user on /onboarding → redirect to login
  if (!isAuthenticated && ONBOARDING_ALLOWED.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webop)$).*)",
  ],
};