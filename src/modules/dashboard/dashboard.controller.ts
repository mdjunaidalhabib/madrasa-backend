import { Request, Response } from "express";
import { db } from "../../config/db";

export const getDashboard = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;

  const [students]: any = await db.query(
    "SELECT COUNT(*) as total FROM students WHERE madrasa_id=? AND is_active=1",
    [madrasa_id],
  );
  const [teachers]: any = await db.query(
    "SELECT COUNT(*) as total FROM teachers WHERE madrasa_id=? AND is_active=1",
    [madrasa_id],
  );
  const [users]: any = await db.query("SELECT COUNT(*) as total FROM users WHERE madrasa_id=?", [
    madrasa_id,
  ]);
  const [income]: any = await db.query(
    "SELECT COALESCE(SUM(amount),0) as total FROM accounts WHERE madrasa_id=? AND type='income' AND deleted_at IS NULL",
    [madrasa_id],
  );
  const [expense]: any = await db.query(
    "SELECT COALESCE(SUM(amount),0) as total FROM accounts WHERE madrasa_id=? AND type='expense' AND deleted_at IS NULL",
    [madrasa_id],
  );
  const [today]: any = await db.query(
    `SELECT
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
     FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL AND COALESCE(entry_date, DATE(created_at)) = CURDATE()`,
    [madrasa_id],
  );
  const [funds]: any = await db.query(
    `SELECT fund, SUM(CASE WHEN type='income' THEN amount ELSE -amount END) AS balance
     FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL GROUP BY fund ORDER BY fund`,
    [madrasa_id],
  );
  const [recent]: any = await db.query(
    `SELECT id,type,amount,fund,category,payment_method,COALESCE(entry_date, DATE(created_at)) as entry_date
     FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL ORDER BY COALESCE(entry_date, DATE(created_at)) DESC, id DESC LIMIT 8`,
    [madrasa_id],
  );

  res.json({
    students: students[0].total,
    teachers: teachers[0].total,
    users: users[0].total,
    income: Number(income[0].total || 0),
    expense: Number(expense[0].total || 0),
    balance: Number(income[0].total || 0) - Number(expense[0].total || 0),
    todayIncome: Number(today[0].income || 0),
    todayExpense: Number(today[0].expense || 0),
    fundBalances: funds,
    recentTransactions: recent,
  });
};
