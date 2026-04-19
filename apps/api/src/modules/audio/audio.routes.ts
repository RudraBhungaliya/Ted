import { Router } from "express";
import multer from "multer";
import { uploadActive, processChunk } from "./audio.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("audio"), uploadActive);
router.post("/chunk", upload.single("audio"), processChunk);

export default router;