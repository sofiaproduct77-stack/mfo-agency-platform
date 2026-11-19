export type NavIcon =
  | "home"
  | "layout-grid"
  | "clipboard-list"
  | "wallet"
  | "users"
  | "bar-chart-3"
  | "briefcase";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

export const agentNav: NavItem[] = [
  { href: "/agent/dashboard", label: "Главная", icon: "home" },
  { href: "/agent/offers", label: "Офферы", icon: "layout-grid" },
  { href: "/agent/income", label: "Доход", icon: "wallet" },
];

export const managerNav: NavItem[] = [
  { href: "/manager/dashboard", label: "Команда", icon: "home" },
  { href: "/manager/agents", label: "Агенты", icon: "users" },
  { href: "/manager/applications", label: "Заявки", icon: "clipboard-list" },
  { href: "/manager/analytics", label: "Аналитика", icon: "bar-chart-3" },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Обзор", icon: "home" },
  { href: "/admin/applications", label: "Заявки", icon: "clipboard-list" },
  { href: "/admin/users", label: "Люди", icon: "users" },
  { href: "/admin/offers", label: "Офферы", icon: "briefcase" },
];
