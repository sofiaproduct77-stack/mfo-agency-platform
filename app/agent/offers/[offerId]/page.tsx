import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { agentNav } from "@/components/layout/nav-config";
import { OfferSharePanel } from "@/components/agent/offer-share-panel";
import { fetchActiveOffers } from "@/lib/data/queries";
import { requireRole } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

type Props = { params: Promise<{ offerId: string }> };

export default async function AgentOfferDetailPage({ params }: Props) {
  await requireRole(["agent"]);
  const { offerId } = await params;
  const offers = await fetchActiveOffers();
  const offer = offers.find((o) => o.id === offerId);
  if (!offer) notFound();

  return (
    <AppShell title={offer.product_name} subtitle="Оффер" nav={agentNav}>
      <div className="space-y-4">
        <div className="rounded-[var(--radius-xl)] border border-[var(--card-border)] bg-card px-4 py-4">
          <p className="text-xs text-muted-foreground">
            {offer.mfo_organizations?.name}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-success">
            {formatMoney(Number(offer.agent_reward_amount))}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {offer.terms}
          </p>
        </div>
        <OfferSharePanel offerId={offer.id} productName={offer.product_name} />
        <Link
          href="/agent/offers"
          className="block text-center text-sm text-muted-foreground"
        >
          ← Все офферы
        </Link>
      </div>
    </AppShell>
  );
}
