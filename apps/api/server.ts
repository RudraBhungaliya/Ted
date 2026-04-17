import express from "express";
import cors from "cors";

import { POST as audioRoutes } from "./audio/audio.routes";
import { GET as streamRoutes } from "./stream/stream.routes";

const app = express();
app.use(cors());

app.use("/audio", audioRoutes);
app.use("/stream", streamRoutes);

app.listen(3001, () => {
    console.log("Server running on port 3000");
});