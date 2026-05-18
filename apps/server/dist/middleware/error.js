import { logger } from "../config/logger.js";
export async function errorHandler(error, reply) {
    logger.error(error);
    return reply.status(500).send({
        success: false,
        message: "Internal Server Error",
    });
}
