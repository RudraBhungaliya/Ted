import { subscribe, unsubscribe } from "../../shared/lib/eventBus";
import { Request, Response } from "express";

export const streamHandler = (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    const send = (event: any) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    subscribe(send);

    req.on("close", () => {
        unsubscribe(send);
        res.end();
    });
};