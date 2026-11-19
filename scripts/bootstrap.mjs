#!/usr/bin/env node
/**
 * Local bootstrap after `npx supabase start`.
 * Writes .env.local and creates default admin + demo agent with sales plan.
 */
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.MFO_ADMIN_EMAIL ?? "admin@mfo-agency.local";
const ADMIN_PASSWORD = process.env.MFO_ADMIN_PASSWORD ?? "Admin123456!";
const ADMIN_NAME = "Администратор";

const AGENT_EMAIL = process.env.MFO_AGENT_EMAIL ?? "agent@mfo-agency.local";
const AGENT_PASSWORD = process.env.MFO_AGENT_PASSWORD ?? "Agent123456!";
const AGENT_NAME = "Иванов Иван Петрович";

const PLAN_TARGET_SALES = 10;
const DEMO_PLAN_PREFIX = "[demo-plan]";
const CHART_DEMO_PREFIX = "[demo-chart]";
const REWARD_AMOUNT = 500;

/** daysAgo from today → number of sales that day */
const CHART_PATTERN = [
  [12, 1],
  [10, 1],
  [8, 2],
  [6, 0],
  [5, 1],
  [4, 2],
  [3, 1],
  [2, 0],
  [1, 2],
  [0, 1],
];

function getStatus() {
  const raw = execSync("npx supabase status -o json", {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return JSON.parse(raw);
}

function currentMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { period_start: toDate(start), period_end: toDate(end) };
}

async function ensureAuthUser(admin, email, password) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing?.id) {
    const { error: pwdError } = await admin.auth.admin.updateUserById(
      existing.id,
      { password },
    );
    if (pwdError) throw pwdError;
    console.log("Auth user exists (password synced):", email);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log("Created auth user:", email);
  return data.user.id;
}

async function ensureProfile(admin, userId, fullName, role, extra = {}) {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    const { error } = await admin.from("profiles").insert({
      id: userId,
      full_name: fullName,
      role,
      ...extra,
    });
    if (error) throw error;
    console.log("Created profile:", role, fullName);
    return;
  }

  if (profile.role !== role) {
    const { error } = await admin
      .from("profiles")
      .update({ full_name: fullName, role, ...extra })
      .eq("id", userId);
    if (error) throw error;
    console.log("Updated profile role:", role);
  }
}

async function ensureSampleOffer(admin) {
  const { data: offer } = await admin
    .from("offers")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (offer) return offer.id;

  const { data: org, error: orgErr } = await admin
    .from("mfo_organizations")
    .insert({ name: "Пример МФО", website_url: "https://example.com" })
    .select("id")
    .single();
  if (orgErr) throw orgErr;

  const { data: created, error: offerErr } = await admin
    .from("offers")
    .insert({
      mfo_id: org.id,
      product_name: "Займ до 30 000 ₽",
      terms: "Ставка от 0% на первый займ. Решение за 5 минут.",
      agent_reward_amount: 500,
      partner_url: "https://example.com/apply",
    })
    .select("id")
    .single();
  if (offerErr) throw offerErr;
  console.log("Seeded sample MFO offer");
  return created.id;
}

async function ensureAgentPlan(admin, agentId) {
  const { period_start, period_end } = currentMonthBounds();

  await admin.from("plans").delete().eq("agent_id", agentId);

  const { error } = await admin.from("plans").insert({
    agent_id: agentId,
    period_start,
    period_end,
    target_sales: PLAN_TARGET_SALES,
  });
  if (error) throw error;
  console.log(
    `Plan for agent: ${PLAN_TARGET_SALES} sales (${period_start} — ${period_end})`,
  );
  return { period_start, period_end };
}

function countSalesInPlanPeriod(apps, periodStart, periodEnd) {
  const start = new Date(periodStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);
  return (apps ?? []).filter((a) => {
    const d = new Date(a.created_at);
    return d >= start && d <= end;
  }).length;
}

