import { Router } from "express";
import audioRoutes from "./modules/audio/audio.routes";
import streamRoutes from "./modules/stream/stream.routes";

const router = Router();

router.use("/audio", audioRoutes);
router.use("/stream", streamRoutes);

export default router;