import { Router } from "express";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { subscriptionCheck } from "../../middleware/subscription.middleware";
import { rbacMiddleware } from "../../middleware/rbac.middleware";
import {
  createResult,
  getMarksheet,
  bulkImportMarks,
  getIdCardData,
  getAdmitCardData,
  getCertificateData,
  getTestimonialData,
  getTransferData,
} from "./talimat.controller";

const router = Router();
const mw = [tenantMiddleware, authMiddleware, subscriptionCheck];

router.post("/create", ...mw, rbacMiddleware("talimat.manage"), createResult);
router.post("/marks/bulk", ...mw, rbacMiddleware("talimat.manage"), bulkImportMarks);
router.get("/marksheet/:student_id", ...mw, rbacMiddleware("students.read"), getMarksheet);
router.get("/id-card", ...mw, rbacMiddleware("talimat.manage"), getIdCardData);
router.get("/admit-card", ...mw, rbacMiddleware("talimat.manage"), getAdmitCardData);
router.get("/certificate/:student_id", ...mw, rbacMiddleware("talimat.manage"), getCertificateData);
router.get("/testimonial/:student_id", ...mw, rbacMiddleware("talimat.manage"), getTestimonialData);
router.get("/transfer/:student_id", ...mw, rbacMiddleware("talimat.manage"), getTransferData);

export default router;
