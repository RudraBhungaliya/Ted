import express from "express";
import cors from "cors";
import routes from "./routes";
// import { errorHandler } from "./middleware/error.middleware";

import audioRoutes from "./modules/audio/audio.routes";
import streamRoutes from "./modules/stream/stream.routes";

const app = express();
app.use(express.json());
// app.use(errorHandler);

app.use(cors({
    origin : "http://localhost:3000",
    credentials : true,
}));

app.use("/api/v1", routes);

app.listen(3001, () => {
    console.log("Server running on port 3001");
});