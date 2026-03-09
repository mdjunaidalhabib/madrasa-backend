import { Request, Response } from "express";
import { db } from "../../config/db";
import bcrypt from "bcryptjs";

/* =========================================================
   UTILITIES
========================================================= */

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function makeUniqueSlug(base: string) {
  const [rows]: any = await db.query(
    "SELECT slug FROM madrasas WHERE slug LIKE ?",
    [`${base}%`],
  );

  const used = new Set((rows || []).map((x: any) => x.slug));

  if (!used.has(base)) return base;

  let i = 2;
  while (used.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/* =========================================================
   LIST ACTIVE MADRASAS (exclude trash) + PLAN INFO
========================================================= */

export const listMadrasas = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "");
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Number(req.query.limit || 10));
    const offset = (page - 1) * limit;

    const whereSearch = q ? "AND (m.name LIKE ? OR m.slug LIKE ?)" : "";
    const params = q ? [`%${q}%`, `%${q}%`] : [];

    const [countRows]: any = await db.query(
      `
      SELECT COUNT(*) as total
      FROM madrasas m
      WHERE m.deleted_at IS NULL
      ${whereSearch}
      `,
      params,
    );

    const total = Number(countRows?.[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows]: any = await db.query(
      `
      SELECT 
        m.id, m.name, m.slug, m.student_limit, m.user_limit,
        m.is_active,
        s.plan_id,
        p.name AS plan_name,
        s.start_date,
        s.end_date
      FROM madrasas m
      LEFT JOIN madrasa_subscriptions s
        ON s.madrasa_id = m.id AND s.is_active = 1
      LEFT JOIN plans p
        ON p.id = s.plan_id
      WHERE m.deleted_at IS NULL
      ${whereSearch}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    res.json({
      data: rows,
      meta: { page, limit, total, totalPages },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   LIST PLANS
========================================================= */

export const listPlans = async (_req: Request, res: Response) => {
  const [rows]: any = await db.query(
    `
    SELECT id, name, student_limit, user_limit, duration_days, price, is_active
    FROM plans
    WHERE is_active = 1
    ORDER BY id ASC
    `,
  );

  res.json({ data: rows });
};

/* =========================================================
   ASSIGN PLAN TO MADRASA
========================================================= */

export const assignPlanToMadrasa = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  try {
    const madrasaId = Number(req.params.id);
    const { plan_id } = req.body;

    if (!madrasaId)
      return res.status(400).json({ message: "Invalid madrasa id" });
    if (!plan_id) return res.status(400).json({ message: "plan_id required" });

    await conn.beginTransaction();

    const [mRows]: any = await conn.query(
      `SELECT id, deleted_at FROM madrasas WHERE id=? LIMIT 1`,
      [madrasaId],
    );

    if (!mRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Madrasa not found" });
    }

    if (mRows[0].deleted_at) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Cannot assign plan to trashed madrasa" });
    }

    const [planRows]: any = await conn.query(
      `SELECT * FROM plans WHERE id=? AND is_active=1 LIMIT 1`,
      [plan_id],
    );

    if (!planRows.length) {
      await conn.rollback();
      return res.status(400).json({ message: "Invalid plan" });
    }

    const plan = planRows[0];

    await conn.query(
      `UPDATE madrasa_subscriptions SET is_active=0 WHERE madrasa_id=?`,
      [madrasaId],
    );

    await conn.query(
      `
      INSERT INTO madrasa_subscriptions
        (madrasa_id, plan_id, start_date, end_date, is_active)
      VALUES
        (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), 1)
      `,
      [madrasaId, plan.id, plan.duration_days],
    );

    await conn.query(
      `UPDATE madrasas SET student_limit=?, user_limit=? WHERE id=?`,
      [plan.student_limit, plan.user_limit, madrasaId],
    );

    await conn.commit();
    res.json({ message: "Plan assigned successfully" });
  } catch (err: any) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

/* =========================================================
   CREATE MADRASA
========================================================= */

export const createMadrasa = async (req: Request, res: Response) => {
  const conn = await db.getConnection();

  const cleanNumberArray = (v: any): number[] => {
    if (!Array.isArray(v)) return [];
    return v.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
  };

  try {
    const {
      name,
      address,
      slug,
      phone,
      plan_id,
      student_limit,
      user_limit,
      divisions,
      modules,
      default_users = [],
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Madrasa name required" });
    }

    const divisionIds = cleanNumberArray(divisions);
    const moduleIds = cleanNumberArray(modules);

    await conn.beginTransaction();

    /* =========================
       SLUG
    ========================= */

    const baseSlug = slugify(slug || name);
    const finalSlug = await makeUniqueSlug(baseSlug);

    /* =========================
       CREATE MADRASA
    ========================= */

    const [madrasaResult]: any = await conn.query(
      `
      INSERT INTO madrasas 
      (name, address, phone, slug, student_limit, user_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [
        name,
        address || null,
        phone || null,
        finalSlug,
        student_limit || 100,
        user_limit || 5,
      ],
    );

    const madrasaId = madrasaResult.insertId;

    /* =========================
       CREATE ROLES
    ========================= */

    const roleMap: Record<string, number> = {};

    const roles = [
      { key: "MUHTAMIM", name: "মুহতামিম" },
      { key: "TALIMAT", name: "তালিমাত" },
      { key: "ACCOUNTANT", name: "হিসাবরক্ষক" },
    ];

    for (const r of roles) {
      const [roleResult]: any = await conn.query(
        `
        INSERT INTO roles (madrasa_id, key_name, name_bn)
        VALUES (?, ?, ?)
        `,
        [madrasaId, r.key, r.name],
      );

      roleMap[r.key] = roleResult.insertId;
    }

    /* =========================
       CREATE DEFAULT USERS
    ========================= */

    for (const u of default_users) {
      const roleKey = u.role.toUpperCase();

      const roleId = roleMap[roleKey];

      if (!roleId) continue;

      const hashed = await bcrypt.hash(u.password, 10);

      await conn.query(
        `
        INSERT INTO users
        (madrasa_id, name, email, password_hash, role_id, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
        `,
        [madrasaId, roleKey, u.email, hashed, roleId],
      );
    }

    /* =========================
       INSERT DIVISIONS
    ========================= */

    await conn.query(
      `
      INSERT INTO madrasa_divisions (madrasa_id, division_id, is_active)
      SELECT ?, id, 0 FROM divisions
      `,
      [madrasaId],
    );

    if (divisionIds.length > 0) {
      const ph = divisionIds.map(() => "?").join(",");

      await conn.query(
        `
        UPDATE madrasa_divisions
        SET is_active=1
        WHERE madrasa_id=?
        AND division_id IN (${ph})
        `,
        [madrasaId, ...divisionIds],
      );
    } else {
      await conn.query(
        `UPDATE madrasa_divisions SET is_active=1 WHERE madrasa_id=?`,
        [madrasaId],
      );
    }

    /* =========================
       INSERT MODULES
    ========================= */

    await conn.query(
      `
      INSERT INTO madrasa_modules (madrasa_id, module_id, is_active)
      SELECT ?, id, 0 FROM modules
      `,
      [madrasaId],
    );

    if (moduleIds.length > 0) {
      const ph = moduleIds.map(() => "?").join(",");

      await conn.query(
        `
        UPDATE madrasa_modules
        SET is_active=1
        WHERE madrasa_id=?
        AND module_id IN (${ph})
        `,
        [madrasaId, ...moduleIds],
      );
    } else {
      await conn.query(
        `UPDATE madrasa_modules SET is_active=1 WHERE madrasa_id=?`,
        [madrasaId],
      );
    }

    /* =========================
       ASSIGN PLAN
    ========================= */

    if (plan_id) {
      const [planRows]: any = await conn.query(
        `SELECT * FROM plans WHERE id=? AND is_active=1 LIMIT 1`,
        [plan_id],
      );

      if (!planRows.length) {
        await conn.rollback();
        return res.status(400).json({ message: "Invalid plan_id" });
      }

      const plan = planRows[0];

      await conn.query(
        `
        INSERT INTO madrasa_subscriptions
        (madrasa_id, plan_id, start_date, end_date, is_active)
        VALUES
        (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), 1)
        `,
        [madrasaId, plan.id, plan.duration_days],
      );

      await conn.query(
        `UPDATE madrasas SET student_limit=?, user_limit=? WHERE id=?`,
        [plan.student_limit, plan.user_limit, madrasaId],
      );
    }

    /* =========================
       ACTIVITY LOG
    ========================= */

    await conn.query(
      `
      INSERT INTO activity_logs
      (madrasa_id, action, entity, entity_id, details)
      VALUES (?, 'MADRASA_CREATED', 'madrasa', ?, ?)
      `,
      [madrasaId, madrasaId, JSON.stringify({ name, slug: finalSlug })],
    );

    await conn.commit();

    res.status(201).json({
      message: "Madrasa created successfully",
      madrasa_id: madrasaId,
      slug: finalSlug,
    });
  } catch (err: any) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

