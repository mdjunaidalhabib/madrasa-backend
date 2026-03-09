import { Request, Response } from "express";
import { db } from "../../config/db";

export const getDashboard = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;

  const [students]: any = await db.query("SELECT COUNT(*) as total FROM students WHERE madrasa_id=?", [madrasa_id]);
  const [users]: any = await db.query("SELECT COUNT(*) as total FROM users WHERE madrasa_id=?", [madrasa_id]);
  const [income]: any = await db.query("SELECT SUM(amount) as total FROM accounts WHERE madrasa_id=? AND type='income'", [madrasa_id]);
  const [expense]: any = await db.query("SELECT SUM(amount) as total FROM accounts WHERE madrasa_id=? AND type='expense'", [madrasa_id]);

  res.json({
    students: students[0].total,
    users: users[0].total,
    income: income[0].total || 0,
    expense: expense[0].total || 0,
    balance: (income[0].total || 0) - (expense[0].total || 0),
  });
};
