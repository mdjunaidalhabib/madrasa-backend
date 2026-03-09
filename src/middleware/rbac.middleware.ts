import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";

export const rbacMiddleware = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const role_id = req.user?.role_id;
    if (!role_id) return res.status(401).json({ message: "Unauthorized" });

    const [rows]: any = await db.query(
      `SELECT p.key_name
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id=?`,
      [role_id]
    );

    const perms = rows.map((r: any) => r.key_name);
    if (!perms.includes(permission)) return res.status(403).json({ message: "Forbidden" });

    next();
  };
};
