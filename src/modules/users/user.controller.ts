import { Request, Response } from "express";
import { db } from "../../config/db";
import { hashPassword } from "../../utils/hash";
import { logActivity } from "../../utils/activity";

export const getUsers = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const [rows]: any = await db.query(
    "SELECT id, name, email, role_id, is_active FROM users WHERE madrasa_id=? ORDER BY id DESC",
    [madrasa_id]
  );
  res.json(rows);
};

export const createUser = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { name, email, password, role_id } = req.body;

  const [mRows]: any = await db.query("SELECT user_limit FROM madrasas WHERE id=?", [madrasa_id]);
  const user_limit = mRows[0]?.user_limit ?? 0;

  const [countRows]: any = await db.query(
    "SELECT COUNT(*) as total FROM users WHERE madrasa_id=? AND is_active=1",
    [madrasa_id]
  );
  if (countRows[0].total >= user_limit) {
    return res.status(400).json({ message: "User limit reached. Upgrade plan." });
  }

  const password_hash = await hashPassword(password);
  const [result]: any = await db.query(
    `INSERT INTO users (madrasa_id, name, email, password_hash, role_id, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [madrasa_id, name, email, password_hash, role_id]
  );

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "CREATE",
    entity: "USER",
    entity_id: result.insertId,
    details: `User ${name} created`,
  });

  res.json({ message: "User created", id: result.insertId });
};

export const deleteUser = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const id = Number(req.params.id);

  await db.query("DELETE FROM users WHERE id=? AND madrasa_id=?", [id, madrasa_id]);

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "DELETE",
    entity: "USER",
    entity_id: id,
    details: `User ${id} deleted`,
  });

  res.json({ message: "Deleted" });
};
