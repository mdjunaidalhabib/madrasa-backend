import { Request, Response } from "express";
import { db } from "../../config/db";

export const createAdmission = async (req: Request, res: Response) => {
  try {
    const {
      name,
      arabicName,
      nid,
      gender,
      dob,
      age,

      academicDivision,
      previousClass,
      currentClass,

      fatherName,
      fatherArabicName,
      fatherNid,
      fatherOccupation,

      motherName,
      motherNid,
      motherOccupation,

      parentPhone,

      division,
      district,
      thana,
      village,

      image,
    } = req.body;

    const madrasaId = 1;

    const sql = `
      INSERT INTO students
      (
        madrasa_id,
        division_id,
        class_id,
        previous_class_id,

        name_bn,
        name_ar,
        nid,
        gender,
        dob,
        age,

        father_name,
        father_name_ar,
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

        image,
        admission_date
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE())
    `;

    const values = [
      madrasaId,
      academicDivision,
      currentClass,
      previousClass,

      name,
      arabicName,
      nid,
      gender,
      dob,
      age,

      fatherName,
      fatherArabicName,
      fatherNid,
      fatherOccupation,

      motherName,
      motherNid,
      motherOccupation,

      parentPhone,

      division,
      district,
      thana,
      village,

      image || null,
    ];

    const [result]: any = await db.query(sql, values);

    res.status(201).json({
      success: true,
      message: "Student admitted successfully",
      studentId: result.insertId,
    });
  } catch (error: any) {
    console.error("ADMISSION ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Admission failed",
      error: error.message,
    });
  }
};
