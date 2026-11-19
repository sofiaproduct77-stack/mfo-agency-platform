import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ shortCode: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { shortCode } = await params;
  const admin = createServiceClient();

  const { data: agentOffer } = await admin
    .from("agent_offers")
    .select("id, agent_id, offer_id, offers(partner_url, is_active)")
    .eq("short_code", shortCode)
    .maybeSingle();

  const offer = agentOffer?.offers as
    | { partner_url: string; is_active: boolean }
    | null
    | undefined;

  if (!agentOffer || !offer?.is_active) {
    const fallback = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(new URL("/login", fallback));
  }

  await admin.from("applications").insert({
    agent_id: agentOffer.agent_id,
    offer_id: agentOffer.offer_id,
    agent_offer_id: agentOffer.id,
    status: "link_click",
    client_label: null,
  });

  return NextResponse.redirect(offer.partner_url);
}
