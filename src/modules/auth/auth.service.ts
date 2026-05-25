import { db } from "../../config/db";
import { comparePassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";

export const loginService = async (email: string, password: string, madrasa_id: number) => {
  /* =========================
     FIND USER
  ========================= */

  const [rows]: any = await db.query(
    "SELECT * FROM users WHERE email=? AND madrasa_id=? AND is_active=1 LIMIT 1",
    [email, madrasa_id],
  );

  if (!rows.length) {
    throw new Error("Invalid credentials");
  }

  const user = rows[0];

  const [roleRows]: any = await db.query(
    `SELECT key_name, name_bn FROM roles WHERE id = ? LIMIT 1`,
    [user.role_id],
  );
  const roleKey = String(roleRows?.[0]?.key_name || roleRows?.[0]?.name_bn || "")
    .trim()
    .toUpperCase();

  /* =========================
     VERIFY PASSWORD
  ========================= */

  const valid = await comparePassword(password, user.password_hash);

  if (!valid) {
    throw new Error("Invalid credentials");
  }

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

  const dbPermissions = permRows.map((p: any) => p.key_name);
  const permissionSet = new Set<string>(dbPermissions);

  if (roleKey === "MUHTAMIM" || roleKey === "মুহতামিম") {
    [
      "students.read",
      "students.create",
      "students.update",
      "students.delete",
      "users.read",
      "users.create",
      "users.delete",
      "accounts.read",
      "accounts.create",
      "accounts.update",
      "accounts.delete",
      "talimat.manage",
      "activity.read",
    ].forEach((permission) => permissionSet.add(permission));
  }

  if (roleKey === "TALIMAT" || roleKey === "তালিমাত") {
    ["talimat.manage", "students.read", "students.create", "students.update"].forEach(
      (permission) => permissionSet.add(permission),
    );
  }

  if (roleKey === "ACCOUNTANT" || roleKey === "হিসাবরক্ষক" || roleKey === "হিসাব রক্ষক") {
    ["accounts.read", "accounts.create", "accounts.update", "accounts.delete"].forEach(
      (permission) => permissionSet.add(permission),
    );
  }

  const permissions = Array.from(permissionSet);

  /* =========================
     CREATE TOKEN
  ========================= */

  const token = generateToken({
    id: user.id,
    madrasa_id: user.madrasa_id,
    role_id: user.role_id,
  });

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
      role_key: roleKey,
    },
    permissions,
    modules,
  };
};
