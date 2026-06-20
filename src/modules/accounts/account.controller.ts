import { Request, Response } from "express";
import { db } from "../../config/db";
import { logActivity } from "../../utils/activity";

/* ── static data ─────────────────────────────────────── */
const DEFAULT_INCOME_FUNDS = [
  {
    name: "সাধারণ ফান্ড",
    categories: ["সাধারণ দান", "ছাত্র বেতন", "ভর্তি ফি", "ভর্তি ফরম", "বোর্ডিং ফি", "পরীক্ষা ফি"],
  },
  { name: "গোরাবা ফান্ড", categories: ["যাকাত", "ফিতরা", "সদকা"] },
  { name: "মসজিদ ফান্ড", categories: ["মসজিদ দান", "জুমা কালেকশন"] },
  { name: "কবরস্থান ফান্ড", categories: ["কবরস্থান দান"] },
  { name: "নির্মাণ ফান্ড", categories: ["নির্মাণ"] },
];
const DEFAULT_EXPENSE_CATS = [
  "শিক্ষক ও স্টাফ বেতন",
  "বোর্ডিং / ইফতার খরচ",
  "কম্পোজ / ছাপা / স্টেশনারী / মনোহরী",
  "নির্মাণ",
  "মেরামত",
  "ইলেকট্রিক ও সরঞ্জামাদি",
  "আসবাবপত্র ক্রয়",
  "সম্মানী / অডিট / বোর্ড ফি",
  "লাইব্রেরী",
  "অনুষ্ঠান / মাহফিল",
  "মোবাইল",
  "যাতায়াত",
  "আপ্যায়ন",
  "বিবিধ",
];
const DEFAULT_MOSQUE_EXP = [
  "ইমামের সম্মানী",
  "মুয়াজ্জিন সম্মানী",
  "খাদেমের সম্মানী",
  "বিদ্যুৎ বিল",
  "আসবাবপত্র ও অন্যান্য খরচ",
];
const DEFAULT_GRAVE_EXP = [
  "পরিষ্কার পরিচ্ছন্নতা",
  "মাটি ভরাট / রক্ষণাবেক্ষণ",
  "উন্নয়ন ও অন্যান্য",
];
const PAYMENT_METHODS = ["নগদ টাকা", "ব্যাংক / মোবাইল ব্যাংকিং"];

const EXTRA_COLS = [
  ["receipt_no", "VARCHAR(80) NULL"],
  ["voucher_no", "VARCHAR(80) NULL"],
  ["fund", "VARCHAR(120) NULL"],
  ["donor_name", "VARCHAR(200) NULL"],
  ["receiver_name", "VARCHAR(200) NULL"],
  ["address", "VARCHAR(255) NULL"],
  ["mobile", "VARCHAR(30) NULL"],
  ["payment_method", "VARCHAR(80) NULL"],
  ["entry_date", "DATE NULL"],
  ["entry_time", "TIME NULL"],
  ["deleted_at", "TIMESTAMP NULL"],
  ["hard_deleted_at", "TIMESTAMP NULL"],
];

/* ── schema helpers ──────────────────────────────────── */
let acctReady = false;
const ensureAcctSchema = async () => {
  if (acctReady) return;
  const [dbR]: any = await db.query("SELECT DATABASE() AS n");
  const dbName = dbR?.[0]?.n;
  if (!dbName) return;
  const [cols]: any = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='accounts'`,
    [dbName],
  );
  const existing = new Set((cols || []).map((c: any) => c.COLUMN_NAME));
  for (const [col, def] of EXTRA_COLS)
    if (!existing.has(col)) await db.query(`ALTER TABLE accounts ADD COLUMN ${col} ${def}`);
  acctReady = true;
};

let feeReady = false;
const ensureFeeSchema = async () => {
  if (feeReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS student_fees (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      madrasa_id  INT NOT NULL,
      student_id  INT NOT NULL,
      fee_type    VARCHAR(100) NOT NULL DEFAULT 'মাসিক বেতন',
      fee_month   VARCHAR(20)  NULL COMMENT '2026-01',
      amount      DECIMAL(10,2) NOT NULL,
      paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      status      ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
      payment_date DATE NULL,
      payment_method VARCHAR(80) NULL,
      note        TEXT NULL,
      created_by  INT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sf_mid  (madrasa_id),
      INDEX idx_sf_sid  (student_id),
      INDEX idx_sf_stat (status)
    ) ENGINE=InnoDB`);
  feeReady = true;
};

