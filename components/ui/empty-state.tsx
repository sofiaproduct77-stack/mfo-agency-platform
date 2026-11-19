import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted/80",
        className,
      )}
    />
  );
}

export function GlowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-glow surface-glow border-0 shadow-none",
        className,
      )}
      aria-hidden
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="surface-flat flex flex-col items-center justify-center gap-3 border-dashed px-6 py-12 text-center">
      {Icon ? (
        <Icon
          className="h-12 w-12 text-muted-foreground/20"
          strokeWidth={1.25}
          aria-hidden
        />
      ) : null}
      <p className="text-base font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
