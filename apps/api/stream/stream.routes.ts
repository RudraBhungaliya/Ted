import { Router } from "express";
import { addClient, removeClient } from "../../web/src/lib/realtime/eventBus";

const router = Router();

router.get("/", (req, res) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) return res.sendStatus(400);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const controller = {
        enqueue: (data: string) => res.write(data),
    } as unknown as ReadableStreamDefaultController;

    addClient(sessionId, controller);

    req.on("close", () => {
        removeClient(sessionId, controller);
    });
});

export default router;