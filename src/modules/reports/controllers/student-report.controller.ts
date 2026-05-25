import { Request, Response } from "express";
import { db } from "../../../config/db";
import { fail, ok, optionalQuery, requireTenant } from "./report.utils";

export const getStudentIdCardsReport = async (req: Request, res: Response) => {
  const madrasaId = requireTenant(req, res);
  if (!madrasaId) return;

  try {
    const [rows]: any = await db.query(
      `
      SELECT
        s.id,
        s.division_id,
        s.class_id,
        s.name_bn AS student_name,
        s.father_name,
        s.guardian_phone,
        COALESCE(c.name_bn, c.name) AS class_name,
        COALESCE(d.name_bn, d.name) AS division_name,
        s.image
      FROM students s
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN divisions d ON d.id = s.division_id
      WHERE s.madrasa_id = ?
      ORDER BY s.id DESC
      `,
      [madrasaId],
    );

    return ok(res, Array.isArray(rows) ? rows : []);
  } catch (error) {
    return fail(res, error);
  }
};

export const getStudentMarksheetsReport = async (req: Request, res: Response) => {
  const madrasaId = requireTenant(req, res);
  if (!madrasaId) return;

  try {
    const { rows, warning } = await optionalQuery(
      `
      SELECT
        s.id AS student_id,
        s.division_id,
        s.class_id,
        s.name_bn AS student_name,
        s.father_name,
        s.guardian_phone,
        COALESCE(c.name_bn, c.name) AS class_name,
        COALESCE(d.name_bn, d.name) AS division_name,
        rs.total,
        rs.average,
        rs.general_grade,
        rs.madrasa_grade,
        rs.status,
        rs.rank_no
      FROM results_summary rs
      INNER JOIN students s ON s.id = rs.student_id
      INNER JOIN results_master rm ON rm.id = rs.result_master_id
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN divisions d ON d.id = s.division_id
      WHERE s.madrasa_id = ?
      ORDER BY rm.id DESC, rs.rank_no ASC
      `,
      [madrasaId],
    );

    return ok(res, rows, warning);
  } catch (error) {
    return fail(res, error);
  }
};

export const getStudentCertificatesReport = async (req: Request, res: Response) => {
  const madrasaId = requireTenant(req, res);
  if (!madrasaId) return;

  try {
    const [rows]: any = await db.query(
      `
      SELECT
        s.id,
        s.division_id,
        s.class_id,
        s.name_bn AS student_name,
        s.father_name,
        s.mother_name,
        s.guardian_phone,
        COALESCE(c.name_bn, c.name) AS class_name,
        COALESCE(d.name_bn, d.name) AS division_name,
        s.village,
        s.thana,
        s.district
      FROM students s
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN divisions d ON d.id = s.division_id
      WHERE s.madrasa_id = ?
      ORDER BY s.id DESC
      `,
      [madrasaId],
    );

    return ok(res, Array.isArray(rows) ? rows : []);
  } catch (error) {
    return fail(res, error);
  }
};