let salReady = false;
const ensureSalarySchema = async () => {
  if (salReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS teacher_salaries (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      madrasa_id    INT NOT NULL,
      teacher_id    INT NOT NULL,
      salary_month  VARCHAR(20) NOT NULL COMMENT '2026-01',
      basic_salary  DECIMAL(10,2) NOT NULL DEFAULT 0,
      bonus         DECIMAL(10,2) NOT NULL DEFAULT 0,
      deduction     DECIMAL(10,2) NOT NULL DEFAULT 0,
      paid_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
      status        ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
      payment_date  DATE NULL,
      payment_method VARCHAR(80) NULL,
      note          TEXT NULL,
      created_by    INT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_ts (madrasa_id, teacher_id, salary_month),
      INDEX idx_ts_mid (madrasa_id),
      INDEX idx_ts_tid (teacher_id)
    ) ENGINE=InnoDB`);
  salReady = true;
};

/* ── utils ───────────────────────────────────────────── */
const clean = (v: any) => (v === undefined || v === null || v === "" ? null : String(v).trim());
const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/* ═══════════════════════════════════════════════════════
   OPTIONS
═══════════════════════════════════════════════════════ */
export const getAccountOptions = async (_req: Request, res: Response) => {
  await ensureAcctSchema();
  res.json({
    incomeFunds: DEFAULT_INCOME_FUNDS,
    expenseGroups: [
      { name: "সাধারণ ব্যয় বিভাগ", categories: DEFAULT_EXPENSE_CATS },
      { name: "মসজিদ ব্যয়", categories: DEFAULT_MOSQUE_EXP },
      { name: "কবরস্থান ব্যয়", categories: DEFAULT_GRAVE_EXP },
    ],
    paymentMethods: PAYMENT_METHODS,
  });
};

/* ═══════════════════════════════════════════════════════
   INCOME — CREATE
═══════════════════════════════════════════════════════ */
export const createIncome = async (req: Request, res: Response) => {
  await ensureAcctSchema();
  const mid = req.tenant!.madrasa_id;
  const amount = num(req.body.amount);
  const donor = clean(req.body.donor_name);
  const fund = clean(req.body.fund);
  const cat = clean(req.body.category);
  const pmeth = clean(req.body.payment_method);
  if (!donor || !amount || !fund || !cat || !pmeth)
    return res
      .status(400)
      .json({ message: "নাম, ফান্ড, খাত, পরিমাণ ও পেমেন্ট মাধ্যম বাধ্যতামূলক" });
  const edate = clean(req.body.entry_date) || new Date().toISOString().slice(0, 10);
  const etime = clean(req.body.entry_time) || new Date().toTimeString().slice(0, 8);
  const [r]: any = await db.query(
    `INSERT INTO accounts (madrasa_id,type,amount,category,description,receipt_no,fund,donor_name,address,mobile,payment_method,entry_date,entry_time,created_by)
     VALUES (?,'income',?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      mid,
      amount,
      cat,
      donor,
      clean(req.body.receipt_no),
      fund,
      donor,
      clean(req.body.address),
      clean(req.body.mobile),
      pmeth,
      edate,
      etime,
      req.user!.id,
    ],
  );
  await logActivity({
    madrasa_id: mid,
    user_id: req.user!.id,
    action: "CREATE",
    entity: "INCOME",
    entity_id: r.insertId,
    details: `৳${amount}`,
  });
  res.json({ message: "আয় এন্ট্রি সফল হয়েছে", id: r.insertId });
};

