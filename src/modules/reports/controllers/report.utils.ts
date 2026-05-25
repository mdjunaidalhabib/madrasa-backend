import { Request, Response } from "express";
import { db } from "../../../config/db";

export type ReportResponse = {
  success: boolean;
  data: any[];
  message?: string;
  warning?: string;
};

export const tenantId = (req: Request) => Number(req.tenant?.madrasa_id || 0);

export const ok = (res: Response, data: any[], warning?: string) =>
  res.json({ success: true, data, ...(warning ? { warning } : {}) });

export const fail = (res: Response, error: any) => {
  console.error("REPORT ERROR:", error);
  return res.status(500).json({
    success: false,
    data: [],
    message: "রিপোর্ট লোড করা যায়নি",
  } satisfies ReportResponse);
};

export const isMissingTableOrColumn = (error: any) =>
  ["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR"].includes(error?.code);

export const optionalQuery = async (sql: string, params: any[] = []) => {
  try {
    const [rows]: any = await db.query(sql, params);
    return { rows: Array.isArray(rows) ? rows : [], warning: undefined };
  } catch (error: any) {
    if (isMissingTableOrColumn(error)) {
      return {
        rows: [],
        warning: "এই রিপোর্টের জন্য প্রয়োজনীয় database table/column এখনো পাওয়া যায়নি।",
      };
    }
    throw error;
  }
};

export const requireTenant = (req: Request, res: Response) => {
  const madrasaId = tenantId(req);

  if (!madrasaId) {
    res.status(400).json({
      success: false,
      data: [],
      message: "Tenant madrasa not found",
    });
    return 0;
  }

  return madrasaId;
};
