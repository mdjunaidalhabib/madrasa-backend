import { Router } from "express";
import {
  createTeacher,
  bulkCreateTeachers,
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

router.post("/", createTeacher);
router.post("/bulk", bulkCreateTeachers);

router.get("/", getTeachers);
router.get("/:id", getTeacherById);

router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

export default router;
