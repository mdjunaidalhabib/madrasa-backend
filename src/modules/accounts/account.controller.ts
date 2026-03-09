import { Request, Response } from "express";
import { db } from "../../config/db";
import { logActivity } from "../../utils/activity";

export const createIncome = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { amount, description } = req.body;

  const [result]: any = await db.query(
    `INSERT INTO accounts (madrasa_id, type, amount, description) VALUES (?, 'income', ?, ?)`,
    [madrasa_id, amount, description || null]
  );

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "CREATE",
    entity: "INCOME",
    entity_id: result.insertId,
    details: `Income added: ${amount}`,
  });

  res.json({ message: "Income added" });
};

export const createExpense = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const { amount, description } = req.body;

  const [result]: any = await db.query(
    `INSERT INTO accounts (madrasa_id, type, amount, description) VALUES (?, 'expense', ?, ?)`,
    [madrasa_id, amount, description || null]
  );

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "CREATE",
    entity: "EXPENSE",
    entity_id: result.insertId,
    details: `Expense added: ${amount}`,
  });

  res.json({ message: "Expense added" });
};

export const getReport = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const type = String(req.query.type || "monthly");

  let query = "";
  if (type === "daily") {
    query = `
      SELECT DATE(created_at) as period,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense
      FROM accounts
      WHERE madrasa_id=?
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
      LIMIT 365
    `;
  } else if (type === "yearly") {
    query = `
      SELECT YEAR(created_at) as period,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense
      FROM accounts
      WHERE madrasa_id=?
      GROUP BY YEAR(created_at)
      ORDER BY YEAR(created_at) DESC
    `;
  } else {
    query = `
      SELECT DATE_FORMAT(created_at,'%Y-%m') as period,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense
      FROM accounts
      WHERE madrasa_id=?
      GROUP BY DATE_FORMAT(created_at,'%Y-%m')
      ORDER BY period DESC
      LIMIT 120
    `;
  }

  const [rows]: any = await db.query(query, [madrasa_id]);
  res.json(rows);
};
