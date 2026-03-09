import { Router } from "express";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { subscriptionCheck } from "../../middleware/subscription.middleware";
import { getDivisions, getClassesByDivision } from "./settings.controller";

const router = Router();

router.get("/divisions", tenantMiddleware, authMiddleware, subscriptionCheck, getDivisions);
router.get("/classes/:division_id", tenantMiddleware, authMiddleware, subscriptionCheck, getClassesByDivision);

export default router;
