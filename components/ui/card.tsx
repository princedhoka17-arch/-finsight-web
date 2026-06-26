import { cn } from "@/lib/utils";

// ─── Card ─────────────────────────────────────────────────────────
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  style?: React.CSSProperties;
}

export function Card({
  children,
  className,
  gold = false,
  padding = "md",
  hover = false,
  style,
}: CardProps) {
  const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
  return (
    <div
      className={cn(
        gold ? "glass-card-gold" : "glass-card",
        paddings[padding],
        hover && "transition-all duration-300 hover:border-[rgba(232,197,71,0.2)] hover:shadow-[0_0_24px_rgba(232,197,71,0.06)] cursor-pointer",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("rounded-lg animate-pulse", className)}
      style={{
        background: "linear-gradient(90deg, var(--surface-overlay) 25%, var(--surface-subtle) 50%, var(--surface-overlay) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </Card>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
export function Divider({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  if (!label) {
    return <div className={cn("divider my-4", className)} />;
  }
  return (
    <div className={cn("flex items-center gap-3 my-4", className)}>
      <div className="flex-1 divider" />
      <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
        {label}
      </span>
      <div className="flex-1 divider" />
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold shrink-0",
        sizes[size],
        className
      )}
      style={{
        background: "rgba(232,197,71,0.15)",
        color: "var(--brand-gold)",
        border: "1px solid rgba(232,197,71,0.2)",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <span className="text-4xl mb-4">{icon}</span>}
      <h3 className="font-sans font-semibold text-base mb-2" style={{ color: "var(--ink-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--ink-secondary)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
}: {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "flat";
  icon?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
          {label}
        </p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className="font-serif text-3xl mb-1" style={{ color: "var(--ink-primary)" }}>
        {value}
      </p>
      {change && (
        <p
          className="text-xs font-medium"
          style={{
            color:
              trend === "up"   ? "var(--success)"
              : trend === "down" ? "var(--danger)"
              : "var(--ink-muted)",
          }}
        >
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"} {change}
        </p>
      )}
    </Card>
  );
}