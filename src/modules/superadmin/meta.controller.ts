import { Request, Response } from "express";
import { db } from "../../config/db";

/* =========================================================
   GET DIVISIONS
   GET /api/super/divisions
========================================================= */

export const listDivisions = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      `
      SELECT 
        id,
        key_name,
        name,
        name_bn AS label
      FROM divisions
      ORDER BY id ASC
      `,
    );

    res.json({
      data: rows || [],
    });
  } catch (err: any) {
    console.error("listDivisions ERROR:", err);

    res.status(500).json({
      message: err.message || "Failed to load divisions",
    });
  }
};

/* =========================================================
   GET MODULES
   GET /api/super/modules
========================================================= */

export const listModules = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      `
      SELECT 
        id,
        key_name,
        name,
        name_bn AS label,
        group_name
      FROM modules
      WHERE is_active = 1
      ORDER BY group_name ASC, id ASC
      `,
    );

    res.json({
      data: rows || [],
    });
  } catch (err: any) {
    console.error("listModules ERROR:", err);

    res.status(500).json({
      message: err.message || "Failed to load modules",
    });
  }
};
