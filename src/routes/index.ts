import { Router } from "express";

// 🔐 Tenant Modules
import authRoutes from "../modules/auth/auth.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import studentRoutes from "../modules/students/student.routes";
import userRoutes from "../modules/users/user.routes";
import accountRoutes from "../modules/accounts/account.routes";
import talimatRoutes from "../modules/talimat/talimat.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import activityRoutes from "../modules/activity/activity.routes";
import sidebarRoutes from "../modules/sidebar/sidebar.routes";


// 👑 Super Admin Modules
import superadminRoutes from "../modules/superadmin/superadmin.routes";
import superAdminAuthRoutes from "../modules/superadmin/superadmin.auth.routes";

const router = Router();

/* =========================================================
   SUPER ADMIN ROUTES (Central Domain)
   e.g. app.example.com/api/super
========================================================= */

// Super Admin login
router.use("/super-admin", superAdminAuthRoutes);

// Super Admin management (madrasas, plans, trash, etc.)
router.use("/super", superadminRoutes);

/* =========================================================
   TENANT ROUTES (Subdomain Based)
   e.g. madrasa1.example.com/api/...
========================================================= */

// Tenant authentication
router.use("/auth", authRoutes);

router.use("/sidebar", sidebarRoutes);
// Dashboard
router.use("/dashboard", dashboardRoutes);

// Core Modules
router.use("/students", studentRoutes);
router.use("/users", userRoutes);
router.use("/accounts", accountRoutes);
router.use("/talimat", talimatRoutes);
router.use("/settings", settingsRoutes);
router.use("/activity", activityRoutes);

export default router;