/* =========================================================
   ACTIVATE / SUSPEND
========================================================= */

export const activateMadrasa = async (req: Request, res: Response) => {
  await db.query(
    `UPDATE madrasas SET is_active=1 WHERE id=? AND deleted_at IS NULL`,
    [req.params.id],
  );
  res.json({ message: "Activated" });
};

export const suspendMadrasa = async (req: Request, res: Response) => {
  await db.query(
    `UPDATE madrasas SET is_active=0 WHERE id=? AND deleted_at IS NULL`,
    [req.params.id],
  );
  res.json({ message: "Suspended" });
};

/* =========================================================
   SOFT DELETE
========================================================= */

export const trashMadrasa = async (req: Request, res: Response) => {
  await db.query(
    `UPDATE madrasas 
     SET deleted_at=NOW(),
         is_active=0
     WHERE id=? AND deleted_at IS NULL`,
    [req.params.id],
  );
  res.json({ message: "Moved to trash and suspended" });
};

/* =========================================================
   LIST TRASH
========================================================= */

export const listTrash = async (_req: Request, res: Response) => {
  const [rows]: any = await db.query(
    `
    SELECT id, name, slug, deleted_at, created_at, is_active
    FROM madrasas
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
    `,
  );
  res.json({ data: rows });
};

/* =========================================================
   RESTORE (Auto Activate)
========================================================= */

