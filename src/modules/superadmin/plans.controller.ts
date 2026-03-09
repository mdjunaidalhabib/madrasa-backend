import { Request, Response } from "express";
import { db } from "../../config/db";

/* =========================================================
   Helpers
========================================================= */

function num(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function bool01(v: any) {
  return v ? 1 : 0;
}

/* =========================================================
   LIST PLANS (non-trashed) + search + active filter
   GET /api/super/plans?q=&active=all|1|0
========================================================= */

export const listPlansAdmin = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").trim();
    const active = String(req.query.active || "all");

    let where = "WHERE deleted_at IS NULL";
    const params: any[] = [];

    if (q) {
      where += " AND name LIKE ?";
      params.push(`%${q}%`);
    }

    if (active !== "all") {
      where += " AND is_active = ?";
      params.push(active === "1" ? 1 : 0);
    }

    const [rows]: any = await db.query(
      `
      SELECT 
        id, name, student_limit, user_limit, duration_days, price, is_active,
        created_at, updated_at
      FROM plans
      ${where}
      ORDER BY id DESC
      `,
      params,
    );

    res.json({ data: rows || [] });
  } catch (err: any) {
    console.error("listPlansAdmin ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   LIST TRASH PLANS
   GET /api/super/plans/trash
========================================================= */

export const listTrashPlans = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      `
      SELECT 
        id, name, student_limit, user_limit, duration_days, price, is_active,
        deleted_at, created_at, updated_at
      FROM plans
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
      `,
    );

    res.json({ data: rows || [] });
  } catch (err: any) {
    console.error("listTrashPlans ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   CREATE PLAN
   POST /api/super/plans
========================================================= */

export const createPlanAdmin = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || "").trim();
    const student_limit = num(req.body?.student_limit);
    const user_limit = num(req.body?.user_limit);
    const duration_days = num(req.body?.duration_days, 365);
    const price = num(req.body?.price);
    const is_active = bool01(req.body?.is_active ?? 1);

    if (!name) return res.status(400).json({ message: "Plan নাম দিতে হবে" });

    if (student_limit < 0)
      return res
        .status(400)
        .json({ message: "Student limit 0 বা তার বেশি হতে হবে" });

    if (user_limit < 0)
      return res
        .status(400)
        .json({ message: "User limit 0 বা তার বেশি হতে হবে" });

    if (duration_days <= 0)
      return res
        .status(400)
        .json({ message: "Duration days 1 বা তার বেশি হতে হবে" });

    if (price < 0)
      return res.status(400).json({ message: "Price 0 বা তার বেশি হতে হবে" });

    /* duplicate check */

    const [[exist]]: any = await db.query(
      `SELECT id FROM plans WHERE name=? AND deleted_at IS NULL LIMIT 1`,
      [name],
    );

    if (exist) {
      return res.status(409).json({
        message: "এই নামে plan ইতিমধ্যে আছে",
      });
    }

    const [r]: any = await db.query(
      `
      INSERT INTO plans
      (name, student_limit, user_limit, duration_days, price, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [name, student_limit, user_limit, duration_days, price, is_active],
    );

    res.status(201).json({
      message: "Plan তৈরি হয়েছে",
      id: r.insertId,
    });
  } catch (err: any) {
    console.error("createPlanAdmin ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   UPDATE PLAN
   PUT /api/super/plans/:id
========================================================= */

export const updatePlanAdmin = async (req: Request, res: Response) => {
  try {
    const id = num(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid plan id" });

    const name = String(req.body?.name || "").trim();
    const student_limit = num(req.body?.student_limit);
    const user_limit = num(req.body?.user_limit);
    const duration_days = num(req.body?.duration_days);
    const price = num(req.body?.price);
    const is_active = bool01(req.body?.is_active ?? 1);

    if (!name) return res.status(400).json({ message: "Plan নাম দিতে হবে" });

    if (student_limit < 0)
      return res
        .status(400)
        .json({ message: "Student limit 0 বা তার বেশি হতে হবে" });

    if (user_limit < 0)
      return res
        .status(400)
        .json({ message: "User limit 0 বা তার বেশি হতে হবে" });

    if (duration_days <= 0)
      return res
        .status(400)
        .json({ message: "Duration days 1 বা তার বেশি হতে হবে" });

    if (price < 0)
      return res.status(400).json({ message: "Price 0 বা তার বেশি হতে হবে" });

    const [r]: any = await db.query(
      `
      UPDATE plans
      SET name=?, student_limit=?, user_limit=?, duration_days=?, price=?, is_active=?
      WHERE id=? AND deleted_at IS NULL
      `,
      [name, student_limit, user_limit, duration_days, price, is_active, id],
    );

    if (r.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Plan পাওয়া যায়নি / trash এ আছে" });
    }

    res.json({ message: "Plan আপডেট হয়েছে" });
  } catch (err: any) {
    console.error("updatePlanAdmin ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   TOGGLE ACTIVE/INACTIVE
========================================================= */

export const togglePlanAdmin = async (req: Request, res: Response) => {
  try {
    const id = num(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid plan id" });

    const [r]: any = await db.query(
      `
      UPDATE plans
      SET is_active = IF(is_active=1,0,1)
      WHERE id=? AND deleted_at IS NULL
      `,
      [id],
    );

    if (r.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Plan পাওয়া যায়নি / trash এ আছে" });
    }

    res.json({ message: "Plan status updated" });
  } catch (err: any) {
    console.error("togglePlanAdmin ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   CHECK RUNNING SUBSCRIPTION
========================================================= */

async function hasRunningSubscription(planId: number) {
  const [[row]]: any = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM madrasa_subscriptions
    WHERE plan_id = ?
      AND is_active = 1
      AND (end_date IS NULL OR end_date >= CURDATE())
    `,
    [planId],
  );

  return Number(row?.total || 0) > 0;
}

