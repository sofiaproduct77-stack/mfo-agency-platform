import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/nav-config";
import { upsertMfoAction, upsertOfferAction } from "@/actions/platform";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

export default async function AdminOffersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: mfos } = await supabase
    .from("mfo_organizations")
    .select("*")
    .order("name");
  const { data: offers } = await supabase
    .from("offers")
    .select("*, mfo_organizations(name)")
    .order("created_at", { ascending: false });

  return (
    <AppShell title="МФО и офферы" subtitle="Администратор" nav={adminNav} variant="workspace">
      <Card className="space-y-2">
        <p className="text-sm font-medium">Новая организация МФО</p>
        <form action={upsertMfoAction} className="space-y-2">
          <input
            name="name"
            required
            placeholder="Название"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <input
            name="website_url"
            placeholder="Сайт"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input name="is_active" type="checkbox" defaultChecked />
            Активна
          </label>
          <Button type="submit" variant="secondary" className="w-full">
            Добавить МФО
          </Button>
        </form>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium">Новый оффер</p>
        <form action={upsertOfferAction} className="space-y-2">
          <select
            name="mfo_id"
            required
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              МФО
            </option>
            {(mfos ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            name="product_name"
            required
            placeholder="Продукт"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <textarea
            name="terms"
            required
            placeholder="Условия"
            rows={3}
            className="w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 py-2 text-sm"
          />
          <input
            name="agent_reward_amount"
            type="number"
            min={0}
            required
            placeholder="Вознаграждение агенту"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <input
            name="partner_url"
            required
            placeholder="Ссылка партнёра"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input name="is_active" type="checkbox" defaultChecked />
            Активен
          </label>
          <Button type="submit" className="w-full">
            Сохранить оффер
          </Button>
        </form>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Активные офферы
        </h2>
        <ul className="space-y-2">
          {(offers ?? []).map((offer) => (
            <li
              key={offer.id}
              className="rounded-xl border border-[var(--card-border)] bg-card px-3 py-3"
            >
              <p className="text-sm font-medium">
                {offer.mfo_organizations?.name} · {offer.product_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatMoney(Number(offer.agent_reward_amount))} ·{" "}
                {offer.is_active ? "активен" : "выключен"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
