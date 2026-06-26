"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useThemeStore, applyThemeToDom } from "@/store/useThemeStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            retry: (failureCount, error: any) => {
              if ([401, 403, 404].includes(error?.response?.status)) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  // Apply persisted theme to DOM as early as possible after hydration.
  // This runs once on mount — the blocking inline script in layout.tsx
  // handles the pre-hydration flash prevention.
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--surface-overlay, rgba(8,12,24,0.95))",
            color: "var(--ink-primary, #E8E6DF)",
            border: "1px solid var(--surface-border, rgba(255,255,255,0.1))",
            fontFamily: "var(--font-sans, Georgia, serif)",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "var(--success, #5DCAA5)",
              secondary: "var(--surface-base, #080C18)",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--danger, #E24B4A)",
              secondary: "var(--surface-base, #080C18)",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}