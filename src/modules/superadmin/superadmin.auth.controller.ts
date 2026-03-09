import { Request, Response } from "express";
import { db } from "../../config/db";
import { comparePassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";

export const superAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log("=== SUPER ADMIN LOGIN START ===");
    console.log("Request Body:", req.body);

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ message: "Email and password required" });
    }

    console.log("Checking admin with email:", email);

    const [rows]: any = await db.query(
      "SELECT * FROM super_admins WHERE email=? AND is_active=1",
      [email],
    );

    console.log("DB rows:", rows);

    if (!rows || !rows.length) {
      console.log("No admin found with this email or inactive");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const admin = rows[0];

    console.log("Admin record:", admin);

    if (!admin?.password_hash) {
      console.log("Password hash missing in DB!");
      return res.status(500).json({ message: "Password hash missing in DB" });
    }

    console.log("Comparing password...");
    console.log("Input password:", password);
    console.log("Stored hash:", admin.password_hash);

    const valid = await comparePassword(password, admin.password_hash);

    console.log("Password match result:", valid);

    if (!valid) {
      console.log("Password mismatch");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password correct, generating token...");

    const token = generateToken({
      id: admin.id,
      role: "super_admin",
    });

    console.log("Token generated:", token);

    console.log("=== LOGIN SUCCESS ===");

    return res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err: any) {
    console.error("=== SUPER ADMIN LOGIN ERROR ===");
    console.error("Error object:", err);
    console.error(
      "code:",
      err?.code,
      "errno:",
      err?.errno,
      "sqlState:",
      err?.sqlState,
    );
    console.error("sqlMessage:", err?.sqlMessage);

    return res.status(500).json({
      message: err?.sqlMessage || err?.message || "Server error",
    });
  }
};
