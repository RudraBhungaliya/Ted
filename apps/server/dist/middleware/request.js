import { v4 as uuid } from "uuid";
import { logger } from "../config/logger.js"; // direct js -> ts using NodeNext
export async function requestMiddleware(request, reply) {
    const requestId = uuid();
    request.headers["x-request-id"] = requestId;
    logger.info({
        requestId,
        method: request.method,
        url: request.url,
    });
    reply.header("x-request-id", requestId);
}
