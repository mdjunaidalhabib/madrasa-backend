import { Request, Response } from "express";
import { db } from "../../config/db";

export const createResult = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { student_id, subject_id, marks } = req.body;

  await db.query(
    `INSERT INTO results (madrasa_id, student_id, subject_id, marks)
     VALUES (?, ?, ?, ?)`,
    [madrasa_id, student_id, subject_id, marks]
  );

  res.json({ message: "Result saved" });
};

export const getMarksheet = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const student_id = Number(req.params.student_id);

  const [rows]: any = await db.query(
    `SELECT s.name_bn as subject, r.marks
     FROM results r
     JOIN subjects s ON s.id = r.subject_id
     WHERE r.student_id=? AND r.madrasa_id=?`,
    [student_id, madrasa_id]
  );

  let total = 0;
  rows.forEach((r: any) => (total += Number(r.marks)));

  const average = rows.length ? total / rows.length : 0;
  let grade = "F";
  if (average >= 80) grade = "A+";
  else if (average >= 70) grade = "A";
  else if (average >= 60) grade = "A-";
  else if (average >= 50) grade = "B";
  else if (average >= 40) grade = "C";

  res.json({ subjects: rows, total, average, grade });
};