async function ensurePlanPeriodSales(
  admin,
  agentId,
  offerId,
  periodStart,
  periodEnd,
  target,
) {
  const { data: apps, error: listErr } = await admin
    .from("applications")
    .select("id, created_at, status")
    .eq("agent_id", agentId)
    .in("status", ["sale_confirmed", "reward_accrued", "reward_paid"]);
  if (listErr) throw listErr;

  const inPeriod = countSalesInPlanPeriod(apps, periodStart, periodEnd);
  if (inPeriod >= target) {
    console.log(`Plan period sales OK (${inPeriod}/${target})`);
    return;
  }

  await admin
    .from("applications")
    .delete()
    .eq("agent_id", agentId)
    .like("client_label", `${DEMO_PLAN_PREFIX}%`);

  const { data: appsAfterDelete } = await admin
    .from("applications")
    .select("id, created_at, status")
    .eq("agent_id", agentId)
    .in("status", ["sale_confirmed", "reward_accrued", "reward_paid"]);

  const need = Math.max(
    0,
    target - countSalesInPlanPeriod(appsAfterDelete, periodStart, periodEnd),
  );
  if (need === 0) {
    console.log(`Plan period sales OK (${target}/${target})`);
    return;
  }

  const base = new Date(`${periodStart}T12:00:00.000Z`);
  const toInsert = [];
  for (let i = 0; i < need; i++) {
    const created = new Date(base);
    created.setDate(base.getDate() + i);
    toInsert.push({
      agent_id: agentId,
      offer_id: offerId,
      status: "sale_confirmed",
      client_label: `${DEMO_PLAN_PREFIX} ${i + 1}`,
      sale_amount: 30000,
      created_at: created.toISOString(),
      status_updated_at: created.toISOString(),
    });
  }

  const { error } = await admin.from("applications").insert(toInsert);
  if (error) throw error;
  console.log(
    `Seeded ${need} plan sales in ${periodStart} — ${periodEnd} (${target}/${target} for progress)`,
  );
}

async function ensureChartDynamics(admin, agentId, offerId) {
  const { data: oldApps } = await admin
    .from("applications")
    .select("id")
    .eq("agent_id", agentId)
    .like("client_label", `${CHART_DEMO_PREFIX}%`);

  if (oldApps?.length) {
    await admin
      .from("applications")
      .delete()
      .in(
        "id",
        oldApps.map((a) => a.id),
      );
  }

  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);

  let n = 0;
  for (const [daysAgo, salesCount] of CHART_PATTERN) {
    for (let s = 0; s < salesCount; s++) {
      n++;
      const created = new Date(anchor);
      created.setDate(anchor.getDate() - daysAgo);
      created.setMinutes(created.getMinutes() + s * 17);
      const iso = created.toISOString();

      const { data: app, error: appErr } = await admin
        .from("applications")
        .insert({
          agent_id: agentId,
          offer_id: offerId,
          status: "sale_confirmed",
          client_label: `${CHART_DEMO_PREFIX} ${n}`,
          sale_amount: 30000,
          created_at: iso,
          status_updated_at: iso,
        })
        .select("id")
        .single();
      if (appErr) throw appErr;

      const { error: rewErr } = await admin.from("rewards").insert({
        application_id: app.id,
        agent_id: agentId,
        amount: REWARD_AMOUNT,
        status: "accrued",
        created_at: iso,
      });
      if (rewErr) throw rewErr;
    }
  }

  console.log(
    `Seeded sales chart: ${n} points over last 14 days (Доход → Начисления)`,
  );
}

async function main() {
  const status = getStatus();
  const apiUrl = status.API_URL ?? status.apiUrl;
  const anon = status.ANON_KEY ?? status.anonKey;
  const service = status.SERVICE_ROLE_KEY ?? status.serviceRoleKey;

  if (!apiUrl || !anon || !service) {
    console.error("Supabase local is not running. Run: npx supabase start");
    process.exit(1);
  }

  const lanHost = process.env.MFO_LAN_HOST?.trim();
  const publicApiUrl = lanHost ? `http://${lanHost}:54321` : apiUrl;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    (lanHost ? `http://${lanHost}:3000` : "http://localhost:3000");

  const envPath = ".env.local";
  const contents = `# Auto-generated by scripts/bootstrap.mjs
NEXT_PUBLIC_SUPABASE_URL=${publicApiUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
SUPABASE_SERVICE_ROLE_KEY=${service}
NEXT_PUBLIC_APP_URL=${appUrl}
`;
  writeFileSync(envPath, contents, "utf8");
  console.log(`Wrote ${envPath}`);

  const admin = createClient(apiUrl, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const adminId = await ensureAuthUser(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
  await ensureProfile(admin, adminId, ADMIN_NAME, "admin");

  const offerId = await ensureSampleOffer(admin);

  const agentId = await ensureAuthUser(admin, AGENT_EMAIL, AGENT_PASSWORD);
  await ensureProfile(admin, agentId, AGENT_NAME, "agent");

  const { period_start, period_end } = await ensureAgentPlan(admin, agentId);
  await ensurePlanPeriodSales(
    admin,
    agentId,
    offerId,
    period_start,
    period_end,
    PLAN_TARGET_SALES,
  );
  await ensureChartDynamics(admin, agentId, offerId);

  console.log("\n--- Admin ---");
  console.log("URL:      http://localhost:3000/login");
  console.log("Email:    ", ADMIN_EMAIL);
  console.log("Password: ", ADMIN_PASSWORD);

  console.log("\n--- Agent (дашборд с планом) ---");
  console.log("Email:    ", AGENT_EMAIL);
  console.log("Password: ", AGENT_PASSWORD);
  console.log(
    `\nПлан + график: войдите как ${AGENT_EMAIL} → /agent/income (внизу «Динамика продаж»)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
