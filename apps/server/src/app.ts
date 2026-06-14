import Fastify from "fastify";

import cors from "@fastify/cors";

import websocket from "@fastify/websocket";

import cookie from "@fastify/cookie";

import { env } from "./config/env.js";

import { logger } from "./config/logger.js";

import { registerRoutes } from "./api/index.js";

import "./types/fastify.js";

import { startRealtimeWorker } from "./modules/realtime/worker.js";
import { errorHandler } from "./middleware/error.js";
import { db } from "./db/client.js";

const app = Fastify({
  logger: false,
  ignoreTrailingSlash: true,
});

app.setErrorHandler(errorHandler);

await app.register(websocket);

await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(cookie, {
  secret: env.JWT_SECRET,
});

await registerRoutes(app);

async function checkExpiredSubscriptions() {
  try {
    const now = new Date();
    const expiredSubCount = await db.subscription.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });
    if (expiredSubCount.count > 0) {
      logger.info(`Expired ${expiredSubCount.count} subscriptions.`);
    }
  } catch (err) {
    logger.error(err, "Error checking expired subscriptions");
  }
}

const start = async () => {
  try {
    await startRealtimeWorker();

    logger.info("Realtime worker started");

    await checkExpiredSubscriptions();
    setInterval(() => {
      void checkExpiredSubscriptions();
    }, 10 * 60 * 1000);

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
