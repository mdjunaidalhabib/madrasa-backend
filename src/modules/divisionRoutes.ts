import { Router, Request, Response } from "express";
import { db } from "../config/db";


const router = Router();

// GET /api/divisions
router.get("/", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT id, name_bn FROM divisions");

    res.json(rows);
  } catch (error) {
    console.error("Division fetch error:", error);

    res.status(500).json({
      message: "Failed to load divisions",
    });
  }
});

export default router;
