import { Request, Response } from "express";
import { db } from "../../config/db";

/* ================= GET SINGLE ================= */
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const teacher_id = Number(req.query.teacher_id);
    const class_id = Number(req.query.class_id);

    const [rows]: any = await db.query(
      "SELECT book_id FROM teacher_assignments WHERE teacher_id=? AND class_id=?",
      [teacher_id, class_id],
    );

    return res.json(rows.map((r: any) => Number(r.book_id)));
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= GET ALL ================= */
export const getAllAssignments = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        t.id AS teacher_id,
        t.name_bn AS teacher_name,
        ta.class_id,
        ta.book_id,
        b.name_bn AS book_name_bn
      FROM teacher_assignments ta
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN books b ON b.id = ta.book_id
      ORDER BY t.id
    `);

    const grouped: any = {};

    rows.forEach((row: any) => {
      const key = `${row.teacher_id}-${row.class_id}`;

      if (!grouped[key]) {
        grouped[key] = {
          teacher_id: row.teacher_id,
          teacher_name: row.teacher_name,
          class_id: row.class_id,
          books: [],
        };
      }

      grouped[key].books.push({
        book_id: row.book_id,
        book_name_bn: row.book_name_bn,
      });
    });

    return res.json({
      data: Object.values(grouped),
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
/* ================= CREATE ================= */
export const saveAssignment = async (req: Request, res: Response) => {
  try {
    const teacher_id = Number(req.body.teacher_id);
    const class_id = Number(req.body.class_id);
    const book_ids: number[] = req.body.book_ids || [];

    // ❗ Teacher already assigned? block new create
    const [existing]: any = await db.query(
      "SELECT COUNT(*) as count FROM teacher_assignments WHERE teacher_id=?",
      [teacher_id],
    );

    if (existing[0].count > 0) {
      return res.status(400).json({
        message: "Teacher already has assignment. Use update instead.",
      });
    }

    const values = book_ids.map((b) => [teacher_id, class_id, b]);

    if (values.length > 0) {
      await db.query("INSERT INTO teacher_assignments (teacher_id, class_id, book_id) VALUES ?", [
        values,
      ]);
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const teacher_id = Number(req.body.teacher_id);
    const class_id = Number(req.body.class_id);
    const book_ids: number[] = req.body.book_ids || [];

    await db.query("DELETE FROM teacher_assignments WHERE teacher_id=? AND class_id=?", [
      teacher_id,
      class_id,
    ]);

    const values = book_ids.map((b) => [teacher_id, class_id, b]);

    if (values.length > 0) {
      await db.query("INSERT INTO teacher_assignments (teacher_id, class_id, book_id) VALUES ?", [
        values,
      ]);
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const teacher_id = Number(req.body.teacher_id);
    const class_id = Number(req.body.class_id);

    if (!teacher_id || !class_id) {
      return res.status(400).json({ message: "Invalid request" });
    }

    await db.query("DELETE FROM teacher_assignments WHERE teacher_id=? AND class_id=?", [
      teacher_id,
      class_id,
    ]);

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
