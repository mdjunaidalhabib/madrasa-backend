import { Request, Response } from "express";
import { db } from "../../config/db";
import { logActivity } from "../../utils/activity";

export const getStudents = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const page = Number(req.query.page || 1);
  const search = String(req.query.search || "");
  const limit = 10;
  const offset = (page - 1) * limit;

  const [rows]: any = await db.query(
    `SELECT * FROM students
     WHERE madrasa_id=? AND name_bn LIKE ?
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [madrasa_id, `%${search}%`, limit, offset]
  );
  res.json(rows);
};

export const getStudentById = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const id = Number(req.params.id);

  const [rows]: any = await db.query(
    "SELECT * FROM students WHERE id=? AND madrasa_id=?",
    [id, madrasa_id]
  );
  if (!rows.length) return res.status(404).json({ message: "Student not found" });
  res.json(rows[0]);
};

export const createStudent = async (req: Request, res: Response) => {
  const { name_bn, division_id, class_id, is_active } = req.body;
  const madrasa_id = req.tenant!.madrasa_id;

  // limit
  const [mRows]: any = await db.query("SELECT student_limit FROM madrasas WHERE id=?", [madrasa_id]);
  const student_limit = mRows[0]?.student_limit ?? 0;

  const [countRows]: any = await db.query(
    "SELECT COUNT(*) as total FROM students WHERE madrasa_id=? AND is_active=1",
    [madrasa_id]
  );
  if (countRows[0].total >= student_limit) {
    return res.status(400).json({ message: "Student limit reached. Upgrade plan." });
  }

  const [result]: any = await db.query(
    `INSERT INTO students (madrasa_id, division_id, class_id, name_bn, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [madrasa_id, division_id, class_id, name_bn, is_active ? 1 : 0]
  );

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "CREATE",
    entity: "STUDENT",
    entity_id: result.insertId,
    details: `Student ${name_bn} created`,
  });

  res.json({ message: "Student created", id: result.insertId });
};

export const updateStudent = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const id = Number(req.params.id);

  const { name_bn, division_id, class_id, is_active } = req.body;

  await db.query(
    `UPDATE students
     SET name_bn=COALESCE(?, name_bn),
         division_id=COALESCE(?, division_id),
         class_id=COALESCE(?, class_id),
         is_active=COALESCE(?, is_active)
     WHERE id=? AND madrasa_id=?`,
    [name_bn ?? null, division_id ?? null, class_id ?? null, typeof is_active === "boolean" ? (is_active ? 1 : 0) : null, id, madrasa_id]
  );

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "UPDATE",
    entity: "STUDENT",
    entity_id: id,
    details: `Student ${id} updated`,
  });

  res.json({ message: "Updated" });
};

export const deleteStudent = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const id = Number(req.params.id);

  await db.query("DELETE FROM students WHERE id=? AND madrasa_id=?", [id, madrasa_id]);

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "DELETE",
    entity: "STUDENT",
    entity_id: id,
    details: `Student ${id} deleted`,
  });

  res.json({ message: "Deleted" });
};
