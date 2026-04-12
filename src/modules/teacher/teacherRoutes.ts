import { Router } from "express";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} from "./teacherController";

import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

// CREATE
router.post("/", createTeacher);

// READ ALL
router.get("/", getTeachers);

// READ ONE
router.get("/:id", getTeacherById);

// UPDATE
router.put("/:id", updateTeacher);

// DELETE
router.delete("/:id", deleteTeacher);

export default router;
