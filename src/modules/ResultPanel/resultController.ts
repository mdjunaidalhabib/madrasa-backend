import { Request, Response } from "express";
import { db } from "../../config/db";

/* ================= CACHE ================= */
let generalGradeCache: any[] = [];
let madrasaGradeCache: any[] = [];
let failMarkCache = 35;

/* ================= HELPERS ================= */
const getSchoolId = (req: Request) => {
  return Number(
    (req as any)?.user?.school_id ||
      req.body?.school_id ||
      req.query?.school_id ||
      1,
  );
};

const toNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
};

/* ================= LOAD SETTINGS ================= */
const loadSettings = async (school_id: number) => {
  const [rows]: any = await db.query(
    `SELECT name, value FROM settings WHERE school_id=?`,
    [school_id],
  );

  const fail = rows.find((r: any) => r.name === "fail_mark");
  failMarkCache = fail ? Number(fail.value) : 35;
};

/* ================= LOAD GRADES ================= */
const loadGrades = async (school_id: number) => {
  const [generalRows]: any = await db.query(
    `SELECT * FROM general_grades WHERE school_id=? ORDER BY min_mark DESC`,
    [school_id],
  );

  const [madrasaRows]: any = await db.query(
    `SELECT * FROM madrasa_grades WHERE school_id=? ORDER BY min_mark DESC`,
    [school_id],
  );

  generalGradeCache = generalRows || [];
  madrasaGradeCache = madrasaRows || [];
};

const getGradeFast = (avg: number, gradeList: any[], fallback = "F") => {
  for (const g of gradeList) {
    if (avg >= Number(g.min_mark) && avg <= Number(g.max_mark)) {
      return g.name;
    }
  }
  return fallback;
};

const getOrCreateSessionId = async (
  school_id: number,
  exam_id: number,
  class_id: number,
) => {
  const [existing]: any = await db.query(
    `SELECT id
     FROM results_master
     WHERE school_id=? AND exam_id=? AND class_id=?
     LIMIT 1`,
    [school_id, exam_id, class_id],
  );

  if (existing.length > 0) return existing[0].id;

  const [r]: any = await db.query(
    `INSERT INTO results_master (school_id, exam_id, class_id, status)
     VALUES (?, ?, ?, 'DRAFT')`,
    [school_id, exam_id, class_id],
  );

  return r.insertId;
};

/* ================= CREATE SESSION ================= */
export const createSession = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const exam_id = toNumber(req.body?.exam_id);
  const class_id = toNumber(req.body?.class_id);

  if (!exam_id || !class_id) {
    return res.status(400).json({
      success: false,
      message: "exam_id and class_id are required",
    });
  }

  try {
    const [existing]: any = await db.query(
      `SELECT *
       FROM results_master
       WHERE school_id=? AND exam_id=? AND class_id=?
       LIMIT 1`,
      [school_id, exam_id, class_id],
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: "Session already exists",
        result_master_id: existing[0].id,
        status: existing[0].status,
      });
    }

    const [r]: any = await db.query(
      `INSERT INTO results_master (school_id, exam_id, class_id, status)
       VALUES (?, ?, ?, 'DRAFT')`,
      [school_id, exam_id, class_id],
    );

    return res.json({
      success: true,
      message: "Session created successfully",
      result_master_id: r.insertId,
    });
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create session",
    });
  }
};

/* ================= SAVE MARKS ================= */
export const saveMarks = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const { data } = req.body;
  let { result_master_id } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Marks data is required",
    });
  }

  const first = data[0] || {};
  const exam_id = toNumber(first.exam_id);
  const class_id = toNumber(first.class_id);

  if (!exam_id || !class_id) {
    return res.status(400).json({
      success: false,
      message: "exam_id and class_id are required in marks data",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    result_master_id = result_master_id
      ? Number(result_master_id)
      : await getOrCreateSessionId(school_id, exam_id, class_id);

    const values = data.map((m: any) => [
      result_master_id,
      toNumber(m.student_id),
      toNumber(m.exam_id),
      toNumber(m.class_id),
      toNumber(m.book_id),
      toNumber(m.mark),
      school_id,
    ]);

    await conn.query(
      `INSERT INTO marks
        (result_master_id, student_id, exam_id, class_id, book_id, mark, school_id)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         mark = VALUES(mark),
         exam_id = VALUES(exam_id),
         updated_at = CURRENT_TIMESTAMP`,
      [values],
    );

    await conn.commit();
    conn.release();

    return res.json({
      success: true,
      message: "Marks saved successfully",
      result_master_id,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();

    console.error("saveMarks error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save marks",
    });
  }
};

/* ================= GET MARKS ================= */
export const getMarks = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const exam_id = toNumber(req.query.exam_id);
  const class_id = toNumber(req.query.class_id);
  let result_master_id = toNumber(req.query.result_master_id);

  if (!exam_id || !class_id) {
    return res.status(400).json({
      success: false,
      message: "exam_id and class_id are required",
    });
  }

  try {
    if (!result_master_id) {
      const [masterRows]: any = await db.query(
        `SELECT id
         FROM results_master
         WHERE school_id=? AND exam_id=? AND class_id=?
         ORDER BY id DESC
         LIMIT 1`,
        [school_id, exam_id, class_id],
      );

      if (masterRows.length === 0) {
        return res.json({
          success: true,
          result_master_id: null,
          data: [],
        });
      }

      result_master_id = masterRows[0].id;
    }

    const [rows]: any = await db.query(
      `SELECT student_id, book_id, mark, result_master_id
       FROM marks
       WHERE school_id=? AND exam_id=? AND class_id=? AND result_master_id=?
       ORDER BY student_id ASC, book_id ASC`,
      [school_id, exam_id, class_id, result_master_id],
    );

    return res.json({
      success: true,
      result_master_id,
      data: rows,
    });
  } catch (err) {
    console.error("getMarks error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch marks",
    });
  }
};

