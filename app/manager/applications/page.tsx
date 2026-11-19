import { AppShell } from "@/components/layout/app-shell";
import { managerNav } from "@/components/layout/nav-config";
import { updateApplicationStatusAction } from "@/actions/platform";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { fetchApplicationsForAgents, fetchTeamAgentIds } from "@/lib/data/queries";
import { requireRole } from "@/lib/supabase/server";
import { formatDateTime, formatMoney } from "@/lib/utils";
import {
  APPLICATION_STATUS_LABELS,
  MANUAL_STATUS_FLOW,
} from "@/types/database";

export default async function ManagerApplicationsPage() {
  const profile = await requireRole(["manager"]);
  const agents = await fetchTeamAgentIds(profile.id);
  const applications = await fetchApplicationsForAgents(
    agents.map((a) => a.id),
  );
  const list = applications.filter((a) => a.status !== "link_click");

  return (
    <AppShell title="Заявки команды" subtitle="Руководитель" nav={managerNav} variant="workspace">
      {list.length === 0 ? (
        <EmptyState title="Заявок пока нет" />
      ) : (
        <ul className="space-y-3">
          {list.map((app) => (
            <li key={app.id} className="surface-flat space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {app.profiles?.full_name} · {app.offers?.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(app.created_at)}
                    {app.offers?.agent_reward_amount
                      ? ` · ${formatMoney(Number(app.offers.agent_reward_amount))}`
                      : ""}
                  </p>
                </div>
                <StatusPill status={app.status} />
              </div>
              {app.status === "reward_accrued" ||
              app.status === "reward_paid" ? null : (
                <form
                  action={updateApplicationStatusAction}
                  className="space-y-2"
                >
                  <input type="hidden" name="application_id" value={app.id} />
                  <select
                    name="status"
                    defaultValue={app.status}
                    className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
                  >
                    {MANUAL_STATUS_FLOW.map((status) => (
                      <option key={status} value={status}>
                        {APPLICATION_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <input
                    name="sale_amount"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="Сумма продажи (для подтверждения)"
                    defaultValue={app.sale_amount ?? undefined}
                    className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
                  />
                  <input
                    name="note"
                    placeholder="Комментарий"
                    className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
                  />
                  <Button type="submit" variant="success" className="w-full">
                    Обновить статус
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
