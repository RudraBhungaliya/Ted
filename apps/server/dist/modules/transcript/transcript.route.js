import { authMiddleware } from "../../middleware/auth.js";
import { getTranscript } from "./service.js";
export async function transcriptRoute(app) {
    app.get("/:sessionId", {
        preHandler: authMiddleware,
    }, async (req) => {
        const { sessionId } = req.params;
        const transcript = await getTranscript(sessionId);
        return {
            success: true,
            data: transcript,
        };
    });
}
