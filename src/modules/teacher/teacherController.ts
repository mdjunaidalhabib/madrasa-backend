import { Request, Response } from "express";
import { db } from "../../config/db";

/* =========================================================
   HELPER: snake_case
========================================================= */
const toSnakeCase = (obj: any) => {
  const newObj: any = {};

  Object.keys(obj).forEach((key) => {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`,
    );
    newObj[snakeKey] = obj[key];
  });

  return newObj;
};

/* =========================================================
   HELPER: SAFE NUMBER
========================================================= */
const toNumber = (val: any, defaultVal: number | null = null) => {
  if (val === undefined || val === null || val === "") return defaultVal;
  return Number(val);
};

/* =========================================================
   CREATE TEACHER
========================================================= */
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;

    if (!madrasaId) {
      return res.status(400).json({
        success: false,
        message: "Tenant madrasa not found",
      });
    }

    const body = toSnakeCase(req.body);

    const sql = `
      INSERT INTO teachers (
        madrasa_id,
        division_id,
        name_bn, name_ar, nid, gender, dob, age,
        phone, email,
        designation, department, qualification,
        experience_year, experience_month,
        joining_date, salary,
        father_name, father_name_ar, father_nid, father_occupation,
        mother_name, mother_nid, mother_occupation,
        parent_phone,
        division, district, thana, village,
        image
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?
      )
    `;

    const values = [
      madrasaId,
      toNumber(body.division_id),

      body.name_bn,
      body.name_ar || null,
      body.nid || null,
      body.gender || null,
      body.dob || null,
      toNumber(body.age),

      body.phone || null,
      body.email || null,

      body.designation || null,
      body.department || null,
      body.qualification || null,

      toNumber(body.experience_year),
      toNumber(body.experience_month),

      body.joining_date || null,
      toNumber(body.salary),

      body.father_name || null,
      body.father_name_ar || null,
      body.father_nid || null,
      body.father_occupation || null,

      body.mother_name || null,
      body.mother_nid || null,
      body.mother_occupation || null,

      body.parent_phone || null,

      body.division || null,
      body.district || null,
      body.thana || null,
      body.village || null,

      body.image || null,
    ];

    const [result]: any = await db.query(sql, values);

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      id: result.insertId,
    });
  } catch (error: any) {
    console.error("CREATE TEACHER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   GET ALL TEACHERS
========================================================= */
export const getTeachers = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;

    const [rows]: any = await db.query(
      `SELECT * FROM teachers WHERE madrasa_id = ? ORDER BY id DESC`,
      [madrasaId],
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE TEACHER
========================================================= */
export const getTeacherById = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    const [rows]: any = await db.query(
      `SELECT * FROM teachers WHERE id = ? AND madrasa_id = ?`,
      [id, madrasaId],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   UPDATE TEACHER (🔥 FIXED EXPERIENCE BUG)
========================================================= */
export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    const body = toSnakeCase(req.body);

    const filtered: any = {};

    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined) {
        filtered[key] = body[key];
      }
    });

    const fields = Object.keys(filtered);

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: "No data to update",
      });
    }

    const setClause = fields.map((f) => `${f} = ?`).join(", ");

    const values = fields.map((f) => {
      const val = filtered[f];

      // 🔥 SAFE NUMBER FIELDS
      if (
        f === "age" ||
        f === "salary" ||
        f === "experience_year" ||
        f === "experience_month" ||
        f === "division_id"
      ) {
        return toNumber(val);
      }

      return val;
    });

    const sql = `
      UPDATE teachers
      SET ${setClause}
      WHERE id = ? AND madrasa_id = ?
    `;

    const [result]: any = await db.query(sql, [...values, id, madrasaId]);

    return res.json({
      success: true,
      message: "Teacher updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   DELETE TEACHER
========================================================= */
export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    const [result]: any = await db.query(
      "DELETE FROM teachers WHERE id = ? AND madrasa_id = ?",
      [id, madrasaId],
    );

    return res.json({
      success: true,
      message: "Teacher deleted",
      affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
