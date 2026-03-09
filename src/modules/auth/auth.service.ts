import { db } from "../../config/db";
import { comparePassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";

export const loginService = async (
  email: string,
  password: string,
  madrasa_id: number,
) => {
  console.log("===== LOGIN ATTEMPT =====");
  console.log("EMAIL:", email);
  console.log("MADRASA ID:", madrasa_id);

  /* =========================
     FIND USER
  ========================= */

  const [rows]: any = await db.query(
    "SELECT * FROM users WHERE email=? AND madrasa_id=? AND is_active=1 LIMIT 1",
    [email, madrasa_id],
  );

  console.log("USER QUERY RESULT:", rows);

  if (!rows.length) {
    console.log("❌ USER NOT FOUND");
    throw new Error("Invalid credentials");
  }

  const user = rows[0];

  console.log("✅ USER FOUND:", {
    id: user.id,
    email: user.email,
    role_id: user.role_id,
  });

  /* =========================
     VERIFY PASSWORD
  ========================= */

  const valid = await comparePassword(password, user.password_hash);

  console.log("PASSWORD MATCH:", valid);

  if (!valid) {
    console.log("❌ PASSWORD INVALID");
    throw new Error("Invalid credentials");
  }

  console.log("✅ PASSWORD VERIFIED");

  /* =========================
     LOAD PERMISSIONS
  ========================= */

  const [permRows]: any = await db.query(
    `
    SELECT p.key_name
    FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    WHERE rp.role_id = ?
    `,
    [user.role_id],
  );

  const permissions = permRows.map((p: any) => p.key_name);

  console.log("PERMISSIONS:", permissions);

  /* =========================
     CREATE TOKEN
  ========================= */

  const token = generateToken({
    id: user.id,
    madrasa_id: user.madrasa_id,
    role_id: user.role_id,
  });

  console.log("TOKEN GENERATED");

  /* =========================
     LOAD ENABLED MODULES
  ========================= */

  const [modRows]: any = await db.query(
    `
    SELECT m.key_name
    FROM madrasa_modules mm
    JOIN modules m ON m.id = mm.module_id
    WHERE mm.madrasa_id = ?
      AND mm.is_active = 1
    `,
    [user.madrasa_id],
  );

  const modules = modRows.map((m: any) => m.key_name);

  console.log("MODULES:", modules);

  console.log("===== LOGIN SUCCESS =====");

  /* =========================
     RESPONSE
  ========================= */

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
    },
    permissions,
    modules,
  };
};