/* ═══════════════════════════════════════════════════════
   INCOME — LIST
═══════════════════════════════════════════════════════ */
export const getIncomeList = async (req: Request, res: Response) => {
  await ensureAcctSchema();
  const mid = req.tenant!.madrasa_id;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Number(req.query.limit || 20));
  const off = (page - 1) * limit;
  const fund = clean(req.query.fund);
  const cat = clean(req.query.category);
  const from = clean(req.query.from);
  const to = clean(req.query.to);
  let w = `WHERE madrasa_id=? AND type='income' AND deleted_at IS NULL`;
  const p: any[] = [mid];
  if (fund) {
    w += ` AND fund=?`;
    p.push(fund);
  }
  if (cat) {
    w += ` AND category=?`;
    p.push(cat);
  }
  if (from) {
    w += ` AND COALESCE(entry_date,DATE(created_at))>=?`;
    p.push(from);
  }
  if (to) {
    w += ` AND COALESCE(entry_date,DATE(created_at))<=?`;
    p.push(to);
  }
  const [cr]: any = await db.query(`SELECT COUNT(*) AS t FROM accounts ${w}`, p);
  const total = Number(cr[0]?.t || 0);
  const [rows]: any = await db.query(
    `SELECT id,entry_date,entry_time,receipt_no,fund,category,donor_name,address,mobile,amount,payment_method,created_at
     FROM accounts ${w} ORDER BY COALESCE(entry_date,DATE(created_at)) DESC,id DESC LIMIT ? OFFSET ?`,
    [...p, limit, off],
  );
  res.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
};

/* ═══════════════════════════════════════════════════════
   EXPENSE — CREATE
═══════════════════════════════════════════════════════ */
export const createExpense = async (req: Request, res: Response) => {
  await ensureAcctSchema();
  const mid = req.tenant!.madrasa_id;
  const amount = num(req.body.amount);
  const recv = clean(req.body.receiver_name);
  const fund = clean(req.body.fund);
  const cat = clean(req.body.category);
  const pmeth = clean(req.body.payment_method);
  if (!recv || !amount || !fund || !cat || !pmeth)
    return res
      .status(400)
      .json({ message: "নাম, ফান্ড, ব্যয়ের খাত, পরিমাণ ও পেমেন্ট মাধ্যম বাধ্যতামূলক" });
  const edate = clean(req.body.entry_date) || new Date().toISOString().slice(0, 10);
  const etime = clean(req.body.entry_time) || new Date().toTimeString().slice(0, 8);
  const [r]: any = await db.query(
    `INSERT INTO accounts (madrasa_id,type,amount,category,description,voucher_no,fund,receiver_name,mobile,payment_method,entry_date,entry_time,created_by)
     VALUES (?,'expense',?,?,?,?,?,?,?,?,?,?,?)`,
    [
      mid,
      amount,
      cat,
      recv,
      clean(req.body.voucher_no),
      fund,
      recv,
      clean(req.body.mobile),
      pmeth,
      edate,
      etime,
      req.user!.id,
    ],
  );
  await logActivity({
    madrasa_id: mid,
    user_id: req.user!.id,
    action: "CREATE",
    entity: "EXPENSE",
    entity_id: r.insertId,
    details: `৳${amount}`,
  });
  res.json({ message: "ব্যয় এন্ট্রি সফল হয়েছে", id: r.insertId });
};

/* ═══════════════════════════════════════════════════════
   EXPENSE — LIST
═══════════════════════════════════════════════════════ */
export const getExpenseList = async (req: Request, res: Response) => {
  await ensureAcctSchema();
  const mid = req.tenant!.madrasa_id;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Number(req.query.limit || 20));
  const off = (page - 1) * limit;
  const fund = clean(req.query.fund);
  const cat = clean(req.query.category);
  const from = clean(req.query.from);
  const to = clean(req.query.to);
  let w = `WHERE madrasa_id=? AND type='expense' AND deleted_at IS NULL`;
  const p: any[] = [mid];
  if (fund) {
    w += ` AND fund=?`;
    p.push(fund);
  }
  if (cat) {
    w += ` AND category=?`;
    p.push(cat);
  }
  if (from) {
    w += ` AND COALESCE(entry_date,DATE(created_at))>=?`;
    p.push(from);
  }
  if (to) {
    w += ` AND COALESCE(entry_date,DATE(created_at))<=?`;
    p.push(to);
  }
  const [cr]: any = await db.query(`SELECT COUNT(*) AS t FROM accounts ${w}`, p);
  const total = Number(cr[0]?.t || 0);
  const [rows]: any = await db.query(
    `SELECT id,entry_date,entry_time,voucher_no,fund,category,receiver_name,mobile,amount,payment_method,created_at
     FROM accounts ${w} ORDER BY COALESCE(entry_date,DATE(created_at)) DESC,id DESC LIMIT ? OFFSET ?`,
    [...p, limit, off],
  );
  res.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
};

