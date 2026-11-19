import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { agentNav } from "@/components/layout/nav-config";
import { DashboardStatsBlock } from "@/components/agent/dashboard-stats-block";
import { DashboardRefreshProvider } from "@/components/agent/dashboard-refresh-context";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { ClipboardList } from "lucide-react";
import {
  computeStats,
  countPlanSales,
  periodBounds,
  type PeriodKey,
} from "@/lib/analytics/aggregates";
import {
  fetchApplicationsForAgents,
  fetchCurrentPlan,
  fetchRewardsForAgents,
} from "@/lib/data/queries";
import { requireRole } from "@/lib/supabase/server";
import {
  displayGivenNameFromFio,
  formatDateTime,
} from "@/lib/utils";

function parsePeriod(value: string | undefined): PeriodKey {
  if (value === "day" || value === "week" || value === "month") return value;
  return "month";
}

type Props = { searchParams: Promise<{ period?: string }> };

export default async function AgentDashboardPage({ searchParams }: Props) {
  const profile = await requireRole(["agent"]);
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);

  const [applications, rewards, plan] = await Promise.all([
    fetchApplicationsForAgents([profile.id]),
    fetchRewardsForAgents([profile.id]),
    fetchCurrentPlan(profile.id),
  ]);

  const planSales = plan ? countPlanSales(applications, plan) : 0;

  const range = periodBounds(period);
  const stats = computeStats(applications, rewards, range);
  const recent = applications
    .filter((a) => a.status !== "link_click")
    .slice(0, 5);

  return (
    <AppShell
      title={displayGivenNameFromFio(profile.full_name)}
      subtitle="Агент"
      nav={agentNav}
      pullToRefresh
    >
      <DashboardRefreshProvider>
        <DashboardStatsBlock
          period={period}
          stats={stats}
          plan={plan}
          planSales={planSales}
        />
      </DashboardRefreshProvider>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Последние операции
        </h2>
        {recent.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Пока нет операций"
            description="Откройте офферы и поделитесь персональной ссылкой."
            action={
              <Link
                href="/agent/offers"
                className="text-sm font-medium text-accent"
              >
                Офферы
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {recent.map((app, index) => (
              <li
                key={app.id}
                className="list-item-enter surface-flat flex items-center justify-between gap-3 px-3 py-3"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {app.offers?.product_name ?? "Оффер"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(app.created_at)}
                  </p>
                </div>
                <StatusPill status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
