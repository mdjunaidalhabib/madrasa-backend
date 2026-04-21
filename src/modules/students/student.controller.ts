import { Request, Response } from "express";
import { db } from "../../config/db";

/* =========================================================
   HELPERS
========================================================= */
const isValidDate = (date?: string) => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

const clean = (value: any) =>
  value === undefined || value === "" ? null : value;

/* =========================================================
   GET ALL STUDENTS
========================================================= */
export const getStudents = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;

    const classId = req.query.class_id;
    const divisionId = req.query.division_id;

    if (!madrasaId) {
      return res.status(400).json({
        success: false,
        message: "Tenant madrasa not found",
      });
    }

    let sql = `
      SELECT 
        s.id,
        s.name_bn,
        s.father_name,
        s.guardian_phone,
        s.division_id,
        s.class_id,
        s.previous_class_id,
        c.name_bn AS current_class
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.madrasa_id = ?
    `;

    const params: any[] = [madrasaId];

    /* ================= FILTER: DIVISION ================= */
    if (divisionId) {
      sql += ` AND s.division_id = ?`;
      params.push(Number(divisionId));
    }

    /* ================= FILTER: CLASS ================= */
    if (classId) {
      sql += ` AND s.class_id = ?`;
      params.push(Number(classId));
    }

    sql += ` ORDER BY s.id DESC`;

    const [rows]: any = await db.query(sql, params);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    console.error("GET STUDENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE STUDENT
========================================================= */
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    if (!madrasaId) {
      return res.status(400).json({
        success: false,
        message: "Tenant madrasa not found",
      });
    }

    const [rows]: any = await db.query(
      `
      SELECT 
        s.*,
        c.name_bn AS current_class
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ? AND s.madrasa_id = ?
      LIMIT 1
      `,
      [id, madrasaId],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
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
   CREATE STUDENT (FIXED SAFE VERSION)
========================================================= */
export const createStudent = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;

    if (!madrasaId) {
      return res.status(400).json({
        success: false,
        message: "Tenant madrasa not found",
      });
    }

    console.log("📥 RAW BODY:", req.body);

    const body = req.body || {};

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Empty request body (Check express.json())",
      });
    }

    /* =========================
       HELPERS
    ========================= */
    const clean = (v: any) =>
      v === undefined || v === null || v === "" ? null : v;

    const toNumber = (v: any) => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    /* =========================
       REQUIRED CHECK
    ========================= */
    const requiredFields = [
      "name_bn",
      "gender",
      "dob",
      "class_id",
      "guardian_phone",
    ];

    const missing = requiredFields.filter((f) => {
      const value = body[f];

      if (typeof value === "string") {
        return value.trim() === "";
      }

      return value === undefined || value === null;
    });

    if (missing.length > 0) {
      console.log("❌ MISSING FIELDS:", missing);

      return res.status(400).json({
        success: false,
        message: "Required fields missing",
        missing_fields: missing,
        received: body,
      });
    }

    /* =========================
       FINAL DATA (UPDATED)
    ========================= */
    const data = {
      madrasa_id: madrasaId,
      name_bn: body.name_bn.trim(),
      arabic_name: clean(body.arabic_name),
      nid: clean(body.nid),
      gender: body.gender,
      dob: body.dob,
      age: toNumber(body.age),

      division_id: toNumber(body.division_id),
      class_id: toNumber(body.class_id),
      previous_class_id: toNumber(body.previous_class_id),

      father_name: clean(body.father_name),
      father_arabic_name: clean(body.father_arabic_name),
      father_nid: clean(body.father_nid),
      father_occupation: clean(body.father_occupation),

      mother_name: clean(body.mother_name),
      mother_nid: clean(body.mother_nid),
      mother_occupation: clean(body.mother_occupation),

      guardian_phone: String(body.guardian_phone).trim(),

      // 🔥 NEW ADDRESS FIELDS
      division: clean(body.division),
      district: clean(body.district),
      thana: clean(body.thana),
      village: clean(body.village),

      image: clean(body.image),
    };

    console.log("✅ FINAL DATA:", data);

    /* =========================
       INSERT (UPDATED)
    ========================= */
    const sql = `
      INSERT INTO students (
        madrasa_id,
        name_bn,
        arabic_name,
        nid,
        gender,
        dob,
        age,
        division_id,
        class_id,
        previous_class_id,
        father_name,
        father_arabic_name,
        father_nid,
        father_occupation,
        mother_name,
        mother_nid,
        mother_occupation,
        guardian_phone,
        division,
        district,
        thana,
        village,
        image
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const values = [
      data.madrasa_id,
      data.name_bn,
      data.arabic_name,
      data.nid,
      data.gender,
      data.dob,
      data.age,
      data.division_id,
      data.class_id,
      data.previous_class_id,
      data.father_name,
      data.father_arabic_name,
      data.father_nid,
      data.father_occupation,
      data.mother_name,
      data.mother_nid,
      data.mother_occupation,
      data.guardian_phone,

      // 🔥 ADDRESS VALUES
      data.division,
      data.district,
      data.thana,
      data.village,

      data.image,
    ];

    const [result]: any = await db.query(sql, values);

    return res.json({
      success: true,
      message: "Student admitted successfully",
      studentId: result.insertId,
    });
  } catch (error: any) {
    console.error("🔥 CREATE STUDENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   UPDATE STUDENT (FULL FIXED)
========================================================= */
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    if (!madrasaId) {
      return res.status(400).json({
        success: false,
        message: "Tenant madrasa not found",
      });
    }

    if (req.body.dob && !isValidDate(req.body.dob)) {
      return res.status(400).json({
        success: false,
        message: "Invalid DOB",
      });
    }

    const allowedFields = [
      "name_bn",
      "arabic_name",
      "nid",
      "gender",
      "dob",
      "age",
      "division_id",
      "class_id",
      "previous_class_id",
      "father_name",
      "father_arabic_name",
      "father_nid",
      "father_occupation",
      "mother_name",
      "mother_nid",
      "mother_occupation",
      "guardian_phone",
      "division",
      "district",
      "thana",
      "village",
      "image",
    ];

    const filteredBody: any = {};

    for (const key of Object.keys(req.body)) {
      if (allowedFields.includes(key)) {
        filteredBody[key] = clean(req.body[key]);
      }
    }

    const fields = Object.keys(filteredBody);

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: "No valid data to update",
      });
    }

    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => filteredBody[f]);

    const [result]: any = await db.query(
      `
      UPDATE students 
      SET ${setClause}
      WHERE id = ? AND madrasa_id = ?
      `,
      [...values, id, madrasaId],
    );

    return res.json({
      success: true,
      message: "Student updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    console.error("UPDATE STUDENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   DELETE STUDENT
========================================================= */
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    if (!madrasaId) {
      return res.status(400).json({
        success: false,
        message: "Tenant madrasa not found",
      });
    }

    const [result]: any = await db.query(
      "DELETE FROM students WHERE id = ? AND madrasa_id = ?",
      [id, madrasaId],
    );

    return res.json({
      success: true,
      message: "Student deleted successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
