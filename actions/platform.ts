"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireProfile, requireRole } from "@/lib/supabase/server";
import type { ApplicationStatus, UserRole } from "@/types/database";
import { generateShortCode } from "@/lib/short-code";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Проверьте email и пароль" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Неверный email или пароль" };
  }

  redirect("/");
}

export async function createUserAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().min(2),
    role: z.enum(["admin", "manager", "agent"]),
    manager_id: z.string().uuid().optional().or(z.literal("")),
    phone: z.string().optional(),
  });

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
    manager_id: formData.get("manager_id"),
    phone: formData.get("phone"),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return;
  }

  const admin = createServiceClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    return;
  }

  const profile = await requireProfile();
  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone || null,
    role: parsed.data.role,
    manager_id:
      parsed.data.role === "agent" && parsed.data.manager_id
        ? parsed.data.manager_id
        : null,
  });

  if (profileError) {
    return;
  }

  await admin.from("audit_log").insert({
    actor_id: profile.id,
    action: "user.create",
    entity_type: "profile",
    entity_id: created.user.id,
    payload: { role: parsed.data.role, email: parsed.data.email },
  });

  revalidatePath("/admin/users");
}

export async function ensureAgentOfferAction(offerId: string) {
  const profile = await requireRole(["agent"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("agent_offers")
    .select("*")
    .eq("agent_id", profile.id)
    .eq("offer_id", offerId)
    .maybeSingle();

  if (existing) return { agentOffer: existing };

  let shortCode = generateShortCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("agent_offers")
      .insert({
        agent_id: profile.id,
        offer_id: offerId,
        short_code: shortCode,
      })
      .select("*")
      .single();

    if (!error && data) {
      revalidatePath("/agent/catalog");
      return { agentOffer: data };
    }
    shortCode = generateShortCode();
  }

  return { error: "Не удалось создать персональную ссылку" };
}

export async function createApplicationAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["agent", "manager", "admin"]);
  const offerId = String(formData.get("offer_id") ?? "");
  const clientLabel = String(formData.get("client_label") ?? "").trim();
  const agentIdRaw = String(formData.get("agent_id") ?? profile.id);

  if (!offerId) return;

  let agentId = profile.id;
  if (profile.role !== "agent") {
    if (!agentIdRaw) return;
    agentId = agentIdRaw;
  }

  const supabase = await createClient();

  if (profile.role === "manager") {
    const { data: agentProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", agentId)
      .eq("manager_id", profile.id)
      .maybeSingle();
    if (!agentProfile) return;
  }

  const { data: offer } = await supabase
    .from("offers")
    .select("id, is_active")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer?.is_active) return;

  const { data: app, error } = await supabase
    .from("applications")
    .insert({
      agent_id: agentId,
      offer_id: offerId,
      status: "application_submitted",
      client_label: clientLabel || null,
    })
    .select("id")
    .single();

  if (error || !app) return;

  await supabase.from("application_events").insert({
    application_id: app.id,
    from_status: null,
    to_status: "application_submitted",
    actor_id: profile.id,
  });

  revalidatePath("/agent/applications");
  revalidatePath("/manager/applications");
}

const statusSchema = z.object({
  application_id: z.string().uuid(),
  status: z.custom<ApplicationStatus>(),
  note: z.string().optional(),
  sale_amount: z.coerce.number().optional(),
});

export async function updateApplicationStatusAction(
  formData: FormData,
): Promise<void> {
  const profile = await requireRole(["manager", "admin"]);
  const parsed = statusSchema.safeParse({
    application_id: formData.get("application_id"),
    status: formData.get("status"),
    note: formData.get("note"),
    sale_amount: formData.get("sale_amount"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", parsed.data.application_id)
    .maybeSingle();

  if (!app) return;

  if (profile.role === "manager") {
    const { data: agentProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", app.agent_id)
      .eq("manager_id", profile.id)
      .maybeSingle();
    if (!agentProfile) return;
  }

  if (
    parsed.data.status === "sale_confirmed" &&
    !parsed.data.sale_amount &&
    !app.sale_amount
  ) {
    return;
  }

  const saleAmount =
    parsed.data.sale_amount ?? app.sale_amount ?? null;

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: parsed.data.status,
      sale_amount: saleAmount,
      status_updated_at: new Date().toISOString(),
    })
    .eq("id", app.id);

  if (updateError) return;

  await supabase.from("application_events").insert({
    application_id: app.id,
    from_status: app.status,
    to_status: parsed.data.status,
    actor_id: profile.id,
    note: parsed.data.note ?? null,
  });

  if (parsed.data.status === "sale_confirmed" && profile.role === "admin") {
    const { data: offer } = await supabase
      .from("offers")
      .select("agent_reward_amount")
      .eq("id", app.offer_id)
      .single();

    if (offer) {
      await supabase.from("rewards").upsert(
        {
          application_id: app.id,
          agent_id: app.agent_id,
          amount: offer.agent_reward_amount,
          status: "accrued",
        },
        { onConflict: "application_id" },
      );

      await supabase
        .from("applications")
        .update({ status: "reward_accrued" })
        .eq("id", app.id);
    }
  }

  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    action: "application.status",
    entity_type: "application",
    entity_id: app.id,
    payload: { to: parsed.data.status },
  });

  revalidatePath("/manager/applications");
  revalidatePath("/admin/dashboard");
  revalidatePath("/agent/applications");
}

