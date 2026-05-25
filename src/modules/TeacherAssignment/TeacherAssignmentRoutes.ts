import express from "express";
import {
  getAssignments,
  getAllAssignments,
  saveAssignment,
  updateAssignment,
  deleteAssignment,
} from "./TeacherAssignmentController";

const router = express.Router();

router.get("/", getAssignments);
router.get("/all", getAllAssignments);

router.post("/", saveAssignment);
router.put("/", updateAssignment);

// FIXED (delete body issue safe)
router.post("/delete", deleteAssignment);

export default router;
