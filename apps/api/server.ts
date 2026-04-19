import express from "express";
import cors from "cors";

import audioRoutes from "./audio/audio.routes";
import streamRoutes from "./stream/stream.routes";

const app = express();
app.use(cors());

app.use("/audio", audioRoutes);
app.use("/stream", streamRoutes);

app.listen(3001, () => {
    console.log("Server running on port 3001");
});