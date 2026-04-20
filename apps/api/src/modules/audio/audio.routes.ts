import { Router } from "express";
import { upload } from "../../shared/lib/multer";
import * as audioController from "./audio.controller";

const router = Router();

router.post("/upload", upload.single("audio"), audioController.uploadActive);
router.post("/process", upload.single("audio"), audioController.processChunk);

export default router;