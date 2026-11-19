export type UserRole = "admin" | "manager" | "agent";

export type ApplicationStatus =
  | "link_click"
  | "application_submitted"
  | "under_review"
  | "approved"
  | "sale_confirmed"
  | "reward_accrued"
  | "reward_paid"
  | "rejected";

export type RewardStatus = "accrued" | "paid";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MfoOrganization = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Offer = {
  id: string;
  mfo_id: string;
  product_name: string;
  terms: string;
  agent_reward_amount: number;
  partner_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mfo_organizations?: Pick<MfoOrganization, "name" | "logo_url"> | null;
};

export type AgentOffer = {
  id: string;
  agent_id: string;
  offer_id: string;
  short_code: string;
  created_at: string;
};

export type Application = {
  id: string;
  agent_id: string;
  offer_id: string;
  agent_offer_id: string | null;
  status: ApplicationStatus;
  client_label: string | null;
  sale_amount: number | null;
  status_updated_at: string;
  created_at: string;
  updated_at: string;
  offers?: Pick<Offer, "product_name" | "agent_reward_amount"> & {
    mfo_organizations?: Pick<MfoOrganization, "name"> | null;
  } | null;
  profiles?: Pick<Profile, "full_name"> | null;
};

export type Reward = {
  id: string;
  application_id: string;
  agent_id: string;
  amount: number;
  status: RewardStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Plan = {
  id: string;
  agent_id: string;
  period_start: string;
  period_end: string;
  target_sales: number;
  created_at: string;
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  link_click: "Переход по ссылке",
  application_submitted: "Заявка отправлена",
  under_review: "На рассмотрении",
  approved: "Одобрена",
  sale_confirmed: "Продажа подтверждена",
  reward_accrued: "Вознаграждение начислено",
  reward_paid: "Вознаграждение выплачено",
  rejected: "Отказ",
};

export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  agent: "/agent/dashboard",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Администратор",
  manager: "Руководитель",
  agent: "Агент",
};

/** Statuses managers/admins may set manually (not link_click). */
export const MANUAL_STATUS_FLOW: ApplicationStatus[] = [
  "application_submitted",
  "under_review",
  "approved",
  "sale_confirmed",
  "rejected",
];

export function isSaleStatus(status: ApplicationStatus): boolean {
  return (
    status === "sale_confirmed" ||
    status === "reward_accrued" ||
    status === "reward_paid"
  );
}