/* ═══════════════════════════════════════════════════════
   DELETE (soft)
═══════════════════════════════════════════════════════ */
export const deleteAccount = async (req: Request, res: Response) => {
  const mid = req.tenant!.madrasa_id;
  await db.query(`UPDATE accounts SET deleted_at=NOW() WHERE id=? AND madrasa_id=?`, [
    req.params.id,
    mid,
  ]);
  res.json({ message: "মুছে ফেলা হয়েছে" });
};

/* ═══════════════════════════════════════════════════════
   REPORT
═══════════════════════════════════════════════════════ */
export const getReport = async (req: Request, res: Response) => {
  await ensureAcctSchema();
  const mid = req.tenant!.madrasa_id;
  const type = String(req.query.type || "monthly");
  const groupBy = String(req.query.groupBy || "period");
  const dc = "COALESCE(entry_date,DATE(created_at))";

  if (groupBy === "fund") {
    const [rows]: any = await db.query(
      `SELECT fund AS period,
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
       FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL GROUP BY fund ORDER BY fund`,
      [mid],
    );
    return res.json(rows);
  }
  if (groupBy === "category") {
    const [rows]: any = await db.query(
      `SELECT category AS period,
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
       FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL GROUP BY category ORDER BY category`,
      [mid],
    );
    return res.json(rows);
  }
  const pe =
    type === "daily"
      ? `DATE(${dc})`
      : type === "yearly"
        ? `YEAR(${dc})`
        : `DATE_FORMAT(${dc},'%Y-%m')`;
  const [rows]: any = await db.query(
    `SELECT ${pe} AS period,
      SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
     FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL GROUP BY ${pe} ORDER BY period DESC LIMIT 365`,
    [mid],
  );
  res.json(rows);
};

/* ═══════════════════════════════════════════════════════
   STUDENT FEES
═══════════════════════════════════════════════════════ */
export const createStudentFee = async (req: Request, res: Response) => {
  await ensureFeeSchema();
  const mid = req.tenant!.madrasa_id;
  const { student_id, fee_type, fee_month, amount } = req.body;
  if (!student_id || !amount)
    return res.status(400).json({ message: "student_id ও amount বাধ্যতামূলক" });
  const [r]: any = await db.query(
    `INSERT INTO student_fees (madrasa_id,student_id,fee_type,fee_month,amount,created_by) VALUES (?,?,?,?,?,?)`,
    [mid, student_id, fee_type || "মাসিক বেতন", fee_month || null, Number(amount), req.user!.id],
  );
  res.json({ message: "ফি এন্ট্রি হয়েছে", id: r.insertId });
};

export const getStudentFees = async (req: Request, res: Response) => {
  await ensureFeeSchema();
  const mid = req.tenant!.madrasa_id;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Number(req.query.limit || 20));
  const off = (page - 1) * limit;
  let w = `sf.madrasa_id=?`;
  const p: any[] = [mid];
  if (req.query.student_id) {
    w += ` AND sf.student_id=?`;
    p.push(Number(req.query.student_id));
  }
  if (req.query.status) {
    w += ` AND sf.status=?`;
    p.push(req.query.status);
  }
  if (req.query.fee_month) {
    w += ` AND sf.fee_month=?`;
    p.push(req.query.fee_month);
  }
  if (req.query.class_id) {
    w += ` AND s.class_id=?`;
    p.push(Number(req.query.class_id));
  }
  const [cr]: any = await db.query(
    `SELECT COUNT(*) AS t FROM student_fees sf LEFT JOIN students s ON s.id=sf.student_id WHERE ${w}`,
    p,
  );
  const total = Number(cr[0]?.t || 0);
  const [rows]: any = await db.query(
    `SELECT sf.*,
            sf.amount - sf.paid_amount AS due_amount,
            s.name_bn AS student_name, s.guardian_phone,
            c.name_bn AS class_name
     FROM student_fees sf
     LEFT JOIN students s ON s.id=sf.student_id
     LEFT JOIN classes  c ON c.id=s.class_id
     WHERE ${w} ORDER BY sf.id DESC LIMIT ? OFFSET ?`,
    [...p, limit, off],
  );
  res.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
};