/* =========================================================
   MOVE TO TRASH
========================================================= */

export const deletePlanAdmin = async (req: Request, res: Response) => {
  try {
    const id = num(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid plan id" });

    const running = await hasRunningSubscription(id);

    if (running) {
      return res.status(409).json({
        message:
          "এই plan বর্তমানে running subscription-এ ব্যবহৃত হচ্ছে। ডিলিট না করে Inactive করুন।",
      });
    }

    const [r]: any = await db.query(
      `
      UPDATE plans
      SET deleted_at = NOW()
      WHERE id=? AND deleted_at IS NULL
      `,
      [id],
    );

    if (r.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Plan পাওয়া যায়নি / আগেই trash এ" });
    }

    res.json({ message: "Plan trash এ পাঠানো হয়েছে" });
  } catch (err: any) {
    console.error("deletePlanAdmin ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   RESTORE PLAN
========================================================= */

export const restorePlanAdmin = async (req: Request, res: Response) => {
  try {
    const id = num(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid plan id" });

    const [r]: any = await db.query(
      `
      UPDATE plans
      SET deleted_at = NULL
      WHERE id=? AND deleted_at IS NOT NULL
      `,
      [id],
    );

    if (r.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Plan trash এ নেই / পাওয়া যায়নি" });
    }

    res.json({ message: "Plan restore হয়েছে" });
  } catch (err: any) {
    console.error("restorePlanAdmin ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   PERMANENT DELETE
========================================================= */

export const permanentDeletePlanAdmin = async (req: Request, res: Response) => {
  try {
    const id = num(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid plan id" });

    const running = await hasRunningSubscription(id);

    if (running) {
      return res.status(409).json({
        message:
          "এই plan বর্তমানে running subscription-এ ব্যবহৃত হচ্ছে। Permanent delete করা যাবে না।",
      });
    }

    const [r]: any = await db.query(
      `
      DELETE FROM plans
      WHERE id=? AND deleted_at IS NOT NULL
      `,
      [id],
    );

    if (r.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Plan trash এ নেই / পাওয়া যায়নি" });
    }

    res.json({ message: "Plan permanently deleted" });
  } catch (err: any) {
    console.error("permanentDeletePlanAdmin ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
