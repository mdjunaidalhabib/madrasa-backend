import { Router } from "express";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { subscriptionCheck } from "../../middleware/subscription.middleware";
import { rbacMiddleware } from "../../middleware/rbac.middleware";
import { getUsers, createUser, deleteUser } from "./user.controller";

const router = Router();

router.get("/", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("users.read"), getUsers);
router.post("/", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("users.create"), createUser);
router.delete("/:id", tenantMiddleware, authMiddleware, subscriptionCheck, rbacMiddleware("users.delete"), deleteUser);

export default router;
