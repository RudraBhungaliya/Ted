import { Router } from "express";
import audioRoutes from "./audio.routes";

const router = Router();

router.use(audioRoutes);

export default router;
