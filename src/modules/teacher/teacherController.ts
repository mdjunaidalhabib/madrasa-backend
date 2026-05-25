import { Request, Response } from "express";
import { db } from "../../config/db";

const toSnakeCase = (obj: any = {}) => {
  const newObj: any = {};
  Object.keys(obj).forEach((key) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  });
  return newObj;
};

const toNumber = (val: any, defaultVal: number | null = null) => {
  if (val === undefined || val === null || val === "") return defaultVal;
  const num = Number(val);
  return Number.isNaN(num) ? defaultVal : num;
};

const cleanPhone = (phone: any) => String(phone || "").replace(/[^0-9]/g, "");

const calculateAge = (dob?: string | null) => {
  if (!dob) return null;

  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  return age;
};

const toGenderNumber = (value: any) => {
  if (value === undefined || value === null || value === "") return null;

  if (value === 1 || value === "1" || String(value).toLowerCase() === "male") {
    return 1;
  }

  if (value === 2 || value === "2" || String(value).toLowerCase() === "female") {
    return 2;
  }

  return null;
};

const getDivisionId = (body: any) =>
  toNumber(body.academic_division ?? body.division_id ?? body.academicDivision);

const validateTeacherPayload = (body: any) => {
  if (!body.name_bn?.trim()) return "নাম বাধ্যতামূলক";

  const divisionId = getDivisionId(body);
  if (!divisionId) return "একাডেমিক বিভাগ বাধ্যতামূলক";

  return null;
};

const normalizeTeacherPayload = (rawBody: any, madrasaId: number) => {
  const body = toSnakeCase(rawBody);
  const divisionId = getDivisionId(body);
  const dob = body.dob || null;

  return {
    madrasa_id: madrasaId,
    division_id: divisionId,

    name_bn: body.name_bn,
    name_ar: body.name_ar || null,
    nid: body.nid || null,
    gender: toGenderNumber(body.gender),
    dob,
    age: toNumber(body.age, calculateAge(dob)),

    phone: cleanPhone(body.phone) || null,
    email: body.email || null,

    designation: body.designation || null,
    department: body.department || null,
    qualification: body.qualification || null,

    experience_year: toNumber(body.experience_year, 0),
    experience_month: toNumber(body.experience_month, 0),

    joining_date: body.joining_date || null,
    salary: toNumber(body.salary),

    father_name: body.father_name || null,
    father_name_ar: body.father_name_ar || null,
    father_nid: body.father_nid || null,
    father_occupation: body.father_occupation || null,

    mother_name: body.mother_name || null,
    mother_nid: body.mother_nid || null,
    mother_occupation: body.mother_occupation || null,

    parent_phone: cleanPhone(body.parent_phone) || null,

    division: body.division || null,
    district: body.district || null,
    thana: body.thana || null,
    village: body.village || null,

    image: body.image || null,
  };
};

