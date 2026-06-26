import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export function Footer() {
  const FOOTER_LINKS = [
    {
      heading: "Product",
      links: [
        { label: "Features",   href: "#features" },
        { label: "Pricing",    href: "#pricing" },
        { label: "Companies",  href: "#companies" },
        { label: "Blog",       href: "#" },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "Sign in",    href: ROUTES.LOGIN },
        { label: "Sign up",    href: ROUTES.SIGNUP },
        { label: "Dashboard",  href: ROUTES.DASHBOARD },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy",     href: "#" },
        { label: "Terms",       href: "#" },
        { label: "Disclaimer",  href: "#" },
      ],
    },
  ];

  return (
    <footer
      style={{
        background: "var(--surface-raised)",
        borderTop: "1px solid var(--surface-border)",
      }}
    >
      <div className="container py-14">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href={ROUTES.HOME}>
              <span
                className="font-serif italic text-2xl"
                style={{ color: "var(--brand-gold)" }}
              >
                FinSight
              </span>
            </Link>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              AI-powered financial research for every Indian investor. Annual
              reports simplified in seconds.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-4">
              {["𝕏", "in", "▶"].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: "var(--surface-overlay)",
                    color: "var(--ink-muted)",
                    border: "1px solid var(--surface-border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--ink-primary)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--ink-muted)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--surface-border)";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-10">
            {FOOTER_LINKS.map((col) => (
              <div key={col.heading}>
                <p
                  className="text-xs font-semibold tracking-widest uppercase mb-4"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {col.heading}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm transition-colors"
                        style={{ color: "var(--ink-secondary)" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.color = "var(--ink-primary)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.color = "var(--ink-secondary)")
                        }
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--surface-border)" }}
        >
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            © {new Date().getFullYear()} FinSight Technologies Pvt. Ltd. — For
            informational purposes only. Not SEBI-registered investment advice.
          </p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Built with ❤️ in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}