"use client";

import FloatingPanel from "./FloatingPanel";

import { useInterview } from "../features/interview/useInterview";

import { useInterviewStore } from "../features/interview/store";

export default function Overlay() {
  const { handleStop } = useInterview();

  const isRecording = useInterviewStore((s) => s.isRecording);

  return (
    <FloatingPanel onStart={() => {}} onStop={handleStop}>
      <div
        className="
                    h-full
                    w-full
                    flex
                    items-center
                    justify-center
                    text-sm
                    text-neutral-400
                "
      >
        {isRecording
          ? "Listening..."
          : "Start recording to receive live transcript chunks."}
      </div>
    </FloatingPanel>
  );
}
