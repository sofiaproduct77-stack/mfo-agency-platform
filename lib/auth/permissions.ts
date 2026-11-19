import type { UserRole } from "@/types/database";

const MANAGER_CAPABLE: UserRole[] = ["manager", "admin"];

export function canManageApplications(role: UserRole) {
  return MANAGER_CAPABLE.includes(role);
}

export function canAccrueRewards(role: UserRole) {
  return role === "admin";
}

export function canManageUsers(role: UserRole) {
  return role === "admin";
}

export function canManageOffers(role: UserRole) {
  return role === "admin";
}

export function canViewAudit(role: UserRole) {
  return role === "admin";
}

export function canConfirmSale(role: UserRole) {
  return MANAGER_CAPABLE.includes(role);
}