async function markRewardPaid(rewardId: string): Promise<void> {
  await requireRole(["admin"]);
  const supabase = createServiceClient();
  const profile = await requireProfile();

  const { data: reward } = await supabase
    .from("rewards")
    .select("*, applications(id, status)")
    .eq("id", rewardId)
    .maybeSingle();

  if (!reward) return;

  const { error } = await supabase
    .from("rewards")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", rewardId);

  if (error) return;

  await supabase
    .from("applications")
    .update({ status: "reward_paid" })
    .eq("id", reward.application_id);

  await supabase.from("audit_log").insert({
    actor_id: profile.id,
    action: "reward.paid",
    entity_type: "reward",
    entity_id: rewardId,
    payload: { amount: reward.amount },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/agent/rewards");
}

export async function markRewardPaidFormAction(formData: FormData): Promise<void> {
  const rewardId = String(formData.get("reward_id") ?? "");
  if (!rewardId) return;
  await markRewardPaid(rewardId);
}

export async function upsertOfferAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const profile = await requireProfile();
  const admin = createServiceClient();

  const id = String(formData.get("id") ?? "");
  const payload = {
    mfo_id: String(formData.get("mfo_id")),
    product_name: String(formData.get("product_name")),
    terms: String(formData.get("terms")),
    agent_reward_amount: Number(formData.get("agent_reward_amount")),
    partner_url: String(formData.get("partner_url")),
    is_active: formData.get("is_active") === "on",
  };

  if (!payload.mfo_id || !payload.product_name || !payload.partner_url) {
    return;
  }

  const query = id
    ? admin.from("offers").update(payload).eq("id", id)
    : admin.from("offers").insert(payload);

  const { error } = await query;
  if (error) return;

  await admin.from("audit_log").insert({
    actor_id: profile.id,
    action: id ? "offer.update" : "offer.create",
    entity_type: "offer",
    entity_id: id || null,
    payload,
  });

  revalidatePath("/admin/offers");
  revalidatePath("/agent/catalog");
}

export async function upsertMfoAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const profile = await requireProfile();
  const admin = createServiceClient();

  const id = String(formData.get("id") ?? "");
  const payload = {
    name: String(formData.get("name")),
    website_url: String(formData.get("website_url") || "") || null,
    is_active: formData.get("is_active") === "on",
  };

  if (!payload.name) return;

  const query = id
    ? admin.from("mfo_organizations").update(payload).eq("id", id)
    : admin.from("mfo_organizations").insert(payload);

  const { error } = await query;
  if (error) return;

  await admin.from("audit_log").insert({
    actor_id: profile.id,
    action: id ? "mfo.update" : "mfo.create",
    entity_type: "mfo",
    entity_id: id || null,
    payload,
  });

  revalidatePath("/admin/offers");
}

export async function upsertPromoEventAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const profile = await requireProfile();
  const admin = createServiceClient();

  const payload = {
    title: String(formData.get("title")),
    description: String(formData.get("description") || "") || null,
    reward_amount: Number(formData.get("reward_amount")),
    period_start: String(formData.get("period_start")),
    period_end: String(formData.get("period_end")),
    is_active: formData.get("is_active") === "on",
  };

  if (!payload.title || !payload.period_start || !payload.period_end) return;

  const { error } = await admin.from("promo_events").insert(payload);
  if (error) return;

  await admin.from("audit_log").insert({
    actor_id: profile.id,
    action: "promo_event.create",
    entity_type: "promo_event",
    payload,
  });

  revalidatePath("/admin/events");
  revalidatePath("/agent/income");
}
