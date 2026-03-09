import { Router } from "express";
import { login, unlockScreen } from "./auth.controller";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* LOGIN */
router.post("/login", tenantMiddleware, login);

/* UNLOCK SCREEN */
router.post("/unlock", tenantMiddleware, authMiddleware, unlockScreen);

export default router;
