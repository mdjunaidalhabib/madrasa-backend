import { Router, Request, Response } from "express";
import { db } from "../config/db";

const router = Router();

// GET /api/classes?divisionId=1
router.get("/", async (req: Request, res: Response) => {
  try {
    const { divisionId } = req.query;

    const [rows] = await db.query(
      "SELECT id, name_bn FROM classes WHERE division_id = ?",
      [divisionId],
    );

    res.json(rows);
  } catch (error) {
    console.error("Class fetch error:", error);

    res.status(500).json({
      message: "Failed to load classes",
    });
  }
});

/**
 * UPDATE CLASS
 * PUT /api/classes/:id
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name_bn } = req.body;

    await db.query("UPDATE classes SET name_bn = ? WHERE id = ?", [
      name_bn,
      id,
    ]);

    res.json({ message: "Class updated successfully" });
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).json({ message: "Failed to update class" });
  }
});

/**
 * DELETE CLASS
 * DELETE /api/classes/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM classes WHERE id = ?", [id]);

    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({ message: "Failed to delete class" });
  }
});

export default router;

