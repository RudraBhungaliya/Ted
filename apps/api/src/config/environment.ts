import dotenv from "dotenv";
dotenv.config();

export const ENV = {
    DATABASE_URL : process.env.DATABASE_URL!,
    REDIS_URL : process.env.REDIS_URL!,
    XAI_API_KEY : process.env.XAI_API_KEY || "",
    XAI_BASE_KEY : process.env.XAI_BASE_KEY || "",
    PORT : Number(process.env.PORT || 3001),
    JWT_SECRET: process.env.JWT_SECRET!,
    NODE_ENV: process.env.NODE_ENV || "development",
};
