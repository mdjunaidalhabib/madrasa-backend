import express from "express";

import {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../students/student.controller";

const router = express.Router();

router.get("/", getStudents);

router.get("/:id", getStudentById);

router.put("/:id", updateStudent);

router.delete("/:id", deleteStudent);

export default router;
