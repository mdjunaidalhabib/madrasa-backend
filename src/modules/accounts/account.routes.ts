import { Router } from "express";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { subscriptionCheck } from "../../middleware/subscription.middleware";
import { rbacMiddleware } from "../../middleware/rbac.middleware";
import {
  getAccountOptions,
  createIncome,
  getIncomeList,
  createExpense,
  getExpenseList,
  deleteAccount,
  getReport,
  createStudentFee,
  getStudentFees,
  payStudentFee,
  deleteStudentFee,
  getStudentFeesSummary,
  createTeacherSalary,
  getTeacherSalaries,
  payTeacherSalary,
  getTeacherSalarySummary,
  generateMonthlySalaries,
} from "./account.controller";

const router = Router();
const mw = [tenantMiddleware, authMiddleware, subscriptionCheck];
const r = (perm: string) => rbacMiddleware(perm);

router.get("/options", ...mw, r("accounts.read"), getAccountOptions);

/* income */
router.post("/income", ...mw, r("accounts.create"), createIncome);
router.get("/income", ...mw, r("accounts.read"), getIncomeList);
router.delete("/income/:id", ...mw, r("accounts.delete"), deleteAccount);

/* expense */
router.post("/expense", ...mw, r("accounts.create"), createExpense);
router.get("/expense", ...mw, r("accounts.read"), getExpenseList);
router.delete("/expense/:id", ...mw, r("accounts.delete"), deleteAccount);

/* report */
router.get("/report", ...mw, r("accounts.read"), getReport);

/* student fees */
router.post("/fees", ...mw, r("accounts.create"), createStudentFee);
router.get("/fees", ...mw, r("accounts.read"), getStudentFees);
router.get("/fees/summary", ...mw, r("accounts.read"), getStudentFeesSummary);
router.put("/fees/:id/pay", ...mw, r("accounts.update"), payStudentFee);
router.delete("/fees/:id", ...mw, r("accounts.delete"), deleteStudentFee);

/* teacher salaries */
router.post("/salaries/generate", ...mw, r("accounts.create"), generateMonthlySalaries);
router.post("/salaries", ...mw, r("accounts.create"), createTeacherSalary);
router.get("/salaries", ...mw, r("accounts.read"), getTeacherSalaries);
router.get("/salaries/summary", ...mw, r("accounts.read"), getTeacherSalarySummary);
router.put("/salaries/:id/pay", ...mw, r("accounts.update"), payTeacherSalary);

export default router;
