"use client";

import FloatingPanel from "./FloatingPanel";
import { useInterview } from "../features/interview/useInterview";
import { useInterviewStore } from "../features/interview/store";

export default function Overlay() {
  const { handleStart, handleStop, handleSetMode } = useInterview();
  const isRecording = useInterviewStore((s) => s.isRecording);

  return (
    <FloatingPanel onStart={handleStart} onStop={handleStop} onSetMode={handleSetMode}>
      <div className="h-full w-full flex items-center justify-center text-xs text-stone-500 font-medium py-3">
        {isRecording
          ? "Listening to audio conversation in real time..."
          : "Ready to assist. Start recording when conversation begins."}
      </div>
    </FloatingPanel>
  );
}
