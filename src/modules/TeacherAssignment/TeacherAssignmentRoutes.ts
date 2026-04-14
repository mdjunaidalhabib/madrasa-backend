import express from "express";
import {
  getAssignments,
  saveAssignments,
  getAllAssignments,
} from "./TeacherAssignmentController";

const router = express.Router();

router.get("/", getAssignments);
router.get("/all", getAllAssignments);
router.post("/", saveAssignments);

export default router;
