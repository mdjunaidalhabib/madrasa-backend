import { Request, Response } from "express";
import { db } from "../../config/db";

/* =========================================================
   GET DIVISIONS
========================================================= */

export const listDivisions = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        id,
        key_name,
        name,
        name_bn AS label
      FROM divisions
      ORDER BY id ASC
    `);

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
========================================================= */

export const listModules = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        id,
        key_name,
        name,
        name_bn AS label,
        group_name
      FROM modules
      WHERE is_active = 1
      ORDER BY group_name ASC, id ASC
    `);

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

/* =========================================================
   GET CLASSES
   GET /api/super/classes
   Optional: ?division_id=1
========================================================= */

export const listClasses = async (req: Request, res: Response) => {
  try {
    const divisionId = req.query.division_id;

    let query = `
      SELECT 
        id,
        name,
        name_bn AS label, -- ✅ Bangla label
        division_id
      FROM classes
    `;

    const params: any[] = [];

    if (divisionId) {
      query += ` WHERE division_id = ?`;
      params.push(divisionId);
    }

    query += ` ORDER BY id ASC`;

    const [rows]: any = await db.query(query, params);

    res.json({
      data: rows || [],
    });
  } catch (err: any) {
    console.error("listClasses ERROR:", err);

    res.status(500).json({
      message: err.message || "Failed to load classes",
    });
  }
};

/* =========================================================
   GET BOOKS
   GET /api/super/books
   Optional: ?class_id=1
========================================================= */

export const listBooks = async (req: Request, res: Response) => {
  try {
    const classId = req.query.class_id;

    let query = `
      SELECT 
        id,
        name,
        name_bn AS label, -- ✅ Bangla label
        class_id
      FROM books
    `;

    const params: any[] = [];

    if (classId) {
      query += ` WHERE class_id = ?`;
      params.push(classId);
    }

    query += ` ORDER BY id ASC`;

    const [rows]: any = await db.query(query, params);

    res.json({
      data: rows || [],
    });
  } catch (err: any) {
    console.error("listBooks ERROR:", err);

    res.status(500).json({
      message: err.message || "Failed to load books",
    });
  }
};
