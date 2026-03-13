import { Router } from "express";
import { createAdmission } from "./admissionController";

const router = Router();

router.post("/", createAdmission);

export default router;
