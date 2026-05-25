import { Request, Response } from "express";
import { db } from "../../../config/db";
import { fail, ok, requireTenant } from "./report.utils";

export const getTeacherListReport = async (req: Request, res: Response) => {
  const madrasaId = requireTenant(req, res);
  if (!madrasaId) return;

  try {
    const [rows]: any = await db.query(
      `
      SELECT
        t.id,
        t.division_id,
        t.name_bn AS teacher_name,
        t.phone,
        t.email,
        t.designation,
        t.department,
        t.qualification,
        COALESCE(d.name_bn, d.name) AS division_name,
        t.joining_date
      FROM teachers t
      LEFT JOIN divisions d ON d.id = t.division_id
      WHERE t.madrasa_id = ?
      ORDER BY t.id DESC
      `,
      [madrasaId],
    );

    return ok(res, Array.isArray(rows) ? rows : []);
  } catch (error) {
    return fail(res, error);
  }
};

export const getTeacherPhoneReport = async (req: Request, res: Response) => {
  const madrasaId = requireTenant(req, res);
  if (!madrasaId) return;

  try {
    const [rows]: any = await db.query(
      `
      SELECT
        t.id,
        t.division_id,
        t.name_bn AS teacher_name,
        t.phone,
        t.parent_phone,
        t.designation,
        COALESCE(d.name_bn, d.name) AS division_name
      FROM teachers t
      LEFT JOIN divisions d ON d.id = t.division_id
      WHERE t.madrasa_id = ?
      ORDER BY t.name_bn ASC
      `,
      [madrasaId],
    );

    return ok(res, Array.isArray(rows) ? rows : []);
  } catch (error) {
    return fail(res, error);
  }
};
