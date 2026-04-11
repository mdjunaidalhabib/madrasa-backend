import { Request, Response } from "express";
import { db } from "../../config/db";

/* =========================================================
   GET ALL STUDENTS (WITH CLASS NAME - FIXED)
========================================================= */
export const getStudents = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;

    if (!madrasaId) {
      return res.status(400).json({
        success: false,
        message: "Tenant madrasa not found",
      });
    }

    const sql = `
      SELECT 
        students.id,
        students.name_bn,
        students.father_name,
        students.guardian_phone,

        students.division_id,
        students.class_id,
        students.previous_class_id,

        classes.name_bn AS current_class

      FROM students

      LEFT JOIN classes 
        ON students.class_id = classes.id

      WHERE students.madrasa_id = ?

      ORDER BY students.id DESC
    `;

    const [rows]: any = await db.query(sql, [madrasaId]);

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

    const sql = `
      SELECT 
        students.*,
        classes.name_bn AS current_class
      FROM students
      LEFT JOIN classes 
        ON students.class_id = classes.id
      WHERE students.id = ? AND students.madrasa_id = ?
    `;

    const [rows]: any = await db.query(sql, [id, madrasaId]);

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

    /* =============================
       REMOVE UNDEFINED FIELDS
    ============================= */
    const filteredBody: any = {};

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        filteredBody[key] = req.body[key];
      }
    });

    const fields = Object.keys(filteredBody);

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: "No data to update",
      });
    }

    /* =============================
       BUILD DYNAMIC QUERY
    ============================= */
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => filteredBody[field]);

    const sql = `
      UPDATE students
      SET ${setClause}
      WHERE id = ? AND madrasa_id = ?
    `;

    const [result]: any = await db.query(sql, [...values, id, madrasaId]);

    return res.json({
      success: true,
      message: "Student Updated Successfully",
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

    const [result]: any = await db.query(
      "DELETE FROM students WHERE id = ? AND madrasa_id = ?",
      [id, madrasaId],
    );

    return res.json({
      success: true,
      message: "Student Deleted",
      affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
