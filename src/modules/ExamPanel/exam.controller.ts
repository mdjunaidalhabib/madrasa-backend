import { Request, Response } from "express";
import { db } from "../../config/db";

/* ================= HELPERS ================= */
const getSchoolId = (req: Request) => {
  return Number(
    (req as any)?.user?.school_id ||
      req.body?.school_id ||
      req.query?.school_id ||
      1,
  );
};

const isEmpty = (value: any) =>
  value === undefined || value === null || String(value).trim() === "";

/* ================= EXAMS ================= */

export const getExams = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);

  try {
    const [rows] = await db.query(
      "SELECT * FROM exams WHERE school_id=? ORDER BY id DESC",
      [school_id],
    );

    return res.json(rows);
  } catch (err) {
    console.error("getExams error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load exams" });
  }
};

export const createExam = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const { name, year } = req.body;

  if (isEmpty(name) || isEmpty(year)) {
    return res.status(400).json({
      success: false,
      message: "Name and year are required",
    });
  }

  try {
    await db.query(
      "INSERT INTO exams (name, year, school_id) VALUES (?, ?, ?)",
      [String(name).trim(), String(year).trim(), school_id],
    );

    return res.json({ success: true, message: "Exam created successfully" });
  } catch (err: any) {
    console.error("createExam error:", err);

    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This exam already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create exam",
    });
  }
};

export const deleteExam = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const { id } = req.params;

  try {
    const [result]: any = await db.query(
      "DELETE FROM exams WHERE id=? AND school_id=?",
      [id, school_id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    return res.json({ success: true, message: "Exam deleted successfully" });
  } catch (err) {
    console.error("deleteExam error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete exam",
    });
  }
};

/* ================= GENERAL GRADES ================= */

export const getGeneralGrades = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);

  try {
    const [rows] = await db.query(
      "SELECT * FROM general_grades WHERE school_id=? ORDER BY max_mark DESC, id DESC",
      [school_id],
    );

    return res.json(rows);
  } catch (err) {
    console.error("getGeneralGrades error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load general grades",
    });
  }
};

export const saveGeneralGrade = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const { name, min_mark, max_mark } = req.body;

  if (isEmpty(name) || min_mark === undefined || max_mark === undefined) {
    return res.status(400).json({
      success: false,
      message: "Name, min_mark and max_mark are required",
    });
  }

  const min = Number(min_mark);
  const max = Number(max_mark);

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return res.status(400).json({
      success: false,
      message: "Marks must be numbers",
    });
  }

  if (min < 0 || max > 100 || min > max) {
    return res.status(400).json({
      success: false,
      message: "Invalid mark range",
    });
  }

  try {
    await db.query(
      "INSERT INTO general_grades (name, min_mark, max_mark, school_id) VALUES (?, ?, ?, ?)",
      [String(name).trim(), min, max, school_id],
    );

    return res.json({
      success: true,
      message: "General grade added successfully",
    });
  } catch (err: any) {
    console.error("saveGeneralGrade error:", err);

    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This general grade already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save general grade",
    });
  }
};

export const deleteGeneralGrade = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const { id } = req.params;

  try {
    const [result]: any = await db.query(
      "DELETE FROM general_grades WHERE id=? AND school_id=?",
      [id, school_id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "General grade not found",
      });
    }

    return res.json({
      success: true,
      message: "General grade deleted successfully",
    });
  } catch (err) {
    console.error("deleteGeneralGrade error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete general grade",
    });
  }
};

/* ================= MADRASA GRADES ================= */

export const getMadrasaGrades = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);

  try {
    const [rows] = await db.query(
      "SELECT * FROM madrasa_grades WHERE school_id=? ORDER BY max_mark DESC, id DESC",
      [school_id],
    );

    return res.json(rows);
  } catch (err) {
    console.error("getMadrasaGrades error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load madrasa grades",
    });
  }
};

export const saveMadrasaGrade = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const { name, min_mark, max_mark } = req.body;

  if (isEmpty(name) || min_mark === undefined || max_mark === undefined) {
    return res.status(400).json({
      success: false,
      message: "Name, min_mark and max_mark are required",
    });
  }

  const min = Number(min_mark);
  const max = Number(max_mark);

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return res.status(400).json({
      success: false,
      message: "Marks must be numbers",
    });
  }

  if (min < 0 || max > 100 || min > max) {
    return res.status(400).json({
      success: false,
      message: "Invalid mark range",
    });
  }

  try {
    await db.query(
      "INSERT INTO madrasa_grades (name, min_mark, max_mark, school_id) VALUES (?, ?, ?, ?)",
      [String(name).trim(), min, max, school_id],
    );

    return res.json({
      success: true,
      message: "Madrasa grade added successfully",
    });
  } catch (err: any) {
    console.error("saveMadrasaGrade error:", err);

    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This madrasa grade already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save madrasa grade",
    });
  }
};

export const deleteMadrasaGrade = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const { id } = req.params;

  try {
    const [result]: any = await db.query(
      "DELETE FROM madrasa_grades WHERE id=? AND school_id=?",
      [id, school_id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Madrasa grade not found",
      });
    }

    return res.json({
      success: true,
      message: "Madrasa grade deleted successfully",
    });
  } catch (err) {
    console.error("deleteMadrasaGrade error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete madrasa grade",
    });
  }
};

/* ================= SETTINGS ================= */

export const getFailMark = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);

  try {
    const [rows]: any = await db.query(
      "SELECT value FROM settings WHERE name='fail_mark' AND school_id=? LIMIT 1",
      [school_id],
    );

    return res.json(rows[0]?.value || "35");
  } catch (err) {
    console.error("getFailMark error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load fail mark",
    });
  }
};

export const updateFailMark = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const { value } = req.body;

  if (value === undefined || value === null || value === "") {
    return res.status(400).json({
      success: false,
      message: "Value is required",
    });
  }

  const failValue = Number(value);

  if (Number.isNaN(failValue) || failValue < 0 || failValue > 100) {
    return res.status(400).json({
      success: false,
      message: "Fail mark must be a number between 0 and 100",
    });
  }

  try {
    await db.query(
      `INSERT INTO settings (name, value, school_id)
       VALUES ('fail_mark', ?, ?)
       ON DUPLICATE KEY UPDATE value=VALUES(value)`,
      [String(failValue), school_id],
    );

    return res.json({
      success: true,
      message: "Fail mark updated successfully",
    });
  } catch (err) {
    console.error("updateFailMark error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update fail mark",
    });
  }
};
