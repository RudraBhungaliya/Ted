import { Router } from "express";
import { streamHandler } from "./stream.controller";

const router = Router();

router.get("/", streamHandler);

export default router;