import { Router } from "express";

/* =========================
   IMPORT ROUTES
========================= */

// 🔐 Auth & Core
import authRoutes from "../modules/auth/auth.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import userRoutes from "../modules/users/user.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import activityRoutes from "../modules/activity/activity.routes";
import sidebarRoutes from "../modules/sidebar/sidebar.routes";

// 👨‍🎓 Student & Admission
import studentRoutes from "../modules/students/student.routes";
import admissionRoutes from "../modules/admission/admissionRoutes";

// 👨‍🎓 teacher Admission
import teacherRoutes from "../modules/teacher/teacherRoutes";
import teacherAssignmentRoutes from "../modules/TeacherAssignment/TeacherAssignmentRoutes";

// 💰 Accounts & Talimat
import accountRoutes from "../modules/accounts/account.routes";
import talimatRoutes from "../modules/talimat/talimat.routes";

// 🏫 Academic Structure
import classPanalRoutes from "../modules/classPanal/classPanal.routes";

// 👑 Super Admin
import superadminRoutes from "../modules/superadmin/superadmin.routes";
import superAdminAuthRoutes from "../modules/superadmin/superadmin.auth.routes";
import examRoutes from "../modules/ExamPanel/exam.routes";

const router = Router();

/* =========================================================
   👑 SUPER ADMIN ROUTES
========================================================= */

// Super Admin Auth
router.use("/super-admin", superAdminAuthRoutes);

// Super Admin Panel APIs
router.use("/super", superadminRoutes);

/* =========================================================
   🔐 TENANT ROUTES (Subdomain Based)
========================================================= */

// Auth
router.use("/auth", authRoutes);

// Dashboard
router.use("/dashboard", dashboardRoutes);

// Sidebar (UI config)
router.use("/sidebar", sidebarRoutes);

/* =========================
   CORE MODULES
========================= */

router.use("/users", userRoutes);
router.use("/settings", settingsRoutes);
router.use("/activity", activityRoutes);

/* =========================
   STUDENT MODULE
========================= */

router.use("/students", studentRoutes);
router.use("/students/admission", admissionRoutes);
/* =========================
   TEACHER MODULE
========================= */
router.use("/teachers", teacherRoutes);
router.use("/teacher-assignments", teacherAssignmentRoutes);
/* =========================
   FINANCE & TALIMAT
========================= */

router.use("/accounts", accountRoutes);
router.use("/talimat", talimatRoutes);
router.use("/", examRoutes);

/* =========================
   ACADEMIC STRUCTURE
========================= */
router.use("/", classPanalRoutes);

export default router;
