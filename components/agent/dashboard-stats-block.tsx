"use client";

import { CardTitle } from "@/components/ui/card";
import { GradientSurface } from "@/components/ui/gradient-surface";
import { PeriodSelectButton } from "@/components/agent/period-select-button";
import { DashboardProgressStrip } from "@/components/agent/dashboard-plan-progress";
import { useDashboardRefresh } from "@/components/agent/dashboard-refresh-context";
import { GlowSkeleton } from "@/components/ui/empty-state";
import type { PeriodKey } from "@/lib/analytics/aggregates";
import type { Plan } from "@/types/database";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";

type Stats = {
  revenueAccrued: number;
  sales: number;
  conversion: number;
};

const periodHint: Record<PeriodKey, string> = {
  day: "за день",
  week: "за неделю",
  month: "за месяц",
};

export function DashboardStatsBlock({
  period,
  stats,
  plan,
  planSales,
}: {
  period: PeriodKey;
  stats: Stats;
  plan: Plan | null;
  planSales: number;
}) {
  const { isPending } = useDashboardRefresh();

  return (
    <div className="space-y-3">
      {isPending ? (
        <GlowSkeleton className="h-32 w-full" />
      ) : (
        <GradientSurface
          key={`hero-${period}`}
          variant="hero"
          className="metric-item p-5"
        >
          <CardTitle>Доход · {periodHint[period]}</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Начислено за выбранный период
          </p>
          <p className="mt-2 tabular-nums text-4xl font-semibold tracking-tight text-foreground sm:text-[2.75rem] sm:leading-none">
            {formatMoney(stats.revenueAccrued)}
          </p>
        </GradientSurface>
      )}

      {isPending ? (
        <div className="grid grid-cols-2 gap-2">
          <GlowSkeleton className="h-20" />
          <GlowSkeleton className="h-20" />
        </div>
      ) : (
        <div key={`metrics-${period}`} className="metric-grid grid grid-cols-2 gap-2">
          <GradientSurface
            variant="metric-a"
            className="metric-item metric-item-delay-1 p-3"
          >
            <CardTitle className="text-xs">Продажи</CardTitle>
            <p className="mt-1 tabular-nums text-xl font-semibold">
              {formatNumber(stats.sales)}
            </p>
          </GradientSurface>
          <GradientSurface
            variant="metric-b"
            className="metric-item metric-item-delay-2 p-3"
          >
            <CardTitle className="text-xs">Конверсия</CardTitle>
            <p className="mt-1 tabular-nums text-xl font-semibold">
              {formatPercent(stats.conversion)}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
              заявки → продажи
            </p>
          </GradientSurface>
        </div>
      )}

      <DashboardProgressStrip plan={plan} planSales={planSales} />

      <PeriodSelectButton active={period} />
    </div>
  );
}