/* ================= PROCESS RESULT ================= */
export const processResult = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const exam_id = toNumber(req.body.exam_id);
  const class_id = toNumber(req.body.class_id);
  let result_master_id = toNumber(req.body.result_master_id);

  if (!exam_id || !class_id) {
    return res.status(400).json({
      success: false,
      message: "exam_id and class_id are required",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    if (!result_master_id) {
      const [masterRows]: any = await conn.query(
        `SELECT id
         FROM results_master
         WHERE school_id=? AND exam_id=? AND class_id=?
         ORDER BY id DESC
         LIMIT 1`,
        [school_id, exam_id, class_id],
      );

      if (masterRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({
          success: false,
          message: "Result session not found",
        });
      }

      result_master_id = masterRows[0].id;
    }

    await loadGrades(school_id);
    await loadSettings(school_id);

    const [marks]: any = await conn.query(
      `SELECT
         student_id,
         SUM(mark) AS total,
         COUNT(DISTINCT book_id) AS cnt
       FROM marks
       WHERE school_id=? AND exam_id=? AND class_id=? AND result_master_id=?
       GROUP BY student_id`,
      [school_id, exam_id, class_id, result_master_id],
    );

    if (!marks.length) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({
        success: false,
        message: "No marks found to process",
      });
    }

    const sorted = [...marks].sort(
      (a: any, b: any) => Number(b.total) - Number(a.total),
    );

    const data: any[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const total = Number(r.total || 0);
      const cnt = Number(r.cnt || 0);
      const avg = cnt > 0 ? total / cnt : 0;

      const general_grade = getGradeFast(avg, generalGradeCache, "F");
      const madrasa_grade = getGradeFast(avg, madrasaGradeCache, "Rasib");
      const status = avg >= failMarkCache ? "PASS" : "FAIL";

      data.push([
        result_master_id,
        Number(r.student_id),
        total,
        avg,
        general_grade,
        madrasa_grade,
        status,
        i + 1,
      ]);
    }

    await conn.query(`DELETE FROM results_summary WHERE result_master_id=?`, [
      result_master_id,
    ]);

    await conn.query(
      `INSERT INTO results_summary
        (
          result_master_id,
          student_id,
          total,
          average,
          general_grade,
          madrasa_grade,
          status,
          rank_no
        )
       VALUES ?`,
      [data],
    );

    await conn.query(`UPDATE results_master SET status='DRAFT' WHERE id=?`, [
      result_master_id,
    ]);

    await conn.commit();
    conn.release();

    return res.json({
      success: true,
      message: "Result processed successfully",
      result_master_id,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();

    console.error("processResult error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process result",
    });
  }
};

/* ================= GET SUMMARY ================= */
export const getSummary = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const exam_id = toNumber(req.query.exam_id);
  const class_id = toNumber(req.query.class_id);

  if (!exam_id || !class_id) {
    return res.status(400).json({
      success: false,
      message: "exam_id and class_id are required",
    });
  }

  try {
    const [rows]: any = await db.query(
      `SELECT
         rs.result_master_id,
         rs.student_id,
         s.name_bn,
         rs.total,
         rs.average,
         rs.general_grade,
         rs.madrasa_grade,
         rs.status,
         rs.rank_no,
         rm.status AS publish_status
       FROM results_summary rs
       INNER JOIN results_master rm
         ON rm.id = rs.result_master_id
       LEFT JOIN students s
         ON s.id = rs.student_id
       WHERE rm.school_id=? AND rm.exam_id=? AND rm.class_id=?
       ORDER BY rs.rank_no ASC, rs.student_id ASC`,
      [school_id, exam_id, class_id],
    );

    return res.json(rows);
  } catch (err) {
    console.error("getSummary error:", err);
    return res.status(500).json([]);
  }
};

