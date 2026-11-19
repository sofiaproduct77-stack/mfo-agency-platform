import { createClient } from "@/lib/supabase/server";
import { localDateISO } from "@/lib/utils";
import type { Application, Offer, Profile, Reward } from "@/types/database";

export async function fetchApplicationsForAgents(agentIds: string[]) {
  if (agentIds.length === 0) {
    return [] as Application[];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "*, offers(product_name, agent_reward_amount, mfo_organizations(name)), profiles(full_name)",
    )
    .in("agent_id", agentIds)
    .order("created_at", { ascending: false });
  return (data ?? []) as Application[];
}

export async function fetchRewardsForAgents(agentIds: string[]) {
  if (agentIds.length === 0) return [] as Reward[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("rewards")
    .select("*")
    .in("agent_id", agentIds)
    .order("created_at", { ascending: false });
  return (data ?? []) as Reward[];
}

export async function fetchTeamAgentIds(managerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, is_active")
    .eq("manager_id", managerId)
    .eq("role", "agent")
    .eq("is_active", true);
  return (data ?? []) as Pick<Profile, "id" | "full_name" | "is_active">[];
}

export async function fetchActiveOffers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offers")
    .select("*, mfo_organizations(name, logo_url)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as Offer[];
}

export async function fetchCurrentPlan(agentId: string) {
  const supabase = await createClient();
  const today = localDateISO();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("agent_id", agentId)
    .lte("period_start", today)
    .gte("period_end", today)
    .maybeSingle();
  return data;
}

export type PromoEvent = {
  id: string;
  title: string;
  description: string | null;
  reward_amount: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
};

export async function fetchActivePromoEvents() {
  const supabase = await createClient();
  const today = localDateISO();
  const { data } = await supabase
    .from("promo_events")
    .select("*")
    .eq("is_active", true)
    .lte("period_start", today)
    .gte("period_end", today)
    .order("period_end", { ascending: true });
  return (data ?? []) as PromoEvent[];
}
