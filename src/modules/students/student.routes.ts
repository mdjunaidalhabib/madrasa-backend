import express from "express";
import {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  createStudent,
  createStudentsBulk,
} from "../students/student.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";

const router = express.Router();

/* =============================
   PROTECTED + TENANT ROUTES
============================= */

// ✅ CREATE SINGLE STUDENT
router.post("/admission", authMiddleware, tenantMiddleware, createStudent);

// ✅ CREATE BULK STUDENTS FROM EXCEL
router.post("/admission/bulk", authMiddleware, tenantMiddleware, createStudentsBulk);

// ✅ GET ALL
router.get("/", authMiddleware, tenantMiddleware, getStudents);

// ✅ GET SINGLE
router.get("/:id", authMiddleware, tenantMiddleware, getStudentById);

// ✅ UPDATE
router.put("/:id", authMiddleware, tenantMiddleware, updateStudent);

// ✅ DELETE
router.delete("/:id", authMiddleware, tenantMiddleware, deleteStudent);

export default router;
