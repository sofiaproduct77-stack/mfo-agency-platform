import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/nav-config";
import { upsertPromoEventAction } from "@/actions/platform";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/server";
import { formatMoney, formatShortDate, localDateISO } from "@/lib/utils";

export default async function AdminEventsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("promo_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const today = localDateISO();

  return (
    <AppShell title="События" subtitle="Администратор" nav={adminNav} variant="workspace">
      <div className="surface-flat space-y-2 p-3">
        <p className="text-sm font-medium">Новое событие для агентов</p>
        <p className="text-xs text-muted-foreground">
          Так карточка будет выглядеть у агента во вкладке «События».
        </p>
        <div className="surface-flat border-dashed px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Название акции
            </p>
            <span className="text-sm font-semibold tabular-nums text-success">
              +{formatMoney(500)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Превью для агента</p>
        </div>
        <form action={upsertPromoEventAction} className="space-y-2 pt-1">
          <input
            name="title"
            required
            placeholder="Название"
            className="h-9 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <textarea
            name="description"
            placeholder="Условия (необязательно)"
            rows={2}
            className="w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 py-2 text-sm"
          />
          <input
            name="reward_amount"
            type="number"
            min={0}
            required
            placeholder="Бонус, ₽"
            className="h-9 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="period_start"
              type="date"
              required
              defaultValue={today}
              className="h-9 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
            />
            <input
              name="period_end"
              type="date"
              required
              className="h-9 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input name="is_active" type="checkbox" defaultChecked />
            Активно
          </label>
          <Button type="submit" className="w-full">
            Опубликовать
          </Button>
        </form>
      </div>

      <ul className="space-y-2">
        {(events ?? []).map((event) => (
          <li key={event.id} className="surface-flat px-3 py-2.5">
            <p className="text-sm font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(Number(event.reward_amount))} ·{" "}
              {formatShortDate(event.period_start)} —{" "}
              {formatShortDate(event.period_end)}
              {event.is_active ? "" : " · выкл"}
            </p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