export const restoreMadrasa = async (req: Request, res: Response) => {
  await db.query(
    `UPDATE madrasas 
     SET deleted_at=NULL,
         is_active=1
     WHERE id=?`,
    [req.params.id],
  );
  res.json({ message: "Restored successfully" });
};

/* =========================================================
   DELETE STATS (Before Permanent Delete)
========================================================= */

export const getMadrasaDeleteStats = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const [[students]]: any = await db.query(
    "SELECT COUNT(*) as total FROM students WHERE madrasa_id=?",
    [id],
  );

  const [[users]]: any = await db.query(
    "SELECT COUNT(*) as total FROM users WHERE madrasa_id=?",
    [id],
  );

  const [[accounts]]: any = await db.query(
    "SELECT COUNT(*) as total FROM accounts WHERE madrasa_id=?",
    [id],
  );

  res.json({
    students: students.total,
    users: users.total,
    accounts: accounts.total,
  });
};

/* =========================================================
   SUPER ADMIN DASHBOARD STATS
========================================================= */

export const getSuperAdminStats = async (_req: Request, res: Response) => {
  const [[active]]: any = await db.query(
    "SELECT COUNT(*) as total FROM madrasas WHERE deleted_at IS NULL AND is_active=1",
  );

  const [[inactive]]: any = await db.query(
    "SELECT COUNT(*) as total FROM madrasas WHERE deleted_at IS NULL AND is_active=0",
  );

  const [[trashed]]: any = await db.query(
    "SELECT COUNT(*) as total FROM madrasas WHERE deleted_at IS NOT NULL",
  );

  const [[totalMadrasas]]: any = await db.query(
    "SELECT COUNT(*) as total FROM madrasas",
  );

  const [[students]]: any = await db.query(
    "SELECT COUNT(*) as total FROM students",
  );

  const [recentRows]: any = await db.query(
    `
    SELECT 
      a.id,
      m.name AS madrasa_name,
      u.name AS user_name,
      a.action,
      a.entity,
      a.entity_id,
      a.details,
      a.created_at
    FROM activity_logs a
    LEFT JOIN madrasas m ON m.id = a.madrasa_id
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT 15
    `,
  );

  const [expiringRows]: any = await db.query(
    `
    SELECT
      m.name AS madrasa_name,
      m.slug,
      p.name AS plan_name,
      s.end_date,
      DATEDIFF(s.end_date, CURDATE()) AS days_left
    FROM madrasa_subscriptions s
    JOIN madrasas m ON m.id = s.madrasa_id
    JOIN plans p ON p.id = s.plan_id
    WHERE s.is_active = 1
      AND m.deleted_at IS NULL
      AND s.end_date IS NOT NULL
      AND s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    ORDER BY s.end_date ASC
    LIMIT 30
    `,
  );

  const [expiredRows]: any = await db.query(
    `
    SELECT
      m.name AS madrasa_name,
      m.slug,
      p.name AS plan_name,
      s.end_date,
      DATEDIFF(CURDATE(), s.end_date) AS days_overdue
    FROM madrasa_subscriptions s
    JOIN madrasas m ON m.id = s.madrasa_id
    JOIN plans p ON p.id = s.plan_id
    WHERE s.is_active = 1
      AND m.deleted_at IS NULL
      AND s.end_date IS NOT NULL
      AND s.end_date < CURDATE()
    ORDER BY s.end_date ASC
    LIMIT 50
    `,
  );

  res.json({
    totalMadrasas: Number(totalMadrasas.total || 0),
    activeMadrasas: Number(active.total || 0),
    inactiveMadrasas: Number(inactive.total || 0),
    trashedMadrasas: Number(trashed.total || 0),
    totalStudents: Number(students.total || 0),

    recentActivities: recentRows || [],
    expiringPlans: expiringRows || [],
    expiredPlans: expiredRows || [],
  });
};

/* =========================================================
   PERMANENT DELETE (Transaction Safe)
========================================================= */

export const permanentDeleteMadrasa = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const conn = await db.getConnection();

  await conn.beginTransaction();

  try {
    await conn.query(
      "DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE madrasa_id=?)",
      [id],
    );
    await conn.query("DELETE FROM roles WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM users WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM students WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM accounts WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM activity_logs WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM madrasa_subscriptions WHERE madrasa_id=?", [
      id,
    ]);
    await conn.query("DELETE FROM madrasa_modules WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM madrasa_divisions WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM classes WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM subjects WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM results WHERE madrasa_id=?", [id]);
    await conn.query("DELETE FROM madrasas WHERE id=?", [id]);

    await conn.commit();
    res.json({ message: "Permanently deleted" });
  } catch (err: any) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};
