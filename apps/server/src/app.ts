import Fastify from "fastify";

import cors from "@fastify/cors";

import websocket from "@fastify/websocket";

import cookie from "@fastify/cookie";

import { env } from "./config/env.js";

import { logger } from "./config/logger.js";

import { registerRoutes } from "./api/index.js";

import "./types/fastify.js";

import { startRealtimeWorker } from "./modules/realtime/worker.js";

const app = Fastify({
  logger: false,
});

await app.register(websocket);

await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(cookie, {
  secret: env.JWT_SECRET,
});

await registerRoutes(app);

const start = async () => {
  try {
    await startRealtimeWorker();

    logger.info("Realtime worker started");

    await app.listen({
      port: Number(env.PORT),
      host: "0.0.0.0",
    });

    logger.info(`Server is running on port ${env.PORT}`);
  } catch (err) {
    logger.error(err);

    process.exit(1);
  }
};

start();
