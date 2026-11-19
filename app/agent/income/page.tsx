import { AppShell } from "@/components/layout/app-shell";
import { agentNav } from "@/components/layout/nav-config";
import { IncomeSubNav } from "@/components/agent/income-sub-nav";
import { AgentIncomeContent } from "@/components/agent/agent-income-content";
import { AnimatedTabPanel } from "@/components/agent/animated-tab-panel";
import { requireRole } from "@/lib/supabase/server";
import {
  fetchActivePromoEvents,
  fetchApplicationsForAgents,
  fetchRewardsForAgents,
} from "@/lib/data/queries";
import { computeStats, buildDailySeries, periodBounds } from "@/lib/analytics/aggregates";

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function AgentIncomePage({ searchParams }: Props) {
  const profile = await requireRole(["agent"]);
  const { tab } = await searchParams;
  const activeTab = tab === "events" ? "events" : "income";

  const [applications, rewards, promoEvents] = await Promise.all([
    fetchApplicationsForAgents([profile.id]),
    fetchRewardsForAgents([profile.id]),
    fetchActivePromoEvents(),
  ]);

  const monthStats = computeStats(
    applications,
    rewards,
    periodBounds("month"),
  );

  const salesChart = buildDailySeries(applications, rewards, 14);

  return (
    <AppShell title="Доход" subtitle="Агент" nav={agentNav} pullToRefresh>
      <IncomeSubNav active={activeTab} />
      <AnimatedTabPanel tabKey={activeTab}>
        <AgentIncomeContent
          tab={activeTab}
          monthStats={monthStats}
          rewards={rewards}
          promoEvents={promoEvents}
          salesChart={salesChart}
        />
      </AnimatedTabPanel>
    </AppShell>
  );
}
