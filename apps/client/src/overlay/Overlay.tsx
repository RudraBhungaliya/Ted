"use client";

import FloatingPanel from "./FloatingPanel";
import StreamRenderer from "./StreamRenderer";
import { useInterview } from "../features/interview/useInterview";
import { useInterviewStore } from "../features/interview/store";

export default function Overlay() {
  const { handleStart, handleStop } = useInterview();
  const isRecording = useInterviewStore((s) => s.isRecording);

  return (
    <FloatingPanel onStart={handleStart} onStop={handleStop}>
      <StreamRenderer url="/api/stream" enabled={isRecording} />
    </FloatingPanel>
  );
}