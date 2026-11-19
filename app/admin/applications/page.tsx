import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/nav-config";
import { updateApplicationStatusAction } from "@/actions/platform";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import {
  APPLICATION_STATUS_LABELS,
  MANUAL_STATUS_FLOW,
} from "@/types/database";

export default async function AdminApplicationsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "*, offers(product_name, agent_reward_amount, mfo_organizations(name)), profiles(full_name)",
    )
    .neq("status", "link_click")
    .order("created_at", { ascending: false })
    .limit(40);

  const list = applications ?? [];

  return (
    <AppShell title="Заявки" subtitle="Администратор" nav={adminNav} variant="workspace">
      {list.length === 0 ? (
        <EmptyState title="Заявок пока нет" />
      ) : (
        <ul className="space-y-3">
          {list.map((app) => (
            <li
              key={app.id}
              className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--card-border)] bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {app.profiles?.full_name} · {app.offers?.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(app.created_at)}
                  </p>
                </div>
                <StatusPill status={app.status} />
              </div>
              {app.status === "reward_paid" ? null : (
                <form
                  action={updateApplicationStatusAction}
                  className="space-y-2"
                >
                  <input type="hidden" name="application_id" value={app.id} />
                  <select
                    name="status"
                    defaultValue={
                      MANUAL_STATUS_FLOW.includes(
                        app.status as (typeof MANUAL_STATUS_FLOW)[number],
                      )
                        ? app.status
                        : "sale_confirmed"
                    }
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
                    placeholder="Сумма продажи"
                    defaultValue={app.sale_amount ?? undefined}
                    className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
                  />
                  <Button type="submit" variant="secondary" className="w-full">
                    Обновить · начислить при подтверждении
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
