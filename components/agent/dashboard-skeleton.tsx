import { Skeleton } from "@/components/ui/empty-state";

export function DashboardMetricsSkeleton() {
  return (
    <>
      <Skeleton className="h-32 w-full rounded-[var(--radius-xl)]" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-20 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-20 rounded-[var(--radius-xl)]" />
      </div>
      <Skeleton className="h-12 w-full rounded-[var(--radius-xl)]" />
    </>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="space-y-3">
      <DashboardMetricsSkeleton />
    </div>
  );
}
