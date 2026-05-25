import { Request, Response } from "express";
import { db } from "../../config/db";

function tenantId(req: Request) {
  return Number((req as any).tenant?.madrasa_id || req.body.madrasa_id || req.query.madrasa_id);
}

function boolValue(value: unknown, fallback = 1) {
  if (value === undefined || value === null || value === "") return fallback;
  return Number(value) ? 1 : 0;
}

async function getOptionalRows(sql: string, params: any[] = []) {
  try {
    const [rows]: any = await db.query(sql, params);
    return rows || [];
  } catch (_err) {
    return [];
  }
}

export const getPublicWebsite = async (req: Request, res: Response) => {
  const slug = String(req.params.slug || "").trim();

  const [rows]: any = await db.query(
    `SELECT id, name, slug, phone, email, address, is_active, website_status
     FROM madrasas
     WHERE slug=? AND deleted_at IS NULL
     LIMIT 1`,
    [slug],
  );

  if (!rows.length) return res.status(404).json({ message: "Madrasa not found" });

  const madrasa = rows[0];
  if (!madrasa.is_active || madrasa.website_status === "disabled") {
    return res.status(403).json({ message: "This website is currently disabled" });
  }

  const [settingsRows]: any = await db.query(
    `SELECT * FROM website_settings WHERE madrasa_id=? LIMIT 1`,
    [madrasa.id],
  );

  const settings = settingsRows[0] || {};
  if (settings.is_published === 0) {
    return res.status(403).json({ message: "This website is not published yet" });
  }

  const [pages]: any = await db.query(
    `SELECT page_key, title, content, is_published
     FROM website_pages
     WHERE madrasa_id=? AND is_published=1
     ORDER BY sort_order ASC, id ASC`,
    [madrasa.id],
  );

  const [notices]: any = await db.query(
    `SELECT id, title, content, published_at
     FROM website_notices
     WHERE madrasa_id=? AND is_published=1
     ORDER BY published_at DESC, id DESC
     LIMIT 10`,
    [madrasa.id],
  );

  const teachers = await getOptionalRows(
    `SELECT id, name, designation, subject FROM teachers WHERE madrasa_id=? ORDER BY id DESC LIMIT 12`,
    [madrasa.id],
  );

  const gallery = await getOptionalRows(
    `SELECT id, title, image_url, is_published, sort_order FROM website_gallery WHERE madrasa_id=? AND is_published=1 ORDER BY sort_order ASC, id DESC LIMIT 12`,
    [madrasa.id],
  );

  res.json({ data: { madrasa, settings, pages, notices, teachers, gallery } });
};

export const getWebsiteSettings = async (req: Request, res: Response) => {
  const madrasaId = tenantId(req);
  if (!madrasaId) return res.status(400).json({ message: "madrasa_id required" });

  const [madrasaRows]: any = await db.query(
    `SELECT id, name, slug, phone, email, address, website_status FROM madrasas WHERE id=? LIMIT 1`,
    [madrasaId],
  );
  const [settingsRows]: any = await db.query(
    `SELECT * FROM website_settings WHERE madrasa_id=? LIMIT 1`,
    [madrasaId],
  );
  const [pages]: any = await db.query(
    `SELECT page_key, title, content, is_published, sort_order FROM website_pages WHERE madrasa_id=? ORDER BY sort_order ASC, id ASC`,
    [madrasaId],
  );
  const [notices]: any = await db.query(
    `SELECT id, title, content, is_published, published_at FROM website_notices WHERE madrasa_id=? ORDER BY published_at DESC, id DESC LIMIT 30`,
    [madrasaId],
  );
  const gallery = await getOptionalRows(
    `SELECT id, title, image_url, is_published, sort_order FROM website_gallery WHERE madrasa_id=? ORDER BY sort_order ASC, id DESC LIMIT 50`,
    [madrasaId],
  );

  res.json({
    data: {
      madrasa: madrasaRows[0] || null,
      settings: settingsRows[0] || null,
      pages,
      notices,
      gallery,
    },
  });
};

export const upsertWebsiteSettings = async (req: Request, res: Response) => {
  const madrasaId = tenantId(req);
  if (!madrasaId) return res.status(400).json({ message: "madrasa_id required" });

  const {
    name,
    phone,
    email,
    address,
    logo_url,
    hero_title,
    hero_subtitle,
    theme_color,
    show_notices,
    show_gallery,
    show_teachers,
    show_admission,
    show_about,
    show_contact,
    is_published,
  } = req.body;

  await db.query(
    `UPDATE madrasas
     SET name=COALESCE(NULLIF(?, ''), name), phone=?, email=?, address=?
     WHERE id=? AND deleted_at IS NULL`,
    [name || null, phone || null, email || null, address || null, madrasaId],
  );

  await db.query(
    `INSERT INTO website_settings
      (madrasa_id, logo_url, hero_title, hero_subtitle, theme_color, show_notices, show_gallery, show_teachers, show_admission, show_about, show_contact, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      logo_url=VALUES(logo_url), hero_title=VALUES(hero_title), hero_subtitle=VALUES(hero_subtitle),
      theme_color=VALUES(theme_color), show_notices=VALUES(show_notices), show_gallery=VALUES(show_gallery),
      show_teachers=VALUES(show_teachers), show_admission=VALUES(show_admission), show_about=VALUES(show_about),
      show_contact=VALUES(show_contact), is_published=VALUES(is_published)`,
    [
      madrasaId,
      logo_url || null,
      hero_title || null,
      hero_subtitle || null,
      theme_color || "#2563eb",
      boolValue(show_notices),
      boolValue(show_gallery),
      boolValue(show_teachers),
      boolValue(show_admission),
      boolValue(show_about),
      boolValue(show_contact),
      boolValue(is_published),
    ],
  );

  res.json({ message: "Website settings saved" });
};

