import { Request, Response } from "express";
import { db } from "../../config/db";
import { logActivity } from "../../utils/activity";

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

const DEFAULT_EXPENSE_CATEGORIES = [
  "শিক্ষক ও স্টাফ বেতন",
  "বোর্ডিং / ইফতার খরচ",
  "কম্পোজ / ছাপা / স্টেশনারী / মনোহরী",
  "নির্মাণ",
  "মেরামত",
  "ইলেকট্রিক ও সরঞ্জামাদি",
  "আসবাবপত্র ক্রয়",
  "সম্মানী / অডিট / বোর্ড ফি",
  "লাইব্রেরী",
  "অনুষ্ঠান / মাহফিল",
  "মোবাইল",
  "যাতায়াত",
  "আপ্যায়ন",
  "বিবিধ",
];

const DEFAULT_MOSQUE_EXPENSES = [
  "ইমামের সম্মানী",
  "মুয়াজ্জিন সম্মানী",
  "খাদেমের সম্মানী",
  "বিদ্যুৎ বিল",
  "আসবাবপত্র ও অন্যান্য খরচ",
];
const DEFAULT_GRAVEYARD_EXPENSES = [
  "পরিষ্কার পরিচ্ছন্নতা",
  "মাটি ভরাট / রক্ষণাবেক্ষণ",
  "উন্নয়ন ও অন্যান্য",
];
const PAYMENT_METHODS = ["নগদ টাকা", "ব্যাংক / মোবাইল ব্যাংকিং"];

const ACCOUNT_COLUMNS = [
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

let accountSchemaReady = false;
const ensureAccountSchema = async () => {
  if (accountSchemaReady) return;

  const [dbRows]: any = await db.query("SELECT DATABASE() AS dbName");
  const dbName = dbRows?.[0]?.dbName;
  if (!dbName) return;

  const [cols]: any = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='accounts'`,
    [dbName],
  );
  const existing = new Set((cols || []).map((c: any) => c.COLUMN_NAME));

  for (const [name, definition] of ACCOUNT_COLUMNS) {
    if (!existing.has(name)) {
      await db.query(`ALTER TABLE accounts ADD COLUMN ${name} ${definition}`);
    }
  }

  accountSchemaReady = true;
};

const clean = (value: any) =>
  value === undefined || value === null || value === "" ? null : String(value).trim();
const numberValue = (value: any) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

export const getAccountOptions = async (_req: Request, res: Response) => {
  await ensureAccountSchema();
  res.json({
    incomeFunds: DEFAULT_INCOME_FUNDS,
    expenseGroups: [
      { name: "সাধারণ ব্যয় বিভাগ", categories: DEFAULT_EXPENSE_CATEGORIES },
      { name: "মসজিদ ব্যয়", categories: DEFAULT_MOSQUE_EXPENSES },
      { name: "কবরস্থান ব্যয়", categories: DEFAULT_GRAVEYARD_EXPENSES },
    ],
    paymentMethods: PAYMENT_METHODS,
  });
};

export const createIncome = async (req: Request, res: Response) => {
  await ensureAccountSchema();
  const madrasa_id = req.tenant!.madrasa_id;
  const amount = numberValue(req.body.amount);
  const receipt_no = clean(req.body.receipt_no);
  const fund = clean(req.body.fund);
  const category = clean(req.body.category);
  const donor_name = clean(req.body.donor_name);
  const address = clean(req.body.address);
  const mobile = clean(req.body.mobile);
  const payment_method = clean(req.body.payment_method);
  const entry_date = clean(req.body.entry_date) || new Date().toISOString().slice(0, 10);
  const entry_time = clean(req.body.entry_time) || new Date().toTimeString().slice(0, 8);

  if (!donor_name || !amount || !fund || !category || !payment_method) {
    return res
      .status(400)
      .json({ message: "নাম, ফান্ড, খাত, পরিমাণ ও পেমেন্ট মাধ্যম বাধ্যতামূলক" });
  }

  const [result]: any = await db.query(
    `INSERT INTO accounts
      (madrasa_id, type, amount, category, description, receipt_no, voucher_no, fund, donor_name, address, mobile, payment_method, entry_date, entry_time, created_by)
     VALUES (?, 'income', ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      madrasa_id,
      amount,
      category,
      donor_name,
      receipt_no,
      fund,
      donor_name,
      address,
      mobile,
      payment_method,
      entry_date,
      entry_time,
      req.user!.id,
    ],
  );

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "CREATE",
    entity: "INCOME",
    entity_id: result.insertId,
    details: `Income added: ${amount}`,
  });
  res.json({ message: "আয় এন্ট্রি সফল হয়েছে", id: result.insertId });
};

