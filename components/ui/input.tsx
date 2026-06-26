"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Input ────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, fullWidth, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: "var(--ink-secondary)" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--ink-muted)" }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input-base",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              error && "border-[rgba(248,113,113,0.5)] focus:border-[rgba(248,113,113,0.7)] focus:shadow-[0_0_0_3px_rgba(248,113,113,0.08)]",
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
export { Input };

// ─── PasswordInput ────────────────────────────────────────────────
export interface PasswordInputProps extends Omit<InputProps, "type" | "rightElement"> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [show, setShow] = useState(false);
    return (
      <Input
        ref={ref}
        type={show ? "text" : "password"}
        rightElement={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-xs font-medium transition-colors"
            style={{ color: "var(--ink-muted)" }}
            tabIndex={-1}
          >
            {show ? "Hide" : "Show"}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// ─── Textarea ─────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium" style={{ color: "var(--ink-secondary)" }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "input-base resize-none min-h-[100px]",
            error && "border-[rgba(248,113,113,0.5)]",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
        {hint && !error && <p className="text-xs" style={{ color: "var(--ink-muted)" }}>{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";