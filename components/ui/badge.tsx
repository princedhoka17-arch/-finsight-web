import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "gold"
  | "teal"
  | "red"
  | "green"
  | "muted"
  | "outline"
  | "warning";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  gold: {
    background: "rgba(232,197,71,0.10)",
    color: "var(--brand-gold)",
    border: "1px solid rgba(232,197,71,0.20)",
  },
  teal: {
    background: "rgba(45,212,191,0.10)",
    color: "var(--brand-teal)",
    border: "1px solid rgba(45,212,191,0.20)",
  },
  red: {
    background: "rgba(248,113,113,0.10)",
    color: "var(--danger)",
    border: "1px solid rgba(248,113,113,0.20)",
  },
  green: {
    background: "rgba(74,222,128,0.10)",
    color: "var(--success)",
    border: "1px solid rgba(74,222,128,0.20)",
  },
  warning: {
    background: "rgba(251,191,36,0.10)",
    color: "var(--warning)",
    border: "1px solid rgba(251,191,36,0.20)",
  },
  muted: {
    background: "rgba(138,150,168,0.10)",
    color: "var(--ink-muted)",
    border: "1px solid var(--surface-border)",
  },
  outline: {
    background: "transparent",
    color: "var(--ink-secondary)",
    border: "1px solid var(--surface-border)",
  },
};

const dotColors: Record<BadgeVariant, string> = {
  gold:    "var(--brand-gold)",
  teal:    "var(--brand-teal)",
  red:     "var(--danger)",
  green:   "var(--success)",
  warning: "var(--warning)",
  muted:   "var(--ink-muted)",
  outline: "var(--ink-muted)",
};

export function Badge({
  variant = "muted",
  children,
  className,
  dot = false,
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase",
        className
      )}
      style={variantStyles[variant]}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", pulse && "animate-pulse-glow")}
          style={{ background: dotColors[variant] }}
        />
      )}
      {children}
    </span>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────
export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, BadgeVariant> = {
    free:    "muted",
    pro:     "gold",
    premium: "teal",
    admin:   "red",
  };
  return <Badge variant={map[plan] ?? "muted"}>{plan}</Badge>;
}

// ─── Risk Badge ───────────────────────────────────────────────────
export function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const map: Record<string, BadgeVariant> = {
    low:    "green",
    medium: "warning",
    high:   "red",
  };
  const labels = { low: "Low Risk", medium: "Med Risk", high: "High Risk" };
  return <Badge variant={map[level]}>{labels[level]}</Badge>;
}