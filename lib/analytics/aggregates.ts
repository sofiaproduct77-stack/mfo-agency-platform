import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Application, Plan, Reward } from "@/types/database";
import { isSaleStatus } from "@/types/database";

type PlanPeriod = Pick<Plan, "period_start" | "period_end">;
type SaleApp = Pick<Application, "status" | "created_at">;

function planPeriodBounds(plan: PlanPeriod) {
  const start = new Date(plan.period_start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(plan.period_end);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function countPlanSales(applications: SaleApp[], plan: PlanPeriod) {
  const { start, end } = planPeriodBounds(plan);
  return applications.filter(
    (a) =>
      isSaleStatus(a.status) &&
      new Date(a.created_at) >= start &&
      new Date(a.created_at) <= end,
  ).length;
}

export type PeriodKey = "day" | "week" | "month";

export function periodBounds(period: PeriodKey, now = new Date()) {
  switch (period) {
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

type AppRow = Pick<
  Application,
  "status" | "created_at" | "agent_id" | "sale_amount"
>;
type RewardRow = Pick<Reward, "amount" | "status" | "created_at" | "agent_id">;

export function computeStats(
  applications: AppRow[],
  rewards: RewardRow[],
  range?: { start: Date; end: Date },
) {
  const inRange = (iso: string) => {
    if (!range) return true;
    const d = new Date(iso);
    return d >= range.start && d <= range.end;
  };

  const apps = applications.filter((a) => inRange(a.created_at));
  const rews = rewards.filter((r) => inRange(r.created_at));

  const clicks = apps.filter((a) => a.status === "link_click").length;
  const applicationCount = apps.filter(
    (a) => a.status !== "link_click" && a.status !== "rejected",
  ).length;
  const sales = apps.filter((a) => isSaleStatus(a.status)).length;
  const revenueAccrued = rews
    .filter((r) => r.status === "accrued" || r.status === "paid")
    .reduce((s, r) => s + Number(r.amount), 0);
  const revenuePaid = rews
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + Number(r.amount), 0);

  const conversion =
    applicationCount > 0 ? sales / applicationCount : 0;
  const avgPerSale = sales > 0 ? revenueAccrued / sales : 0;

  return {
    clicks,
    applicationCount,
    sales,
    revenueAccrued,
    revenuePaid,
    conversion,
    avgPerSale,
  };
}

export function buildDailySeries(
  applications: AppRow[],
  rewards: RewardRow[],
  days = 14,
) {
  const today = startOfDay(new Date());
  const points: { label: string; revenue: number; sales: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const start = startOfDay(day);
    const end = endOfDay(day);
    const stats = computeStats(applications, rewards, { start, end });
    points.push({
      label: start.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      }),
      revenue: stats.revenueAccrued,
      sales: stats.sales,
    });
  }

  return points;
}

export type AgentLeaderboardRow = {
  agentId: string;
  name: string;
  sales: number;
  revenue: number;
};

export function agentLeaderboard(
  applications: AppRow[],
  rewards: RewardRow[],
  names: Map<string, string>,
  range?: { start: Date; end: Date },
): AgentLeaderboardRow[] {
  const byAgent = new Map<string, AgentLeaderboardRow>();

  for (const [id, name] of names) {
    byAgent.set(id, { agentId: id, name, sales: 0, revenue: 0 });
  }

  const statsByAgent = new Map<string, ReturnType<typeof computeStats>>();
  for (const id of names.keys()) {
    const agentApps = applications.filter((a) => a.agent_id === id);
    const agentRewards = rewards.filter((r) => r.agent_id === id);
    statsByAgent.set(id, computeStats(agentApps, agentRewards, range));
  }

  for (const [id, stats] of statsByAgent) {
    const row = byAgent.get(id);
    if (!row) continue;
    row.sales = stats.sales;
    row.revenue = stats.revenueAccrued;
  }

  return [...byAgent.values()].sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
}
