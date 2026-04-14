import { Router } from "express";
import {
  getExams,
  createExam,
  deleteExam,
  getGeneralGrades,
  saveGeneralGrade,
  getMadrasaGrades,
  saveMadrasaGrade,
  getFailMark,
  updateFailMark,
} from "./exam.controller";

const router = Router();

/* ================= EXAM ================= */
router.get("/exams", getExams);
router.post("/exams", createExam);
router.delete("/exams/:id", deleteExam);

/* ================= GRADES ================= */
router.get("/general-grades", getGeneralGrades);
router.post("/general-grades", saveGeneralGrade);

router.get("/madrasa-grades", getMadrasaGrades);
router.post("/madrasa-grades", saveMadrasaGrade);

/* ================= SETTINGS ================= */
router.get("/fail-mark", getFailMark);
router.post("/fail-mark", updateFailMark);

export default router;
