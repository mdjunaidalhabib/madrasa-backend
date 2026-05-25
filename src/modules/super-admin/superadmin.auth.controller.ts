import { Request, Response } from "express";
import { db } from "../../config/db";
import { comparePassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";

export const superAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const [rows]: any = await db.query(
      "SELECT * FROM super_admins WHERE email=? AND is_active=1 LIMIT 1",
      [email],
    );

    if (!rows || !rows.length) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const admin = rows[0];

    if (!admin?.password_hash) {
      return res.status(500).json({ message: "Super admin password is not configured" });
    }

    const valid = await comparePassword(password, admin.password_hash);

    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: admin.id,
      role: "super_admin",
    });

    return res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err: any) {
    console.error("Super admin login failed:", err?.message || err);

    return res.status(500).json({
      message: "Super admin login failed",
    });
  }
};
