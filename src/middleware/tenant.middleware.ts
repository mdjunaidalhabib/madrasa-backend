import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { logger } from "../utils/logger";

function normalizeSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

function getSlugFromRequest(req: Request) {
  // Path-based tenant mode: frontend sends this header from /:madrasaSlug/admin/*
  const headerSlug = normalizeSlug(req.headers["x-madrasa-slug"]);
  if (headerSlug) return headerSlug;

  // Optional API path support: /api/:madrasaSlug/...
  const paramSlug = normalizeSlug((req.params as any).madrasaSlug || (req.params as any).slug);
  if (paramSlug) return paramSlug;

  const querySlug = normalizeSlug(req.query.madrasaSlug || req.query.slug);
  if (querySlug) return querySlug;

  // Future-ready subdomain fallback: jamia.yourdomain.com
  const host = (req.headers.host || "").split(":")[0].toLowerCase();
  const rootDomain = process.env.ROOT_DOMAIN;
  if (rootDomain && host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.replace(`.${rootDomain}`, "");
    if (subdomain && !subdomain.includes(".")) return normalizeSlug(subdomain);
  }

  return "";
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = getSlugFromRequest(req);

    if (!slug) {
      return res.status(400).json({
        message: "Madrasa slug required. Example: /jamia/admin/login",
      });
    }

    const [rows]: any = await db.query(
      `
      SELECT id, slug, name, is_active, deleted_at, website_status
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

    if (madrasa.deleted_at) {
      return res.status(410).json({ message: "This madrasa has been deleted" });
    }

    if (!madrasa.is_active) {
      return res.status(403).json({ message: "This madrasa is suspended" });
    }

    req.tenant = {
      madrasa_id: madrasa.id,
      slug: madrasa.slug,
    };

    next();
  } catch (err: any) {
    logger.error("Tenant middleware error", err);
    return res.status(500).json({ message: "Tenant resolution failed" });
  }
};
