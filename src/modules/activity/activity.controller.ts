import { Request, Response } from "express";
import { db } from "../../config/db";

export const getLogs = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const [rows]: any = await db.query(
    `SELECT a.*, u.name
     FROM activity_logs a
     JOIN users u ON u.id=a.user_id
     WHERE a.madrasa_id=?
     ORDER BY a.created_at DESC
     LIMIT 200`,
    [madrasa_id]
  );
  res.json(rows);
};
