import { sessions } from "../../web/src/lib/realtime/sessions";
import { processAudio } from "../../web/src/lib/realtime/pipeline";

export async function POST(req: Request) {
  const form = await req.formData();

  const audio = form.get("audio") as Blob;
  const sessionId = form.get("sessionId") as string;

  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      buffer: [],
      textBuffer: "",
      lastActive: Date.now(),
    };
  }

  sessions[sessionId].buffer.push(audio);

  // async trigger (non-blocking)
  setTimeout(() => processAudio(sessionId), 0);

  return new Response("ok");
}

// // processing layer
// async function processAudio(sessionId : string){
//     const chunks = buffers[sessionId];

//     if(chunks.length < 3) return;
//     const merged = new Blob(chunks, { type : "audio/webm" });
//     buffers[sessionId] = [];

//     // TEMp SIT
//     const fakeText = "User speaking...";

//     sendToClients({
//         type : "transription",
//         text : fakeText,
//     })

//     // AI Simulation
//     sendToClients({
//         type : "ai",
//         text : "Ai response streaming",
//     });

// }
