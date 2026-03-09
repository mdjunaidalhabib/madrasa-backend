import { Request, Response } from "express";
import { db } from "../../config/db";

export const getSidebar = async (req: Request, res: Response) => {
  try {
    const madrasa_id = req.tenant!.madrasa_id;

    /* LOAD MODULES */

    const [modules]: any = await db.query(
      `
      SELECT m.id, m.key_name, m.name_bn, m.group_name
      FROM madrasa_modules mm
      JOIN modules m ON m.id = mm.module_id
      WHERE mm.madrasa_id = ?
        AND mm.is_active = 1
      ORDER BY m.id
      `,
      [madrasa_id],
    );

    /* LOAD FEATURES */

    const [features]: any = await db.query(
      `
      SELECT id, module_id, key_name, name_bn, sort_order
      FROM module_features
      ORDER BY sort_order
      `,
    );

    /* BUILD SIDEBAR TREE */

    const sidebar = modules.map((mod: any) => ({
      key: mod.key_name,
      label: mod.name_bn,
      group: mod.group_name,
      children: features
        .filter((f: any) => f.module_id === mod.id)
        .map((f: any) => ({
          key: f.key_name,
          label: f.name_bn,
        })),
    }));

    res.json(sidebar);
  } catch (err: any) {
    console.error("Sidebar error:", err);
    res.status(500).json({ message: err.message });
  }
};
