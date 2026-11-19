import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { managerNav } from "@/components/layout/nav-config";
import { EmptyState } from "@/components/ui/empty-state";
import { computeStats, periodBounds } from "@/lib/analytics/aggregates";
import {
  fetchApplicationsForAgents,
  fetchRewardsForAgents,
  fetchTeamAgentIds,
} from "@/lib/data/queries";
import { requireRole } from "@/lib/supabase/server";
import { formatMoney, formatNumber } from "@/lib/utils";

export default async function ManagerAgentsPage() {
  const profile = await requireRole(["manager"]);
  const agents = await fetchTeamAgentIds(profile.id);
  const agentIds = agents.map((a) => a.id);
  const [applications, rewards] = await Promise.all([
    fetchApplicationsForAgents(agentIds),
    fetchRewardsForAgents(agentIds),
  ]);
  const month = periodBounds("month");

  return (
    <AppShell title="Агенты" subtitle="Руководитель" nav={managerNav} variant="workspace">
      {agents.length === 0 ? (
        <EmptyState
          title="Агенты не назначены"
          description="Администратор закрепит агентов за вами."
        />
      ) : (
        <ul className="space-y-2">
          {agents.map((agent) => {
            const stats = computeStats(
              applications.filter((a) => a.agent_id === agent.id),
              rewards.filter((r) => r.agent_id === agent.id),
              month,
            );
            return (
              <li
                key={agent.id}
                className="rounded-xl border border-[var(--card-border)] bg-card px-3 py-3"
              >
                <p className="text-sm font-medium">{agent.full_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatNumber(stats.sales)} продаж ·{" "}
                  {formatMoney(stats.revenueAccrued)} за месяц
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/manager/applications"
        className="block text-center text-sm text-accent"
      >
        Заявки команды
      </Link>
    </AppShell>
  );
}
