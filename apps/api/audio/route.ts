import { sendToClients } from "../stream/route";

let buffers: Record<string, Blob[]> = {};

export async function POST(req: Request) {
    const form = await req.formData();

    const audio = form.get("audio") as Blob;
    const sessionId = form.get("sessionId") as string;

    if (!buffers[sessionId]) buffers[sessionId] = [];
    buffers[sessionId].push(audio);

    await processAudio(sessionId);

    return new Response("Audio Received");
}

// processing layer
async function processAudio(sessionId : string){
    const chunks = buffers[sessionId];

    if(chunks.length < 3) return;
    const merged = new Blob(chunks, { type : "audio/webm" });
    buffers[sessionId] = [];

    // TEMp SIT
    const fakeText = "User speaking...";

    sendToClients({
        type : "transription",
        text : fakeText,
    })

    // AI Simulation
    sendToClients({
        type : "ai",
        text : "Ai response streaming",
    });


}
