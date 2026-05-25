import { Router } from "express";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { subscriptionCheck } from "../../middleware/subscription.middleware";
import { getDashboard } from "./dashboard.controller";

const router = Router();
router.get("/", tenantMiddleware, authMiddleware, subscriptionCheck, getDashboard);
export default router;
