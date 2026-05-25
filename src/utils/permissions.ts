export const Roles = {
  SUPER_ADMIN: "SUPER_ADMIN",
  MADRASA_ADMIN: "MADRASA_ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  GUARDIAN: "GUARDIAN",
} as const;

export type RoleKey = keyof typeof Roles | (typeof Roles)[keyof typeof Roles];

export const Permissions = {
  MANAGE_MADRASAS: "manage_madrasas",
  MANAGE_PLANS: "manage_plans",
  MANAGE_WEBSITES: "manage_websites",
  MANAGE_USERS: "manage_users",
  VIEW_REPORTS: "view_reports",
  MANAGE_ACADEMIC: "manage_academic",
  MANAGE_ACCOUNTS: "manage_accounts",
} as const;

export const normalizeRole = (role?: string | null) =>
  String(role || "")
    .trim()
    .toUpperCase();

export const isSuperAdminRole = (role?: string | null) => normalizeRole(role) === Roles.SUPER_ADMIN;
