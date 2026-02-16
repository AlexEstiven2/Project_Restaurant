import express from "express";
import { guardarFeedback, obtenerFeedbacks } from "../Controllers/FeedbackController.js";

const router = express.Router();

router.post("/api/feedback/guardar", guardarFeedback);
router.get("/api/feedback", obtenerFeedbacks);

export default router; 