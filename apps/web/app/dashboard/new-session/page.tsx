"use client";

import { useState } from "react";
import { createSession } from "../../features/session/api";

export default function NewSessionPage() {
  const [mode, setMode] = useState<"INTERVIEW" | "MEETING">("INTERVIEW");

  async function start() {
    const session = await createSession(mode);

    window.location.href = `/session/${session.id}`;
  }

  return (
    <div>
      <h1>Choose Session Type</h1>

      <button onClick={() => setMode("INTERVIEW")}>Interview</button>

      <button onClick={() => setMode("MEETING")}>Meeting</button>

      <button onClick={start}>Start Session</button>
    </div>
  );
}
