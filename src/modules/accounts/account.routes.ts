import { Router } from "express";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { subscriptionCheck } from "../../middleware/subscription.middleware";
import { rbacMiddleware } from "../../middleware/rbac.middleware";
import { createIncome, createExpense, getReport } from "./account.controller";

const router = Router();

router.post("/income", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("accounts.create"), createIncome);
router.post("/expense", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("accounts.create"), createExpense);
router.get("/report", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("accounts.read"), getReport);

export default router;