export const upsertWebsitePage = async (req: Request, res: Response) => {
  const madrasaId = tenantId(req);
  if (!madrasaId) return res.status(400).json({ message: "madrasa_id required" });

  const { page_key, title, content, is_published = 1, sort_order = 0 } = req.body;
  if (!page_key || !title) return res.status(400).json({ message: "page_key and title required" });

  await db.query(
    `INSERT INTO website_pages (madrasa_id, page_key, title, content, is_published, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), is_published=VALUES(is_published), sort_order=VALUES(sort_order)`,
    [madrasaId, page_key, title, content || null, boolValue(is_published), Number(sort_order) || 0],
  );

  res.json({ message: "Website page saved" });
};

export const saveWebsiteNotice = async (req: Request, res: Response) => {
  const madrasaId = tenantId(req);
  if (!madrasaId) return res.status(400).json({ message: "madrasa_id required" });

  const { id, title, content, is_published = 1 } = req.body;
  if (!title) return res.status(400).json({ message: "Notice title required" });

  if (id) {
    await db.query(
      `UPDATE website_notices SET title=?, content=?, is_published=? WHERE id=? AND madrasa_id=?`,
      [title, content || null, boolValue(is_published), id, madrasaId],
    );
  } else {
    await db.query(
      `INSERT INTO website_notices (madrasa_id, title, content, is_published) VALUES (?, ?, ?, ?)`,
      [madrasaId, title, content || null, boolValue(is_published)],
    );
  }

  const [rows]: any = await db.query(
    `SELECT id, title, content, is_published, published_at FROM website_notices WHERE madrasa_id=? ORDER BY id DESC LIMIT 1`,
    [madrasaId],
  );
  res.json({ message: "Notice saved", data: rows[0] });
};

export const deleteWebsiteNotice = async (req: Request, res: Response) => {
  const madrasaId = tenantId(req);
  const id = Number(req.params.id);
  if (!madrasaId || !id) return res.status(400).json({ message: "Invalid request" });
  await db.query(`DELETE FROM website_notices WHERE id=? AND madrasa_id=?`, [id, madrasaId]);
  res.json({ message: "Notice deleted" });
};

export const saveWebsiteGalleryItem = async (req: Request, res: Response) => {
  const madrasaId = tenantId(req);
  if (!madrasaId) return res.status(400).json({ message: "madrasa_id required" });

  const { id, title, image_url, is_published = 1, sort_order = 0 } = req.body;
  if (!image_url) return res.status(400).json({ message: "Image URL required" });

  if (id) {
    await db.query(
      `UPDATE website_gallery SET title=?, image_url=?, is_published=?, sort_order=? WHERE id=? AND madrasa_id=?`,
      [title || null, image_url, boolValue(is_published), Number(sort_order) || 0, id, madrasaId],
    );
  } else {
    await db.query(
      `INSERT INTO website_gallery (madrasa_id, title, image_url, is_published, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [madrasaId, title || null, image_url, boolValue(is_published), Number(sort_order) || 0],
    );
  }

  const [rows]: any = await db.query(
    `SELECT id, title, image_url, is_published, sort_order FROM website_gallery WHERE madrasa_id=? ORDER BY id DESC LIMIT 1`,
    [madrasaId],
  );
  res.json({ message: "Gallery item saved", data: rows[0] });
};

export const deleteWebsiteGalleryItem = async (req: Request, res: Response) => {
  const madrasaId = tenantId(req);
  const id = Number(req.params.id);
  if (!madrasaId || !id) return res.status(400).json({ message: "Invalid request" });
  await db.query(`DELETE FROM website_gallery WHERE id=? AND madrasa_id=?`, [id, madrasaId]);
  res.json({ message: "Gallery item deleted" });
};

export const updateWebsiteStatusBySuperAdmin = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || "");
  if (!["active", "limited", "disabled"].includes(status)) {
    return res.status(400).json({ message: "Invalid website status" });
  }

  await db.query(`UPDATE madrasas SET website_status=? WHERE id=? AND deleted_at IS NULL`, [
    status,
    id,
  ]);
  res.json({ message: "Website status updated", status });
};
