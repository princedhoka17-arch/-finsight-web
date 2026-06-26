import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Finsight — AI Financial Research",
  description:
    "Simplified company reports and AI-powered financial insights for every investor.",
  keywords: "financial research, stock analysis, annual reports, AI investing",
};

// Blocking script that reads localStorage before first paint and applies
// the correct background color — eliminates the flash between the server-
// rendered body background and the user's saved theme.
const ANTI_FLASH_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('finsight-theme');
    if (!stored) return;
    var parsed = JSON.parse(stored);
    var id = parsed && parsed.state && parsed.state.themeId;
    var BG_MAP = {
      'classic-dark':  '#080b10',
      'dark-white':    '#0e0e0e',
      'ledger-light':  '#F7F4ED',
      'ledger-dark':   '#16140F',
    };
    var bg = BG_MAP[id];
    if (bg) document.body.style.background = bg;
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DM Sans + DM Serif Display — classic-dark & dark-white themes */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
        {/* IBM Plex Mono + Source Serif 4 — Ledger themes */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#080b10" }}>
        {/* Runs synchronously before paint — fixes theme flash */}
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}