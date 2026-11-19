import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/nav-config";
import { markRewardPaidFormAction } from "@/actions/platform";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { computeStats, periodBounds } from "@/lib/analytics/aggregates";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/server";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select("status, created_at, agent_id, sale_amount");
  const { data: rewards } = await supabase.from("rewards").select("*");
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, role, is_active");

  const monthStats = computeStats(
    applications ?? [],
    rewards ?? [],
    periodBounds("month"),
  );

  const pendingPayouts = (rewards ?? []).filter((r) => r.status === "accrued");

  const activeAgents = (profiles ?? []).filter(
    (p) => p.role === "agent" && p.is_active,
  ).length;

  return (
    <AppShell title="Обзор системы" subtitle="Администратор" nav={adminNav} variant="workspace">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardTitle>Агенты</CardTitle>
          <CardValue>{formatNumber(activeAgents)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Продажи / мес</CardTitle>
          <CardValue>{formatNumber(monthStats.sales)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Заявки / мес</CardTitle>
          <CardValue>{formatNumber(monthStats.applicationCount)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Начислено / мес</CardTitle>
          <CardValue>{formatMoney(monthStats.revenueAccrued)}</CardValue>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Ожидают выплаты
        </h2>
        {pendingPayouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет открытых начислений</p>
        ) : (
          <ul className="space-y-2">
            {pendingPayouts.slice(0, 8).map((reward) => (
              <li
                key={reward.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-card px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatMoney(Number(reward.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(reward.created_at)}
                  </p>
                </div>
                <form action={markRewardPaidFormAction}>
                  <input type="hidden" name="reward_id" value={reward.id} />
                  <Button type="submit" variant="secondary">
                    Выплачено
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-2 text-center text-sm">
        <Link href="/admin/events" className="text-accent">
          События для агентов
        </Link>
        <Link href="/admin/audit" className="text-muted-foreground">
          Журнал действий
        </Link>
      </div>
    </AppShell>
  );
}
