import { Request, Response } from "express";
import { db } from "../../config/db";

export const createAdmission = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // 🔥 MADRASA ID FROM TENANT (SUBDOMAIN)
    const madrasaId = req.tenant?.madrasa_id;

    if (!madrasaId) {
      return res.status(400).json({
        success: false,
        message: "Tenant madrasa not found",
      });
    }

    // =========================
    // VALIDATION
    // =========================
    if (!body.name || !body.nid || !body.division_id || !body.class_id) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // =========================
    // CLEAN PAYLOAD
    // =========================
    const payload = {
      madrasa_id: madrasaId,

      division_id: Number(body.division_id),
      class_id: Number(body.class_id),
      previous_class_id: body.previous_class_id
        ? Number(body.previous_class_id)
        : null,

      name_bn: body.name || null,
      name_ar: body.arabicName || null,
      nid: body.nid || null,
      gender: body.gender || null,
      dob: body.dob || null,
      age: body.age ? Number(body.age) : null,

      father_name: body.fatherName || null,
      father_name_ar: body.fatherArabicName || null,
      father_nid: body.fatherNid || null,
      father_occupation: body.fatherOccupation || null,

      mother_name: body.motherName || null,
      mother_nid: body.motherNid || null,
      mother_occupation: body.motherOccupation || null,

      guardian_phone: body.parentPhone || null,

      division: body.division || null,
      district: body.district || null,
      thana: body.thana || null,
      village: body.village || null,

      image: body.image || null,

      admission_date: new Date(),
    };

    // =========================
    // DB INSERT
    // =========================
    const [result]: any = await db.query("INSERT INTO students SET ?", payload);

    return res.status(201).json({
      success: true,
      message: "Student admitted successfully",
      studentId: result.insertId,
    });
  } catch (error: any) {
    console.error("ADMISSION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Admission failed",
      error: error.message,
    });
  }
};
