import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "hero" | "metric-a" | "metric-b";

const variantClass: Record<Variant, string> = {
  hero: "surface-glow-hero",
  "metric-a": "surface-glow-metric-a",
  "metric-b": "surface-glow-metric-b",
};

export function GradientSurface({
  className,
  variant = "hero",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div
      className={cn(
        "surface-glow [&>*]:relative [&>*]:z-[1]",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
