import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const host = (req.headers.host || "").split(":")[0].toLowerCase();
    const rootDomain = process.env.ROOT_DOMAIN;

    if (!rootDomain) {
      return res.status(500).json({ message: "ROOT_DOMAIN not configured" });
    }

    // 🚫 Direct root domain access block (e.g. localhost or example.com)
    if (host === rootDomain || host === "127.0.0.1") {
      return res.status(400).json({
        message: `Tenant subdomain required. Example: madrasa1.${rootDomain}`,
      });
    }

    // 🚫 Invalid domain
    if (!host.endsWith(rootDomain)) {
      return res.status(400).json({ message: "Invalid tenant domain" });
    }

    // Extract slug
    const slug = host.replace(`.${rootDomain}`, "");

    if (!slug || slug.includes(".")) {
      return res.status(400).json({ message: "Invalid tenant domain" });
    }

    // 🔍 Find tenant (must be active & not deleted)
    const [rows]: any = await db.query(
      `
      SELECT id, is_active, deleted_at
      FROM madrasas
      WHERE slug = ?
      LIMIT 1
      `,
      [slug],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Madrasa not found" });
    }

    const madrasa = rows[0];

    // 🚫 Soft deleted check
    if (madrasa.deleted_at) {
      return res.status(410).json({
        message: "This madrasa has been deleted",
      });
    }

    // 🚫 Suspended check
    if (!madrasa.is_active) {
      return res.status(403).json({
        message: "This madrasa is suspended",
      });
    }

    // ✅ Attach tenant to request
    (req as any).tenant = {
      madrasa_id: madrasa.id,
      slug,
    };

    next();
  } catch (err: any) {
    console.error("Tenant middleware error:", err);
    return res.status(500).json({ message: "Tenant resolution failed" });
  }
};
