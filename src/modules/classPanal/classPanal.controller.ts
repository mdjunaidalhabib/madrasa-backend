import { Request, Response } from "express";
import { db } from "../../config/db";

/* =========================================================
   DIVISIONS
========================================================= */
export const getDivisions = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;

    if (!madrasaId) {
      return res.status(400).json({ message: "Madrasa not found in tenant" });
    }

    const [rows] = await db.query(
      `SELECT 
         d.id AS division_id,
         d.name_bn AS division_name_bn
       FROM madrasa_divisions md
       JOIN divisions d ON d.id = md.division_id
       WHERE md.madrasa_id = ?
         AND md.is_active = 1`,
      [madrasaId],
    );

    res.json(rows);
  } catch (error: any) {
    console.error("❌ Division fetch error:", error);
    res.status(500).json({ message: "Failed to load divisions" });
  }
};

/* =========================================================
   CLASSES
========================================================= */
export const getClasses = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const divisionId = Number(req.query.division_id);

    if (!madrasaId) {
      return res.status(400).json({ message: "Madrasa not found in tenant" });
    }

    if (!divisionId) {
      return res.status(400).json({ message: "division_id is required" });
    }

    const [rows] = await db.query(
      `SELECT 
         c.id AS class_id,
         c.name_bn AS class_name_bn,
         c.division_id
       FROM madrasa_classes mc
       JOIN classes c ON c.id = mc.class_id
       WHERE mc.madrasa_id = ?
         AND c.division_id = ?
         AND mc.is_active = 1`,
      [madrasaId, divisionId],
    );

    res.json(rows);
  } catch (error: any) {
    console.error("❌ Class fetch error:", error);
    res.status(500).json({ message: "Failed to load classes" });
  }
};

/* =========================
   ADD CLASS
========================= */
export const addClass = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { division_id, name_bn } = req.body;

    if (!madrasaId) {
      return res.status(400).json({ message: "Madrasa not found in tenant" });
    }

    if (!division_id || !name_bn) {
      return res
        .status(400)
        .json({ message: "division_id and name_bn required" });
    }

    const [result]: any = await db.query(
      "INSERT INTO classes (name_bn, division_id) VALUES (?, ?)",
      [name_bn, division_id],
    );

    const class_id = result.insertId;

    await db.query(
      "INSERT INTO madrasa_classes (madrasa_id, class_id) VALUES (?, ?)",
      [madrasaId, class_id],
    );

    res.json({ message: "Class added successfully" });
  } catch (error: any) {
    console.error("❌ Add class error:", error);
    res.status(500).json({ message: "Failed to add class" });
  }
};

/* =========================
   UPDATE CLASS
========================= */
export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name_bn } = req.body;

    if (!name_bn) {
      return res.status(400).json({ message: "name_bn required" });
    }

    await db.query("UPDATE classes SET name_bn = ? WHERE id = ?", [
      name_bn,
      id,
    ]);

    res.json({ message: "Class updated successfully" });
  } catch (error: any) {
    console.error("❌ Update class error:", error);
    res.status(500).json({ message: "Failed to update class" });
  }
};

/* =========================
   DELETE CLASS
========================= */
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    if (!madrasaId) {
      return res.status(400).json({ message: "Madrasa not found in tenant" });
    }

    await db.query(
      `UPDATE madrasa_classes 
       SET is_active = 0 
       WHERE class_id = ? AND madrasa_id = ?`,
      [id, madrasaId],
    );

    res.json({ message: "Class removed from madrasa" });
  } catch (error: any) {
    console.error("❌ Delete class error:", error);
    res.status(500).json({ message: "Failed to delete class" });
  }
};

/* =========================================================
   BOOKS (বাংলা enabled)
========================================================= */
export const getSubjects = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const classId = Number(req.query.class_id);

    if (!madrasaId) {
      return res.status(400).json({ message: "Madrasa not found in tenant" });
    }

    if (!classId) {
      return res.status(400).json({ message: "class_id is required" });
    }

    const [rows] = await db.query(
      `SELECT 
         b.id AS book_id,
         b.name_bn AS book_name_bn,
         b.class_id
       FROM madrasa_books mb
       JOIN books b ON b.id = mb.book_id
       WHERE mb.madrasa_id = ?
         AND b.class_id = ?
         AND mb.is_active = 1`,
      [madrasaId, classId],
    );

    res.json(rows);
  } catch (error: any) {
    console.error("❌ Book fetch error:", error);
    res.status(500).json({ message: "Failed to load books" });
  }
};

/* =========================
   ADD BOOK (বাংলা)
========================= */
export const addSubject = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { class_id, name_bn } = req.body;

    if (!madrasaId) {
      return res.status(400).json({ message: "Madrasa not found in tenant" });
    }

    if (!class_id || !name_bn) {
      return res.status(400).json({ message: "class_id and name_bn required" });
    }

    const [result]: any = await db.query(
      "INSERT INTO books (name_bn, class_id) VALUES (?, ?)",
      [name_bn, class_id],
    );

    const book_id = result.insertId;

    await db.query(
      "INSERT INTO madrasa_books (madrasa_id, book_id) VALUES (?, ?)",
      [madrasaId, book_id],
    );

    res.json({ message: "Book added successfully" });
  } catch (error: any) {
    console.error("❌ Add book error:", error);
    res.status(500).json({ message: "Failed to add book" });
  }
};

/* =========================
   UPDATE BOOK (বাংলা)
========================= */
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name_bn } = req.body;

    if (!name_bn) {
      return res.status(400).json({ message: "name_bn required" });
    }

    await db.query("UPDATE books SET name_bn = ? WHERE id = ?", [name_bn, id]);

    res.json({ message: "Book updated successfully" });
  } catch (error: any) {
    console.error("❌ Update book error:", error);
    res.status(500).json({ message: "Failed to update book" });
  }
};

/* =========================
   DELETE BOOK
========================= */
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const madrasaId = req.tenant?.madrasa_id;
    const { id } = req.params;

    if (!madrasaId) {
      return res.status(400).json({ message: "Madrasa not found in tenant" });
    }

    await db.query(
      `UPDATE madrasa_books 
       SET is_active = 0 
       WHERE book_id = ? AND madrasa_id = ?`,
      [id, madrasaId],
    );

    res.json({ message: "Book removed from madrasa" });
  } catch (error: any) {
    console.error("❌ Delete book error:", error);
    res.status(500).json({ message: "Failed to delete book" });
  }
};
