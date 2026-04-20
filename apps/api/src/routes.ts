import { Router } from "express";
import modulesRouter from "./modules";

const router = Router();

// Mount all module routes
router.use(modulesRouter);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;