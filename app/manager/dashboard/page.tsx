import { AppShell } from "@/components/layout/app-shell";
import { managerNav } from "@/components/layout/nav-config";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  agentLeaderboard,
  buildDailySeries,
  computeStats,
  periodBounds,
} from "@/lib/analytics/aggregates";
import {
  fetchApplicationsForAgents,
  fetchRewardsForAgents,
  fetchTeamAgentIds,
} from "@/lib/data/queries";
import { requireRole } from "@/lib/supabase/server";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";

export default async function ManagerDashboardPage() {
  const profile = await requireRole(["manager"]);
  const agents = await fetchTeamAgentIds(profile.id);
  const agentIds = agents.map((a) => a.id);
  const [applications, rewards] = await Promise.all([
    fetchApplicationsForAgents(agentIds),
    fetchRewardsForAgents(agentIds),
  ]);

  const month = periodBounds("month");
  const stats = computeStats(applications, rewards, month);
  const chart = buildDailySeries(applications, rewards);
  const names = new Map(agents.map((a) => [a.id, a.full_name]));
  const leaderboard = agentLeaderboard(applications, rewards, names, month).slice(
    0,
    5,
  );

  return (
    <AppShell
      title="Команда"
      subtitle="Руководитель"
      nav={managerNav}
      variant="workspace"
    >
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardTitle>Агентов</CardTitle>
          <CardValue>{formatNumber(agents.length)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Продажи</CardTitle>
          <CardValue>{formatNumber(stats.sales)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Заявки</CardTitle>
          <CardValue>{formatNumber(stats.applicationCount)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Доход команды</CardTitle>
          <CardValue>{formatMoney(stats.revenueAccrued)}</CardValue>
        </Card>
      </div>

      <Card>
        <CardTitle>Конверсия</CardTitle>
        <CardValue>{formatPercent(stats.conversion)}</CardValue>
      </Card>

      <Card>
        <CardTitle>Динамика продаж</CardTitle>
        <div className="mt-3">
          <RevenueChart data={chart} />
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Рейтинг агентов
        </h2>
        {leaderboard.length === 0 ? (
          <EmptyState title="Нет активных агентов" />
        ) : (
          <ul className="space-y-2">
            {leaderboard.map((row, index) => (
              <li
                key={row.agentId}
                className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-card px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium">{row.name}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{row.sales} продаж</p>
                  <p>{formatMoney(row.revenue)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
