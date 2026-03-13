import { Request, Response } from "express";
import { db } from "../../config/db";

/* =============================
   GET ALL STUDENTS
============================= */
export const getStudents = async (req: Request, res: Response) => {
  try {
    const madrasaId = 1;

    const sql = `
      SELECT id,name_bn,father_name,guardian_phone
      FROM students
      WHERE madrasa_id = ?
      ORDER BY id DESC
    `;

    const [rows]: any = await db.query(sql, [madrasaId]);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =============================
   GET SINGLE STUDENT
============================= */
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows]: any = await db.query("SELECT * FROM students WHERE id = ?", [
      id,
    ]);

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =============================
   UPDATE STUDENT
============================= */
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sql = `
      UPDATE students SET

      name_bn=?,
      name_ar=?,
      nid=?,
      gender=?,
      dob=?,
      age=?,

      father_name=?,
      father_name_ar=?,
      father_nid=?,
      father_occupation=?,

      mother_name=?,
      mother_nid=?,
      mother_occupation=?,

      guardian_phone=?,

      division=?,
      district=?,
      thana=?,
      village=?,

      image=?,
      roll=?

      WHERE id=?
    `;

    const values = [
      req.body.name_bn,
      req.body.name_ar,
      req.body.nid,
      req.body.gender,
      req.body.dob,
      req.body.age,

      req.body.father_name,
      req.body.father_name_ar,
      req.body.father_nid,
      req.body.father_occupation,

      req.body.mother_name,
      req.body.mother_nid,
      req.body.mother_occupation,

      req.body.guardian_phone,

      req.body.division,
      req.body.district,
      req.body.thana,
      req.body.village,

      req.body.image,
      req.body.roll,

      id,
    ];

    await db.query(sql, values);

    res.json({
      success: true,
      message: "Student Updated",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =============================
   DELETE STUDENT
============================= */
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM students WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Student Deleted",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
