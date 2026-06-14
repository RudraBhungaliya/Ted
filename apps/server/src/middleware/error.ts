import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/error.js";

export async function errorHandler(
    error : any,
    request : FastifyRequest,
    reply : FastifyReply, 
) {
    if (error instanceof AppError || (error && typeof error.statusCode === "number")) {
        const statusCode = error.statusCode || 400;
        return reply.status(statusCode).send({
            success : false,
            message : error.message,
        });
    }

    logger.error(error);

    return reply.status(500).send({
        success : false,
        message : "Internal Server Error",
    });
}