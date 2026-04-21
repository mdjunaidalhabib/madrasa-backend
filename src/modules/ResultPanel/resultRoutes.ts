import express from "express";
import {
  createSession,
  saveMarks,
  getMarks,
  processResult,
  getSummary,
  publishResult,
  deleteResult,
  getFullResultView,
} from "./resultController";

const router = express.Router();

/* ================= SESSION ================= */
router.post("/session", createSession);

/* ================= MARKS ================= */
router.post("/marks", saveMarks);
router.get("/marks", getMarks);

/* ================= RESULT PROCESS ================= */
router.post("/process", processResult);

/* ================= SUMMARY ================= */
router.get("/summary", getSummary);

/* ================= PUBLISH ================= */
router.post("/publish", publishResult);

/* ================= DELETE ================= */
router.delete("/:id", deleteResult);

/* ================= FULL RESULT ================= */
router.get("/full-result", getFullResultView);

export default router;
