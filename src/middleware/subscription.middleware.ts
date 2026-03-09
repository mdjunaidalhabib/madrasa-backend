import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";

export const subscriptionCheck = async (req: Request, res: Response, next: NextFunction) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const [rows]: any = await db.query(
    `SELECT end_date FROM madrasa_subscriptions WHERE madrasa_id=? AND is_active=1`,
    [madrasa_id]
  );
  if (!rows.length) return res.status(403).json({ message: "No active subscription" });

  const today = new Date();
  const expiry = new Date(rows[0].end_date);
  if (today > expiry) return res.status(403).json({ message: "Subscription expired. Please upgrade." });

  next();
};