export const payStudentFee = async (req: Request, res: Response) => {
  await ensureFeeSchema();
  const mid = req.tenant!.madrasa_id;
  const [rows]: any = await db.query(`SELECT * FROM student_fees WHERE id=? AND madrasa_id=?`, [
    req.params.id,
    mid,
  ]);
  if (!rows.length) return res.status(404).json({ message: "রেকর্ড পাওয়া যায়নি" });
  const fee = rows[0];
  const newPaid = Math.min(
    Number(fee.amount),
    Number(fee.paid_amount) + Number(req.body.paid_amount || 0),
  );
  const status = newPaid >= Number(fee.amount) ? "paid" : newPaid > 0 ? "partial" : "unpaid";
  await db.query(
    `UPDATE student_fees SET paid_amount=?,status=?,payment_date=?,payment_method=?,note=? WHERE id=? AND madrasa_id=?`,
    [
      newPaid,
      status,
      req.body.payment_date || new Date().toISOString().slice(0, 10),
      req.body.payment_method || "নগদ টাকা",
      req.body.note || null,
      req.params.id,
      mid,
    ],
  );
  res.json({ message: "পেমেন্ট আপডেট হয়েছে", status });
};

export const deleteStudentFee = async (req: Request, res: Response) => {
  const mid = req.tenant!.madrasa_id;
  await db.query(`DELETE FROM student_fees WHERE id=? AND madrasa_id=?`, [req.params.id, mid]);
  res.json({ message: "মুছে ফেলা হয়েছে" });
};

export const getStudentFeesSummary = async (req: Request, res: Response) => {
  await ensureFeeSchema();
  const mid = req.tenant!.madrasa_id;
  let w = `madrasa_id=?`;
  const p: any[] = [mid];
  if (req.query.fee_month) {
    w += ` AND fee_month=?`;
    p.push(req.query.fee_month);
  }
  const [rows]: any = await db.query(
    `SELECT SUM(amount) AS total_amount, SUM(paid_amount) AS total_paid,
            SUM(amount-paid_amount) AS total_due,
            SUM(CASE WHEN status='paid'    THEN 1 ELSE 0 END) AS paid_count,
            SUM(CASE WHEN status='unpaid'  THEN 1 ELSE 0 END) AS unpaid_count,
            SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END) AS partial_count
     FROM student_fees WHERE ${w}`,
    p,
  );
  res.json(rows[0] || {});
};

/* ═══════════════════════════════════════════════════════
   TEACHER SALARIES
═══════════════════════════════════════════════════════ */
export const generateMonthlySalaries = async (req: Request, res: Response) => {
  await ensureSalarySchema();
  const mid = req.tenant!.madrasa_id;
  const { salary_month } = req.body;
  if (!salary_month)
    return res.status(400).json({ message: "salary_month বাধ্যতামূলক (format: 2026-01)" });
  const [teachers]: any = await db.query(
    `SELECT id,salary FROM teachers WHERE madrasa_id=? AND is_active=1`,
    [mid],
  );
  let created = 0,
    skipped = 0;
  for (const t of teachers) {
    const [ex]: any = await db.query(
      `SELECT id FROM teacher_salaries WHERE madrasa_id=? AND teacher_id=? AND salary_month=?`,
      [mid, t.id, salary_month],
    );
    if (ex.length) {
      skipped++;
      continue;
    }
    await db.query(
      `INSERT INTO teacher_salaries (madrasa_id,teacher_id,salary_month,basic_salary,created_by) VALUES (?,?,?,?,?)`,
      [mid, t.id, salary_month, Number(t.salary || 0), req.user!.id],
    );
    created++;
  }
  res.json({ message: `${salary_month} মাসের বেতন রেকর্ড তৈরি হয়েছে`, created, skipped });
};

