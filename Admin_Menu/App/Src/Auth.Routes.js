// App/Src/Routes/Auth.Routes.js
import { Router } from "express";
import { login } from "../Controllers/AuthController.js";

const router = Router();

router.post("/api/login", login);

export default router; 