const teacherColumns = [
  "madrasa_id",
  "division_id",
  "name_bn",
  "name_ar",
  "nid",
  "gender",
  "dob",
  "age",
  "phone",
  "email",
  "designation",
  "department",
  "qualification",
  "experience_year",
  "experience_month",
  "joining_date",
  "salary",
  "father_name",
  "father_name_ar",
  "father_nid",
  "father_occupation",
  "mother_name",
  "mother_nid",
  "mother_occupation",
  "parent_phone",
  "division",
  "district",
  "thana",
  "village",
  "image",
];

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
    const validationError = validateTeacherPayload(body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const payload = normalizeTeacherPayload(body, madrasaId);

    const sql = `
      INSERT INTO teachers (${teacherColumns.join(", ")})
      VALUES (${teacherColumns.map(() => "?").join(", ")})
    `;

    const values = teacherColumns.map((column) => (payload as any)[column]);
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

export const bulkCreateTeachers = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  try {
    const madrasaId = req.tenant?.madrasa_id;

    if (!madrasaId) {
      return res.status(400).json({ success: false, message: "Tenant madrasa not found" });
    }

    const teachers = Array.isArray(req.body?.teachers) ? req.body.teachers : [];
    if (!teachers.length)
      return res.status(400).json({ success: false, message: "Teacher list is empty" });

    await connection.beginTransaction();
    let inserted = 0;
    let updated = 0;
    const preview: any[] = [];

    for (let i = 0; i < teachers.length; i++) {
      const body = toSnakeCase(teachers[i]);
      const validationError = validateTeacherPayload(body);
      if (validationError)
        return res
          .status(400)
          .json({ success: false, message: `Row ${i + 2}: ${validationError}` });

      const payload = normalizeTeacherPayload(body, madrasaId);
      const nid = payload.nid || null;
      let existing: any = null;
      if (nid) {
        const [rows]: any = await connection.query(
          "SELECT * FROM teachers WHERE madrasa_id=? AND nid=? LIMIT 1",
          [madrasaId, nid],
        );
        existing = rows[0] || null;
      }

      if (existing) {
        const updateColumns = teacherColumns.filter((column) => column !== "madrasa_id");
        const updateValues = updateColumns.map((column) => (payload as any)[column]);
        const changes = updateColumns
          .map((field, index) => ({ field, old: existing[field], new: updateValues[index] }))
          .filter((change) => String(change.old ?? "") !== String(change.new ?? ""));

        if (changes.length) {
          await connection.query(
            `UPDATE teachers SET ${updateColumns.map((column) => `${column}=?`).join(", ")} WHERE id=? AND madrasa_id=?`,
            [...updateValues, existing.id, madrasaId],
          );
        }
        updated++;
        preview.push({ row: i + 2, action: "update", id: existing.id, nid, changes });
      } else {
        const values = teacherColumns.map((column) => (payload as any)[column]);
        const [result]: any = await connection.query(
          `INSERT INTO teachers (${teacherColumns.join(", ")}) VALUES (${teacherColumns.map(() => "?").join(", ")})`,
          values,
        );
        inserted++;
        preview.push({ row: i + 2, action: "create", id: result.insertId, nid, changes: [] });
      }
    }

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Teachers processed successfully",
      inserted,
      updated,
      preview,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("BULK UPSERT TEACHERS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;

    const [rows]: any = await db.query(
      `
        SELECT
          t.*,
          d.name_bn AS academic_division_name
        FROM teachers t
        LEFT JOIN divisions d ON d.id = t.division_id
        WHERE t.madrasa_id = ?
        ORDER BY t.id DESC
      `,
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

export const getTeacherById = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    const [rows]: any = await db.query(
      `
        SELECT
          t.*,
          d.name_bn AS academic_division_name
        FROM teachers t
        LEFT JOIN divisions d ON d.id = t.division_id
        WHERE t.id = ? AND t.madrasa_id = ?
      `,
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

export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    const body = toSnakeCase(req.body);
    const filtered: any = {};

    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined) filtered[key] = body[key];
    });

    if (filtered.academic_division !== undefined) {
      filtered.division_id = filtered.academic_division;
      delete filtered.academic_division;
    }

    if (filtered.division_id !== undefined && !toNumber(filtered.division_id)) {
      return res.status(400).json({
        success: false,
        message: "একাডেমিক বিভাগ বাধ্যতামূলক",
      });
    }

    const allowedFields = teacherColumns.filter((column) => column !== "madrasa_id");

    const fields = Object.keys(filtered).filter((key) => allowedFields.includes(key));

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: "No data to update",
      });
    }

    const numberFields = new Set([
      "age",
      "salary",
      "experience_year",
      "experience_month",
      "division_id",
      "gender",
    ]);

    const setClause = fields.map((f) => `${f} = ?`).join(", ");

    const values = fields.map((f) => {
      const val = filtered[f];

      if (f === "phone" || f === "parent_phone") return cleanPhone(val) || null;
      if (f === "gender") return toGenderNumber(val);
      if (numberFields.has(f)) return toNumber(val);

      return val === "" ? null : val;
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

export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    const [result]: any = await db.query("DELETE FROM teachers WHERE id = ? AND madrasa_id = ?", [
      id,
      madrasaId,
    ]);

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
