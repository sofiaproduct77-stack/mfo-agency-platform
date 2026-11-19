import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { agentNav } from "@/components/layout/nav-config";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchActiveOffers } from "@/lib/data/queries";
import { requireRole } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export default async function AgentOffersPage() {
  await requireRole(["agent"]);
  const offers = await fetchActiveOffers();

  return (
    <AppShell title="Офферы" subtitle="Агент" nav={agentNav}>
      {offers.length === 0 ? (
        <EmptyState
          title="Офферов пока нет"
          description="Когда администратор добавит предложения, они появятся здесь."
        />
      ) : (
        <ul className="divide-y divide-[var(--card-border)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--card-border)] bg-card">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Link
                href={`/agent/offers/${offer.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {offer.product_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {offer.mfo_organizations?.name}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-success">
                  {formatMoney(Number(offer.agent_reward_amount))}
                </p>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
