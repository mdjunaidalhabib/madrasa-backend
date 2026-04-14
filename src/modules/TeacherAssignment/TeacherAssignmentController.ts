import { Request, Response } from "express";
import { db } from "../../config/db";

/* ================= SINGLE ================= */
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const teacher_id = Number(req.query.teacher_id);
    const class_id = Number(req.query.class_id);

    if (!teacher_id || !class_id) {
      return res.status(400).json({ message: "Missing data" });
    }

    const result: any = await db.query(
      "SELECT book_id FROM teacher_assignments WHERE teacher_id=? AND class_id=?",
      [teacher_id, class_id],
    );

    const rows = Array.isArray(result) ? result[0] : result;

    return res.json(rows.map((r: any) => Number(r.book_id)));
  } catch (err: any) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

/* ================= ALL ================= */
export const getAllAssignments = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        t.id AS teacher_id,
        t.name_bn AS teacher_name,
        ta.book_id,
        b.name_bn AS book_name_bn
      FROM teacher_assignments ta
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN books b ON b.id = ta.book_id
      ORDER BY t.id
    `);

    const grouped: any = {};

    rows.forEach((row: any) => {
      if (!grouped[row.teacher_id]) {
        grouped[row.teacher_id] = {
          teacher_name: row.teacher_name,
          books: [],
        };
      }

      grouped[row.teacher_id].books.push({
        book_id: row.book_id,
        book_name_bn: row.book_name_bn,
      });
    });

    return res.json(Object.values(grouped));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
/* ================= SAVE ================= */
export const saveAssignments = async (req: Request, res: Response) => {
  try {
    const teacher_id = Number(req.body.teacher_id);
    const class_id = Number(req.body.class_id);
    const book_ids: number[] = req.body.book_ids || [];

    await db.query(
      "DELETE FROM teacher_assignments WHERE teacher_id=? AND class_id=?",
      [teacher_id, class_id],
    );

    if (book_ids.length > 0) {
      const values = book_ids.map((b) => [teacher_id, class_id, Number(b)]);

      await db.query(
        "INSERT INTO teacher_assignments (teacher_id, class_id, book_id) VALUES ?",
        [values],
      );
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
