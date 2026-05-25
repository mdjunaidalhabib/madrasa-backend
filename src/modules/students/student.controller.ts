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
  value === undefined || value === null || value === "" ? null : value;

const toNumber = (value: any) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const toGenderNumber = (value: any) => {
  if (value === undefined || value === null || value === "") return null;

  const num = Number(value);

  if (num === 1 || num === 2) return num;

  return null;
};

const requiredFields = ["name_bn", "division_id", "class_id"];

const validateRequiredFields = (body: any) => {
  return requiredFields.filter((field) => {
    const value = body[field];

    if (typeof value === "string") {
      return value.trim() === "";
    }

    return value === undefined || value === null;
  });
};

const makeStudentValues = (body: any, madrasaId: number) => {
  return [
    madrasaId,
    String(body.name_bn || "").trim(),
    clean(body.arabic_name),
    clean(body.nid),
    toGenderNumber(body.gender),
    clean(body.dob),
    toNumber(body.age),

    toNumber(body.division_id),
    toNumber(body.class_id),
    toNumber(body.previous_class_id),

    clean(body.father_name),
    clean(body.father_arabic_name),
    clean(body.father_nid),
    clean(body.father_occupation),

    clean(body.mother_name),
    clean(body.mother_nid),
    clean(body.mother_occupation),

    clean(body.guardian_phone),

    clean(body.division),
    clean(body.district),
    clean(body.thana),
    clean(body.village),

    clean(body.image),
  ];
};

const insertStudentSql = `
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
        s.gender,
        c.name_bn AS current_class
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.madrasa_id = ?
    `;

    const params: any[] = [madrasaId];

    if (divisionId) {
      sql += ` AND s.division_id = ?`;
      params.push(Number(divisionId));
    }

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
   CREATE SINGLE STUDENT
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

    const body = req.body || {};

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Empty request body (Check express.json())",
      });
    }

    const missing = validateRequiredFields(body);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
        missing_fields: missing,
        received: body,
      });
    }

    if (body.dob && !isValidDate(body.dob)) {
      return res.status(400).json({
        success: false,
        message: "Invalid DOB",
      });
    }

    const values = makeStudentValues(body, madrasaId);

    const [result]: any = await db.query(insertStudentSql, values);

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
   CREATE BULK STUDENTS FROM EXCEL
========================================================= */
export const createStudentsBulk = async (req: Request, res: Response) => {
  const connection = await db.getConnection();

  try {
    const madrasaId = req.tenant?.madrasa_id;

    if (!madrasaId) {
      return res.status(400).json({ success: false, message: "Tenant madrasa not found" });
    }

    const students = req.body?.students;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: "Students array is required" });
    }

    await connection.beginTransaction();

    let inserted = 0;
    let updated = 0;
    const preview: any[] = [];

    for (let index = 0; index < students.length; index++) {
      const student = students[index];
      const missing = validateRequiredFields(student);
      if (missing.length > 0)
        throw new Error(`Row ${index + 1}: Required fields missing - ${missing.join(", ")}`);
      if (student.dob && !isValidDate(student.dob))
        throw new Error(`Row ${index + 1}: Invalid DOB`);

      const nid = clean(student.nid);
      let existing: any = null;
      if (nid) {
        const [rows]: any = await connection.query(
          "SELECT * FROM students WHERE madrasa_id=? AND nid=? LIMIT 1",
          [madrasaId, nid],
        );
        existing = rows[0] || null;
      }

      const values = makeStudentValues(student, madrasaId);

      if (existing) {
        const fields = [
          "madrasa_id",
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
        const updateFields = fields.slice(1);
        const updateValues = values.slice(1);
        const changes = updateFields
          .map((field, i) => ({ field, old: existing[field], new: updateValues[i] }))
          .filter((change) => String(change.old ?? "") !== String(change.new ?? ""));

        if (changes.length) {
          await connection.query(
            `UPDATE students SET ${updateFields.map((field) => `${field}=?`).join(", ")} WHERE id=? AND madrasa_id=?`,
            [...updateValues, existing.id, madrasaId],
          );
        }
        updated++;
        preview.push({ row: index + 1, action: "update", id: existing.id, nid, changes });
      } else {
        const [result]: any = await connection.query(insertStudentSql, values);
        inserted++;
        preview.push({ row: index + 1, action: "create", id: result.insertId, nid, changes: [] });
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: "Bulk admission processed",
      inserted,
      updated,
      preview,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("🔥 BULK UPSERT STUDENT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

/* =========================================================
   UPDATE STUDENT
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
        if (key === "gender") {
          filteredBody[key] = toGenderNumber(req.body[key]);
        } else if (
          key === "age" ||
          key === "division_id" ||
          key === "class_id" ||
          key === "previous_class_id"
        ) {
          filteredBody[key] = toNumber(req.body[key]);
        } else {
          filteredBody[key] = clean(req.body[key]);
        }
      }
    }

    const fields = Object.keys(filteredBody);

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: "No valid data to update",
      });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => filteredBody[field]);

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

    const [result]: any = await db.query("DELETE FROM students WHERE id = ? AND madrasa_id = ?", [
      id,
      madrasaId,
    ]);

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
