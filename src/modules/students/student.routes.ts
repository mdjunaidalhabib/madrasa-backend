import express from "express";
import {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../students/student.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";

const router = express.Router();

/* =============================
   PROTECTED + TENANT ROUTES
============================= */
router.get("/", authMiddleware, tenantMiddleware, getStudents);

router.get("/:id", authMiddleware, tenantMiddleware, getStudentById);

router.put("/:id", authMiddleware, tenantMiddleware, updateStudent);

router.delete("/:id", authMiddleware, tenantMiddleware, deleteStudent);

export default router;
