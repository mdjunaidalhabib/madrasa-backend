import { Router } from "express";
import { createAdmission } from "./admissionController";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";

const router = Router();

// 🔥 SECURED ROUTE (LOGIN + TENANT REQUIRED)
router.post("/", authMiddleware, tenantMiddleware, createAdmission);

export default router;
