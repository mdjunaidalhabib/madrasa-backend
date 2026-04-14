import { Request, Response } from "express";
import { db } from "../../config/db";

/* ================= EXAMS ================= */

export const getExams = async (_: Request, res: Response) => {
  const [rows] = await db.query("SELECT * FROM exams ORDER BY id DESC");
  res.json(rows);
};

export const createExam = async (req: Request, res: Response) => {
  const { name, year } = req.body;

  await db.query("INSERT INTO exams (name, year) VALUES (?, ?)", [name, year]);

  res.json({ success: true });
};

export const deleteExam = async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.query("DELETE FROM exams WHERE id=?", [id]);
  res.json({ success: true });
};

/* ================= GRADES ================= */

export const getGeneralGrades = async (_: Request, res: Response) => {
  const [rows] = await db.query("SELECT * FROM general_grades");
  res.json(rows);
};

export const saveGeneralGrade = async (req: Request, res: Response) => {
  const { name, min_mark, max_mark } = req.body;

  await db.query(
    "INSERT INTO general_grades (name, min_mark, max_mark) VALUES (?, ?, ?)",
    [name, min_mark, max_mark],
  );

  res.json({ success: true });
};

export const getMadrasaGrades = async (_: Request, res: Response) => {
  const [rows] = await db.query("SELECT * FROM madrasa_grades");
  res.json(rows);
};

export const saveMadrasaGrade = async (req: Request, res: Response) => {
  const { name, min_mark, max_mark } = req.body;

  await db.query(
    "INSERT INTO madrasa_grades (name, min_mark, max_mark) VALUES (?, ?, ?)",
    [name, min_mark, max_mark],
  );

  res.json({ success: true });
};

/* ================= SETTINGS ================= */

export const getFailMark = async (_: Request, res: Response) => {
  const [rows]: any = await db.query(
    "SELECT value FROM settings WHERE key_name='fail_mark'",
  );

  res.json(rows[0]?.value || "35");
};

export const updateFailMark = async (req: Request, res: Response) => {
  const { value } = req.body;

  await db.query("UPDATE settings SET value=? WHERE key_name='fail_mark'", [
    value,
  ]);

  res.json({ success: true });
};
