import { Router } from "express";
import multer from "multer";

import { sessions } from "../../../../web/src/lib/realtime/sessions";
import { processAudio } from "../../../../web/src/lib/realtime/pipeline";

const router = Router();
const upload = multer();

router.post("/", upload.single("audio"), async (req, res) => {
    const sessionId = req.body.sessionId;
    const file = req.file;

    if (!sessionId || !file) return res.sendStatus(400);

    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            buffer: [],
            textBuffer: "",
            lastActive: Date.now(),
        };
    }

    const session = sessions[sessionId];

    const chunk = file.buffer.buffer.slice(
        file.buffer.byteOffset,
        file.buffer.byteOffset + file.buffer.byteLength,
    ) as ArrayBuffer;
    session.buffer.push(new Blob([chunk]));
    session.lastActive = Date.now();

    // trigger pipeline async
    setTimeout(() => processAudio(sessionId), 0);

    res.send("ok");
});

export default router;