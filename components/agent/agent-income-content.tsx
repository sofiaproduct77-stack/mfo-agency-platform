import { CardTitle, CardValue } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientSurface } from "@/components/ui/gradient-surface";
import { IncomeSalesChart } from "@/components/agent/income-sales-chart";
import { RewardsList } from "@/components/agent/rewards-list";
import type { IncomeTab } from "@/components/agent/income-sub-nav";
import type { PromoEvent } from "@/lib/data/queries";
import type { Reward } from "@/types/database";
import { formatMoney, formatShortDate } from "@/lib/utils";
import { Gift, Wallet } from "lucide-react";

type Stats = {
  revenueAccrued: number;
  revenuePaid: number;
};

type ChartPoint = { label: string; revenue: number; sales: number };

export function AgentIncomeContent({
  tab,
  monthStats,
  rewards,
  promoEvents,
  salesChart,
}: {
  tab: IncomeTab;
  monthStats: Stats;
  rewards: Reward[];
  promoEvents: PromoEvent[];
  salesChart: ChartPoint[];
}) {
  if (tab === "events") {
    const hasPromo = promoEvents.length > 0;

    if (!hasPromo) {
      return (
        <EmptyState
          icon={Gift}
          title="Событий пока нет"
          description="Здесь появятся акции с дополнительным вознаграждением. Прогресс по плану — на главной."
        />
      );
    }

    return (
      <div className="space-y-3">
        {promoEvents.map((event) => (
          <article key={event.id} className="surface-flat px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{event.title}</p>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
                +{formatMoney(Number(event.reward_amount))}
              </span>
            </div>
            {event.description ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {event.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              до {formatShortDate(event.period_end)}
            </p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <GradientSurface variant="metric-a" className="p-4">
          <CardTitle>Начислено</CardTitle>
          <CardValue className="text-xl">
            {formatMoney(monthStats.revenueAccrued)}
          </CardValue>
        </GradientSurface>
        <GradientSurface variant="metric-b" className="p-4">
          <CardTitle>Выплачено</CardTitle>
          <CardValue className="text-xl">
            {formatMoney(monthStats.revenuePaid)}
          </CardValue>
        </GradientSurface>
      </div>
      {rewards.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Начислений пока нет"
          description="Появятся после подтверждённой продажи по офферу."
        />
      ) : (
        <RewardsList rewards={rewards} />
      )}

      <IncomeSalesChart data={salesChart} />
    </div>
  );
}
