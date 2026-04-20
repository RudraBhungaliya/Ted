import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./shared/middleware/error.middleware";
import { ENV } from "./config/environment";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));

// Routes
app.use("/api/v1", routes);

// Error handling middleware
app.use(errorHandler);

// Server startup
const PORT = ENV.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📝 Environment: ${ENV.NODE_ENV}`);
});