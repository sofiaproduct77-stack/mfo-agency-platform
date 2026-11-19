import { AppShell } from "@/components/layout/app-shell";
import { managerNav } from "@/components/layout/nav-config";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import {
  computeStats,
  periodBounds,
  type PeriodKey,
} from "@/lib/analytics/aggregates";
import {
  fetchApplicationsForAgents,
  fetchRewardsForAgents,
  fetchTeamAgentIds,
} from "@/lib/data/queries";
import { requireRole } from "@/lib/supabase/server";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
];

export default async function ManagerAnalyticsPage() {
  const profile = await requireRole(["manager"]);
  const agents = await fetchTeamAgentIds(profile.id);
  const agentIds = agents.map((a) => a.id);
  const [applications, rewards] = await Promise.all([
    fetchApplicationsForAgents(agentIds),
    fetchRewardsForAgents(agentIds),
  ]);

  return (
    <AppShell title="Аналитика" subtitle="Руководитель" nav={managerNav} variant="workspace">
      <div className="space-y-3">
        {PERIODS.map(({ key, label }) => {
          const stats = computeStats(
            applications,
            rewards,
            periodBounds(key),
          );
          return (
            <Card key={key}>
              <CardTitle>{label}</CardTitle>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Заявки</p>
                  <CardValue className="text-lg">
                    {formatNumber(stats.applicationCount)}
                  </CardValue>
                </div>
                <div>
                  <p className="text-muted-foreground">Продажи</p>
                  <CardValue className="text-lg">
                    {formatNumber(stats.sales)}
                  </CardValue>
                </div>
                <div>
                  <p className="text-muted-foreground">Конверсия</p>
                  <CardValue className="text-lg">
                    {formatPercent(stats.conversion)}
                  </CardValue>
                </div>
                <div>
                  <p className="text-muted-foreground">Средний доход</p>
                  <CardValue className="text-lg">
                    {formatMoney(stats.avgPerSale)}
                  </CardValue>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
