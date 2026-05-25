import { Request, Response } from "express";
import { db } from "../../config/db";

const normalizeRole = (value?: string | null) =>
  String(value || "")
    .trim()
    .toUpperCase();

async function getRoleKey(roleId?: number) {
  if (!roleId) return "";
  const [rows]: any = await db.query(`SELECT key_name, name_bn FROM roles WHERE id=? LIMIT 1`, [
    roleId,
  ]);
  const raw = rows?.[0]?.key_name || rows?.[0]?.name_bn || "";
  if (raw === "মুহতামিম") return "MUHTAMIM";
  if (raw === "তালিমাত") return "TALIMAT";
  if (raw === "হিসাবরক্ষক" || raw === "হিসাব রক্ষক") return "ACCOUNTANT";
  return normalizeRole(raw);
}

function isAllowed(role: string, moduleKey: string) {
  if (!role || role === "MUHTAMIM" || role === "SUPER_ADMIN") return true;
  if (role === "TALIMAT") return moduleKey === "talimat";
  if (role === "ACCOUNTANT") return moduleKey === "accounts";
  return true;
}

export const getSidebar = async (req: Request, res: Response) => {
  try {
    const madrasa_id = req.tenant!.madrasa_id;
    const roleKey = await getRoleKey(req.user?.role_id);

    const [modules]: any = await db.query(
      `
      SELECT m.id, m.key_name, m.name_bn, m.group_name, m.sort_order
      FROM madrasa_modules mm
      JOIN modules m ON m.id = mm.module_id
      WHERE mm.madrasa_id = ? AND mm.is_active = 1 AND m.is_active = 1
      ORDER BY m.sort_order ASC, m.id ASC
      `,
      [madrasa_id],
    );

    const [features]: any = await db.query(
      `
      SELECT id, module_id, key_name, name_bn, sort_order
      FROM module_features
      WHERE module_id IN (SELECT module_id FROM madrasa_modules WHERE madrasa_id=? AND is_active=1)
      ORDER BY module_id ASC, sort_order ASC, id ASC
      `,
      [madrasa_id],
    );

    const sidebar = modules.map((mod: any) => {
      const disabled = !isAllowed(roleKey, mod.key_name);
      return {
        id: mod.id,
        key: mod.key_name,
        label: mod.name_bn,
        group: mod.group_name,
        sort_order: mod.sort_order,
        disabled,
        children: features
          .filter((f: any) => f.module_id === mod.id)
          .map((f: any) => ({
            id: f.id,
            key: f.key_name,
            label: f.name_bn,
            sort_order: f.sort_order,
            disabled,
          })),
      };
    });

    res.json(sidebar);
  } catch (err: any) {
    console.error("Sidebar error:", err);
    res.status(500).json({ message: err.message });
  }
};
