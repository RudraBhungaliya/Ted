import { Router } from "express";
import signupRoutes from "./signup/signup.routes";

const router = Router();

router.use("/signup", signupRoutes);

export default router;
