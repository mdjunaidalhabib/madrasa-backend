import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { isSuperAdminRole, normalizeRole } from "../utils/permissions";

type RoleRow = { key_name?: string; name_bn?: string; name?: string };
type PermissionRow = { key_name: string };

const roleAliases: Record<string, string> = {
  মুহতামিম: "MUHTAMIM",
  তালিমাত: "TALIMAT",
  হিসাবরক্ষক: "ACCOUNTANT",
  "হিসাব রক্ষক": "ACCOUNTANT",
};

const normalizeAppRole = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return roleAliases[String(role || "").trim()] || normalized;
};

const isMuhtamimRole = (role: string) => normalizeAppRole(role) === "MUHTAMIM";
const isTalimatPermission = (permission: string) =>
  permission.startsWith("talimat.") ||
  permission.startsWith("students.") ||
  permission.startsWith("exam.") ||
  permission.startsWith("result.");
const isAccountsPermission = (permission: string) => permission.startsWith("accounts.");

const permissionFallbackRoles: Record<string, string[]> = {
  "accounts.read": ["ACCOUNTANT"],
  "accounts.create": ["ACCOUNTANT"],
  "accounts.update": ["ACCOUNTANT"],
  "accounts.delete": ["ACCOUNTANT"],
  "talimat.manage": ["TALIMAT"],
  "students.read": ["TALIMAT"],
  "students.create": ["TALIMAT"],
  "students.update": ["TALIMAT"],
};

const hasFallbackRole = (permission: string, role: string) => {
  const allowed = permissionFallbackRoles[permission] || [];
  return allowed.map(normalizeAppRole).includes(normalizeAppRole(role));
};

async function getUserRole(req: Request) {
  const directRole = (req.user as any)?.role || (req.user as any)?.role_name;
  if (directRole) return normalizeAppRole(directRole);

  const roleId = req.user?.role_id;
  if (!roleId) return "";

  const [rows]: any = await db.query(`SELECT key_name, name_bn FROM roles WHERE id = ? LIMIT 1`, [
    roleId,
  ]);

  const row = (rows as RoleRow[])[0];
  return normalizeAppRole(row?.key_name || row?.name_bn || row?.name || "");
}

async function getRolePermissions(roleId: number) {
  const [rows]: any = await db.query(
    `SELECT p.key_name
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = ?`,
    [roleId],
  );

  return (rows as PermissionRow[]).map((r) => r.key_name);
}

export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const role = await getUserRole(req);
      const allowedRoles = roles.map(normalizeAppRole);

      if (
        isSuperAdminRole(role) ||
        isMuhtamimRole(role) ||
        allowedRoles.includes(normalizeAppRole(role))
      ) {
        return next();
      }

      return res.status(403).json({ message: "Forbidden: insufficient role" });
    } catch (error) {
      return next(error);
    }
  };
};

export const rbacMiddleware = (permission: string) => requirePermission(permission);

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.user?.role_id;

      if (!req.user || !roleId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const role = await getUserRole(req);

      if (isSuperAdminRole(role) || isMuhtamimRole(role)) {
        return next();
      }

      const appRole = normalizeAppRole(role);
      const roleBasedAllowed =
        (appRole === "TALIMAT" && isTalimatPermission(permission)) ||
        (appRole === "ACCOUNTANT" && isAccountsPermission(permission));

      const perms = await getRolePermissions(Number(roleId));

      if (!perms.includes(permission) && !hasFallbackRole(permission, role) && !roleBasedAllowed) {
        return res.status(403).json({ message: "Forbidden: missing permission" });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const requireAnyPermission = (...permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.user?.role_id;

      if (!req.user || !roleId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const role = await getUserRole(req);

      if (isSuperAdminRole(role) || isMuhtamimRole(role)) {
        return next();
      }

      const appRole = normalizeAppRole(role);
      const perms = await getRolePermissions(Number(roleId));
      const hasPermission = permissions.some((permission) => perms.includes(permission));

      const hasFallbackPermission = permissions.some((permission) =>
        hasFallbackRole(permission, role),
      );
      const hasRoleBasedPermission = permissions.some(
        (permission) =>
          (appRole === "TALIMAT" && isTalimatPermission(permission)) ||
          (appRole === "ACCOUNTANT" && isAccountsPermission(permission)),
      );

      if (!hasPermission && !hasFallbackPermission && !hasRoleBasedPermission) {
        return res.status(403).json({ message: "Forbidden: missing permission" });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const requireTenantOwnership = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userMadrasaId = Number(req.user.madrasa_id);
    const tenantMadrasaId = Number(req.tenant?.madrasa_id);

    if (!tenantMadrasaId || !userMadrasaId || userMadrasaId !== tenantMadrasaId) {
      return res.status(403).json({ message: "Forbidden: invalid madrasa access" });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