export const createExpense = async (req: Request, res: Response) => {
  await ensureAccountSchema();
  const madrasa_id = req.tenant!.madrasa_id;
  const amount = numberValue(req.body.amount);
  const voucher_no = clean(req.body.voucher_no);
  const fund = clean(req.body.fund);
  const category = clean(req.body.category);
  const receiver_name = clean(req.body.receiver_name);
  const mobile = clean(req.body.mobile);
  const payment_method = clean(req.body.payment_method);
  const entry_date = clean(req.body.entry_date) || new Date().toISOString().slice(0, 10);
  const entry_time = clean(req.body.entry_time) || new Date().toTimeString().slice(0, 8);

  if (!receiver_name || !amount || !fund || !category || !payment_method) {
    return res
      .status(400)
      .json({ message: "নাম, ফান্ড, ব্যয়ের খাত, পরিমাণ ও পেমেন্ট মাধ্যম বাধ্যতামূলক" });
  }

  const [result]: any = await db.query(
    `INSERT INTO accounts
      (madrasa_id, type, amount, category, description, receipt_no, voucher_no, fund, receiver_name, mobile, payment_method, entry_date, entry_time, created_by)
     VALUES (?, 'expense', ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      madrasa_id,
      amount,
      category,
      receiver_name,
      voucher_no,
      fund,
      receiver_name,
      mobile,
      payment_method,
      entry_date,
      entry_time,
      req.user!.id,
    ],
  );

  await logActivity({
    madrasa_id,
    user_id: req.user!.id,
    action: "CREATE",
    entity: "EXPENSE",
    entity_id: result.insertId,
    details: `Expense added: ${amount}`,
  });
  res.json({ message: "ব্যয় এন্ট্রি সফল হয়েছে", id: result.insertId });
};

export const getReport = async (req: Request, res: Response) => {
  await ensureAccountSchema();
  const madrasa_id = req.tenant!.madrasa_id;
  const type = String(req.query.type || "monthly");
  const groupBy = String(req.query.groupBy || "period");
  const dateColumn = "COALESCE(entry_date, DATE(created_at))";

  if (groupBy === "fund") {
    const [rows]: any = await db.query(
      `SELECT fund AS period,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
       FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL GROUP BY fund ORDER BY fund`,
      [madrasa_id],
    );
    return res.json(rows);
  }

  if (groupBy === "category") {
    const [rows]: any = await db.query(
      `SELECT category AS period,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
       FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL GROUP BY category ORDER BY category`,
      [madrasa_id],
    );
    return res.json(rows);
  }

  const periodExpr =
    type === "daily"
      ? `DATE(${dateColumn})`
      : type === "yearly"
        ? `YEAR(${dateColumn})`
        : `DATE_FORMAT(${dateColumn},'%Y-%m')`;
  const [rows]: any = await db.query(
    `SELECT ${periodExpr} AS period,
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
     FROM accounts WHERE madrasa_id=? AND deleted_at IS NULL GROUP BY ${periodExpr} ORDER BY period DESC LIMIT 365`,
    [madrasa_id],
  );
  res.json(rows);
};
