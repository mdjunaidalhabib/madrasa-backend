import { Request, Response } from "express";
import { db } from "../../config/db";

/* ─── existing ─────────────────────────────────────── */
export const createResult = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { student_id, subject_id, marks } = req.body;
  await db.query(
    `INSERT INTO results (madrasa_id, student_id, subject_id, marks) VALUES (?, ?, ?, ?)`,
    [madrasa_id, student_id, subject_id, marks],
  );
  res.json({ message: "Result saved" });
};

export const getMarksheet = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const student_id = Number(req.params.student_id);
  const [rows]: any = await db.query(
    `SELECT s.name_bn as subject, r.marks
     FROM results r JOIN subjects s ON s.id = r.subject_id
     WHERE r.student_id=? AND r.madrasa_id=?`,
    [student_id, madrasa_id],
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

/* ─── ID Card data ──────────────────────────────────── */
export const getIdCardData = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { class_id, division_id } = req.query;
  let sql = `
    SELECT s.id, s.name_bn, s.father_name, s.guardian_phone, s.image,
           c.name_bn AS class_name, d.name_bn AS division_name,
           m.name AS madrasa_name, m.address AS madrasa_address, m.phone AS madrasa_phone
    FROM students s
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN divisions d ON d.id = s.division_id
    LEFT JOIN madrasas m ON m.id = s.madrasa_id
    WHERE s.madrasa_id = ?`;
  const params: any[] = [madrasa_id];
  if (class_id) {
    sql += ` AND s.class_id = ?`;
    params.push(Number(class_id));
  }
  if (division_id) {
    sql += ` AND s.division_id = ?`;
    params.push(Number(division_id));
  }
  sql += ` ORDER BY s.id DESC`;
  const [rows]: any = await db.query(sql, params);
  res.json({ data: rows });
};

/* ─── Admit Card data ───────────────────────────────── */
export const getAdmitCardData = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { exam_id, class_id } = req.query;
  if (!exam_id) return res.status(400).json({ message: "exam_id বাধ্যতামূলক" });
  let sql = `
    SELECT s.id AS student_id, s.name_bn, s.father_name, s.image,
           c.name_bn AS class_name, d.name_bn AS division_name,
           e.name_bn AS exam_name, e.session,
           m.name AS madrasa_name
    FROM students s
    LEFT JOIN classes c   ON c.id = s.class_id
    LEFT JOIN divisions d ON d.id = s.division_id
    LEFT JOIN exams e     ON e.id = ?
    LEFT JOIN madrasas m  ON m.id = s.madrasa_id
    WHERE s.madrasa_id = ?`;
  const params: any[] = [Number(exam_id), madrasa_id];
  if (class_id) {
    sql += ` AND s.class_id = ?`;
    params.push(Number(class_id));
  }
  sql += ` ORDER BY s.id`;
  const [rows]: any = await db.query(sql, params);
  res.json({ data: rows });
};

/* ─── Certificate data ──────────────────────────────── */
export const getCertificateData = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { student_id } = req.params;
  const [students]: any = await db.query(
    `SELECT s.*, c.name_bn AS class_name, d.name_bn AS division_name,
            m.name AS madrasa_name, m.address AS madrasa_address
     FROM students s
     LEFT JOIN classes c   ON c.id = s.class_id
     LEFT JOIN divisions d ON d.id = s.division_id
     LEFT JOIN madrasas m  ON m.id = s.madrasa_id
     WHERE s.id = ? AND s.madrasa_id = ? LIMIT 1`,
    [student_id, madrasa_id],
  );
  if (!students.length) return res.status(404).json({ message: "ছাত্র পাওয়া যায়নি" });
  const student = students[0];
  const [results]: any = await db.query(
    `SELECT sub.name_bn AS subject, r.marks
     FROM results r JOIN subjects sub ON sub.id = r.subject_id
     WHERE r.student_id = ? AND r.madrasa_id = ?`,
    [student_id, madrasa_id],
  );
  res.json({ student, results });
};

/* ─── Testimonial data ──────────────────────────────── */
export const getTestimonialData = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { student_id } = req.params;
  const [rows]: any = await db.query(
    `SELECT s.name_bn, s.father_name, s.division AS address_division, s.district, s.thana, s.village,
            c.name_bn AS class_name, d.name_bn AS division_name,
            m.name AS madrasa_name, m.address AS madrasa_address
     FROM students s
     LEFT JOIN classes c   ON c.id = s.class_id
     LEFT JOIN divisions d ON d.id = s.division_id
     LEFT JOIN madrasas m  ON m.id = s.madrasa_id
     WHERE s.id = ? AND s.madrasa_id = ? LIMIT 1`,
    [student_id, madrasa_id],
  );
  if (!rows.length) return res.status(404).json({ message: "ছাত্র পাওয়া যায়নি" });
  res.json({ student: rows[0] });
};

/* ─── Transfer Letter data ──────────────────────────── */
export const getTransferData = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { student_id } = req.params;
  const [rows]: any = await db.query(
    `SELECT s.id, s.name_bn, s.father_name,
            c.name_bn AS class_name, d.name_bn AS division_name,
            m.name AS madrasa_name
     FROM students s
     LEFT JOIN classes c   ON c.id = s.class_id
     LEFT JOIN divisions d ON d.id = s.division_id
     LEFT JOIN madrasas m  ON m.id = s.madrasa_id
     WHERE s.id = ? AND s.madrasa_id = ? LIMIT 1`,
    [student_id, madrasa_id],
  );
  if (!rows.length) return res.status(404).json({ message: "ছাত্র পাওয়া যায়নি" });
  res.json({ student: rows[0] });
};

/* ─── Bulk Marks Import ─────────────────────────────── */
export const bulkImportMarks = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { exam_id, rows } = req.body;
  if (!exam_id || !Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ message: "exam_id ও rows বাধ্যতামূলক" });

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const { student_id, subject_id, marks } = rows[i];
    if (!student_id || !subject_id || marks === undefined) {
      errors.push(`Row ${i + 1}: student_id, subject_id ও marks বাধ্যতামূলক`);
      continue;
    }
    const [ex]: any = await db.query(
      `SELECT id FROM results WHERE madrasa_id=? AND exam_id=? AND student_id=? AND subject_id=? LIMIT 1`,
      [madrasa_id, exam_id, student_id, subject_id],
    );
    if (ex.length) {
      await db.query(`UPDATE results SET marks=? WHERE id=?`, [Number(marks), ex[0].id]);
      updated++;
    } else {
      await db.query(
        `INSERT INTO results (madrasa_id, exam_id, student_id, subject_id, marks) VALUES (?,?,?,?,?)`,
        [madrasa_id, exam_id, student_id, subject_id, Number(marks)],
      );
      inserted++;
    }
  }
  res.json({ message: `${inserted} টি নতুন, ${updated} টি আপডেট`, inserted, updated, errors });
};
