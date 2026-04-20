import { Router } from "express";
import audioRoutes from "./audio/audio.routes";
import streamRoutes from "./stream/stream.routes";
import authRoutes from "./auth";

const modulesRouter = Router();

modulesRouter.use("/auth", authRoutes);
modulesRouter.use("/audio", audioRoutes);
modulesRouter.use("/stream", streamRoutes);

export default modulesRouter;
