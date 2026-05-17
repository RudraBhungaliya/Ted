import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { registerRoutes } from "./api/index.js";
import "./types/fastify.js";
import cookie from "@fastify/cookie";

const app = Fastify({// fastapi instance
    logger  : false,
});

await app.register(cors, {
    origin : true,
    credentials : true,
})

await app.register(cookie, {
    secret: env.JWT_SECRET,
});

await registerRoutes(app);



const start = async () => {
    try {
        await app.listen({
            port : Number(env.PORT),
            host : "0.0.0.0",
        });

        logger.info(`Server is running on port ${env.PORT}`);
    }
    catch(err){
        logger.error(err);
        process.exit(1);//terminate
    }
}

start();