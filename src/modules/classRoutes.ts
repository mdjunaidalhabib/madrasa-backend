import { Router, Request, Response } from "express";
import { db } from "../config/db";

const router = Router();

// GET /api/classes/:divisionId
router.get("/:divisionId", async (req: Request, res: Response) => {
  try {
    const { divisionId } = req.params;

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

export default router;
