"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:brightness-110 active:scale-[0.98]",
  secondary:
    "bg-muted text-foreground border border-[var(--card-border)] hover:bg-[#1c1c1f]",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
  success:
    "bg-success text-white hover:brightness-110 active:scale-[0.98]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  loading,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all disabled:opacity-50",
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Загрузка…" : children}
    </button>
  );
}
