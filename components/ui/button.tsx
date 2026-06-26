"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline-gold" | "outline" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-sans font-medium rounded-full cursor-pointer transition-all duration-200 outline-none border-none whitespace-nowrap select-none";

    const variants: Record<string, string> = {
      primary:
        "bg-[var(--brand-gold)] text-[var(--ink-inverse)] hover:bg-[#f0d050] hover:shadow-[0_0_24px_rgba(232,197,71,0.35)] hover:-translate-y-px active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]",
      ghost:
        "bg-transparent text-[var(--ink-secondary)] border border-[var(--surface-border)] hover:text-[var(--ink-primary)] hover:border-white/20 hover:bg-white/[0.04]",
      "outline-gold":
        "bg-transparent text-[var(--brand-gold)] border border-[rgba(232,197,71,0.4)] hover:bg-[var(--brand-gold-glow)] hover:border-[var(--brand-gold)] hover:shadow-[0_0_20px_rgba(232,197,71,0.2)]",
      outline:
        "bg-transparent text-[var(--ink-primary)] border border-[var(--surface-border)] hover:border-white/30 hover:bg-white/[0.04]",
      danger:
        "bg-[rgba(248,113,113,0.1)] text-[var(--danger)] border border-[rgba(248,113,113,0.3)] hover:bg-[rgba(248,113,113,0.15)]",
      success:
        "bg-[rgba(74,222,128,0.1)] text-[var(--success)] border border-[rgba(74,222,128,0.3)] hover:bg-[rgba(74,222,128,0.15)]",
    };

    const sizes: Record<string, string> = {
      sm: "text-xs px-4 py-1.5 h-8",
      md: "text-sm px-5 py-2 h-10",
      lg: "text-base px-7 py-3 h-12",
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={size === "sm" ? 12 : 15} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };

// ─── Spinner ──────────────────────────────────────────────────────
export function Spinner({ size = 15, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn("animate-spin shrink-0", className)}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle
        cx="8" cy="8" r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="28"
        strokeDashoffset="10"
        opacity="0.35"
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}