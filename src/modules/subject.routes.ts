import { Router, Request, Response } from "express";
import { db } from "../config/db";

const router = Router();

// GET /api/subjects?classId=1
router.get("/", async (req: Request, res: Response) => {
  try {
    const { classId } = req.query;

    const [rows] = await db.query(
      "SELECT id, name FROM subjects WHERE class_id = ?",
      [classId],
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load subjects",
    });
  }
});


/**
 * UPDATE SUBJECT
 * PUT /api/subjects/:id
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    await db.query("UPDATE subjects SET name = ? WHERE id = ?", [name, id]);

    res.json({ message: "Subject updated successfully" });
  } catch (error) {
    console.error("Update subject error:", error);
    res.status(500).json({ message: "Failed to update subject" });
  }
});

/**
 * DELETE SUBJECT
 * DELETE /api/subjects/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM subjects WHERE id = ?", [id]);

    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Delete subject error:", error);
    res.status(500).json({ message: "Failed to delete subject" });
  }
});

export default router;

