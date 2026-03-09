import { Router } from "express";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { subscriptionCheck } from "../../middleware/subscription.middleware";
import { rbacMiddleware } from "../../middleware/rbac.middleware";
import { getStudents, createStudent, deleteStudent, updateStudent, getStudentById } from "./student.controller";

const router = Router();

router.get("/", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("students.read"), getStudents);
router.post("/", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("students.create"), createStudent);
router.get("/:id", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("students.read"), getStudentById);
router.put("/:id", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("students.update"), updateStudent);
router.delete("/:id", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("students.delete"), deleteStudent);

export default router;