/* ================= PUBLISH ================= */
export const publishResult = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const result_master_id = toNumber(req.body.result_master_id);

  if (!result_master_id) {
    return res.status(400).json({
      success: false,
      message: "result_master_id is required",
    });
  }

  try {
    const [masterRows]: any = await db.query(
      `SELECT id
       FROM results_master
       WHERE id=? AND school_id=?
       LIMIT 1`,
      [result_master_id, school_id],
    );

    if (!masterRows.length) {
      return res.status(404).json({
        success: false,
        message: "Result session not found",
      });
    }

    const [summaryRows]: any = await db.query(
      `SELECT id
       FROM results_summary
       WHERE result_master_id=?
       LIMIT 1`,
      [result_master_id],
    );

    if (!summaryRows.length) {
      return res.status(400).json({
        success: false,
        message: "Process result before publish",
      });
    }

    await db.query(`UPDATE results_master SET status='PUBLISHED' WHERE id=?`, [
      result_master_id,
    ]);

    return res.json({
      success: true,
      message: "Result published successfully",
    });
  } catch (err) {
    console.error("publishResult error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to publish result",
    });
  }
};

/* ================= DELETE RESULT ================= */
export const deleteResult = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const id = toNumber(req.params.id);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Invalid result id",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [masterRows]: any = await conn.query(
      `SELECT id
       FROM results_master
       WHERE id=? AND school_id=?
       LIMIT 1`,
      [id, school_id],
    );

    if (!masterRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({
        success: false,
        message: "Result session not found",
      });
    }

    await conn.query(`DELETE FROM marks WHERE result_master_id=?`, [id]);
    await conn.query(`DELETE FROM results_summary WHERE result_master_id=?`, [
      id,
    ]);
    await conn.query(`DELETE FROM results_master WHERE id=?`, [id]);

    await conn.commit();
    conn.release();

    return res.json({
      success: true,
      message: "Result deleted successfully",
    });
  } catch (err) {
    await conn.rollback();
    conn.release();

    console.error("deleteResult error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete result",
    });
  }
};

/* ================= FULL RESULT VIEW ================= */
export const getFullResultView = async (req: Request, res: Response) => {
  const school_id = getSchoolId(req);
  const exam_id = toNumber(req.query.exam_id);
  const class_id = toNumber(req.query.class_id);
  let result_master_id = toNumber(req.query.result_master_id);

  try {
    if (!result_master_id) {
      if (!exam_id || !class_id) {
        return res.status(400).json({
          success: false,
          message: "result_master_id or exam_id + class_id is required",
        });
      }

      const [masterRows]: any = await db.query(
        `SELECT id
         FROM results_master
         WHERE school_id=? AND exam_id=? AND class_id=?
         ORDER BY id DESC
         LIMIT 1`,
        [school_id, exam_id, class_id],
      );

      if (!masterRows.length) {
        return res.status(404).json({
          success: false,
          message: "Result session not found",
        });
      }

      result_master_id = masterRows[0].id;
    }

    const [rows]: any = await db.query(
      `
      SELECT
        s.id AS student_id,
        s.name_bn,
        rs.result_master_id,
        rs.total,
        rs.average,
        rs.general_grade,
        rs.madrasa_grade,
        rs.status,
        rs.rank_no,
        rm.status AS publish_status,
        m.book_id,
        COALESCE(b.name_bn, b.name) AS book_name,
        m.mark
      FROM results_summary rs
      INNER JOIN results_master rm
        ON rm.id = rs.result_master_id
      INNER JOIN students s
        ON s.id = rs.student_id
      LEFT JOIN marks m
        ON m.student_id = rs.student_id
        AND m.result_master_id = rs.result_master_id
      LEFT JOIN books b
        ON b.id = m.book_id
      WHERE rs.result_master_id=? AND rm.school_id=?
      ORDER BY rs.rank_no ASC, s.id ASC, m.book_id ASC
      `,
      [result_master_id, school_id],
    );

    const studentMap = new Map<number, any>();
    const booksMap = new Map<number, any>();

    for (const row of rows) {
      if (!studentMap.has(row.student_id)) {
        studentMap.set(row.student_id, {
          result_master_id: row.result_master_id,
          student_id: row.student_id,
          name_bn: row.name_bn,
          total: Number(row.total || 0),
          average: Number(row.average || 0),
          general_grade: row.general_grade || "",
          madrasa_grade: row.madrasa_grade || "",
          status: row.status || "",
          rank_no: row.rank_no || 0,
          publish_status: row.publish_status || "DRAFT",
          marks: [],
        });
      }

      if (row.book_id !== null && row.book_id !== undefined) {
        studentMap.get(row.student_id).marks.push({
          book_id: Number(row.book_id),
          book_name: row.book_name || `Book ${row.book_id}`,
          mark: Number(row.mark || 0),
        });

        if (!booksMap.has(row.book_id)) {
          booksMap.set(row.book_id, {
            book_id: Number(row.book_id),
            book_name: row.book_name || `Book ${row.book_id}`,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      result_master_id,
      books: Array.from(booksMap.values()).sort(
        (a: any, b: any) => a.book_id - b.book_id,
      ),
      students: Array.from(studentMap.values()),
    });
  } catch (err) {
    console.error("getFullResultView error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch full result view",
    });
  }
};
