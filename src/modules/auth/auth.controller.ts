import { Request, Response } from "express";
import { loginService } from "./auth.service";
import { db } from "../../config/db";
import { comparePassword } from "../../utils/hash";

/* =========================================
   LOGIN
========================================= */

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const madrasa_id = req.tenant!.madrasa_id;

    const result = await loginService(email, password, madrasa_id);

    res.json(result);
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Login failed",
    });
  }
};

/* =========================================
   UNLOCK SCREEN
========================================= */

export const unlockScreen = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    const user_id = req.user!.id;
    const madrasa_id = req.tenant!.madrasa_id;

    const [rows]: any = await db.query(
      `
      SELECT password_hash 
      FROM users 
      WHERE id=? 
        AND madrasa_id=? 
        AND is_active=1
      `,
      [user_id, madrasa_id],
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const ok = await comparePassword(password, rows[0].password_hash);

    if (!ok) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    res.json({
      message: "Unlocked",
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message || "Unlock failed",
    });
  }
};
