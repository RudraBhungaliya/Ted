import { Router } from "express";
import * as signupController from "./signup.controller";

const router = Router();

router.post("/", signupController.signup);

export default router;
