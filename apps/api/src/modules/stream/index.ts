import { Router } from "express";
import streamRoutes from "./stream.routes";

const router = Router();

router.use(streamRoutes);

export default router;
