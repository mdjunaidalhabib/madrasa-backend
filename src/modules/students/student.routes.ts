import express from "express";
import {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  createStudent, // ✅ ADD THIS
} from "../students/student.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";

const router = express.Router();

/* =============================
   PROTECTED + TENANT ROUTES
============================= */

// ✅ CREATE (VERY IMPORTANT FIX)
router.post("/admission", authMiddleware, tenantMiddleware, createStudent);

// ✅ GET ALL
router.get("/", authMiddleware, tenantMiddleware, getStudents);

// ✅ GET SINGLE
router.get("/:id", authMiddleware, tenantMiddleware, getStudentById);

// ✅ UPDATE
router.put("/:id", authMiddleware, tenantMiddleware, updateStudent);

// ✅ DELETE
router.delete("/:id", authMiddleware, tenantMiddleware, deleteStudent);

export default router;