export const createTeacherSalary = async (req: Request, res: Response) => {
  await ensureSalarySchema();
  const mid = req.tenant!.madrasa_id;
  const { teacher_id, salary_month, basic_salary, bonus, deduction, note } = req.body;
  if (!teacher_id || !salary_month)
    return res.status(400).json({ message: "teacher_id ও salary_month বাধ্যতামূলক" });
  await db.query(
    `INSERT INTO teacher_salaries (madrasa_id,teacher_id,salary_month,basic_salary,bonus,deduction,note,created_by) VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE basic_salary=VALUES(basic_salary),bonus=VALUES(bonus),deduction=VALUES(deduction),note=VALUES(note)`,
    [
      mid,
      teacher_id,
      salary_month,
      Number(basic_salary || 0),
      Number(bonus || 0),
      Number(deduction || 0),
      note || null,
      req.user!.id,
    ],
  );
  res.json({ message: "বেতন রেকর্ড তৈরি হয়েছে" });
};

export const getTeacherSalaries = async (req: Request, res: Response) => {
  await ensureSalarySchema();
  const mid = req.tenant!.madrasa_id;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Number(req.query.limit || 20));
  const off = (page - 1) * limit;
  let w = `ts.madrasa_id=?`;
  const p: any[] = [mid];
  if (req.query.teacher_id) {
    w += ` AND ts.teacher_id=?`;
    p.push(Number(req.query.teacher_id));
  }
  if (req.query.salary_month) {
    w += ` AND ts.salary_month=?`;
    p.push(req.query.salary_month);
  }
  if (req.query.status) {
    w += ` AND ts.status=?`;
    p.push(req.query.status);
  }
  const [cr]: any = await db.query(`SELECT COUNT(*) AS t FROM teacher_salaries ts WHERE ${w}`, p);
  const total = Number(cr[0]?.t || 0);
  const [rows]: any = await db.query(
    `SELECT ts.*,
            (ts.basic_salary + ts.bonus - ts.deduction) AS net_salary,
            (ts.basic_salary + ts.bonus - ts.deduction - ts.paid_amount) AS due_salary,
            t.name_bn AS teacher_name, t.phone, t.designation
     FROM teacher_salaries ts
     LEFT JOIN teachers t ON t.id=ts.teacher_id
     WHERE ${w} ORDER BY ts.salary_month DESC, ts.id DESC LIMIT ? OFFSET ?`,
    [...p, limit, off],
  );
  res.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
};

export const payTeacherSalary = async (req: Request, res: Response) => {
  await ensureSalarySchema();
  const mid = req.tenant!.madrasa_id;
  const [rows]: any = await db.query(`SELECT * FROM teacher_salaries WHERE id=? AND madrasa_id=?`, [
    req.params.id,
    mid,
  ]);
  if (!rows.length) return res.status(404).json({ message: "রেকর্ড পাওয়া যায়নি" });
  const sal = rows[0];
  const net = Number(sal.basic_salary) + Number(sal.bonus) - Number(sal.deduction);
  const newPaid = Math.min(net, Number(sal.paid_amount) + Number(req.body.paid_amount || 0));
  const status = newPaid >= net ? "paid" : newPaid > 0 ? "partial" : "unpaid";
  await db.query(
    `UPDATE teacher_salaries SET paid_amount=?,status=?,payment_date=?,payment_method=?,note=? WHERE id=? AND madrasa_id=?`,
    [
      newPaid,
      status,
      req.body.payment_date || new Date().toISOString().slice(0, 10),
      req.body.payment_method || "নগদ টাকা",
      req.body.note || null,
      req.params.id,
      mid,
    ],
  );
  res.json({ message: "বেতন পেমেন্ট আপডেট হয়েছে", status });
};

export const getTeacherSalarySummary = async (req: Request, res: Response) => {
  await ensureSalarySchema();
  const mid = req.tenant!.madrasa_id;
  let w = `madrasa_id=?`;
  const p: any[] = [mid];
  if (req.query.salary_month) {
    w += ` AND salary_month=?`;
    p.push(req.query.salary_month);
  }
  const [rows]: any = await db.query(
    `SELECT SUM(basic_salary+bonus-deduction) AS total_payable,
            SUM(paid_amount) AS total_paid,
            SUM(basic_salary+bonus-deduction-paid_amount) AS total_due,
            SUM(CASE WHEN status='paid'   THEN 1 ELSE 0 END) AS paid_count,
            SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END) AS unpaid_count
     FROM teacher_salaries WHERE ${w}`,
    p,
  );
  res.json(rows[0] || {});
};
