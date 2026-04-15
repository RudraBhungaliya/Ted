"use client";

import { ReactNode } from "react";
import { useInterviewStore } from "../features/interview/store";
import TranscriptView from "../components/ui/TranscriptView";
import RecordingIndicator from "../components/ui/RecordingIndicator";
import Button from "../components/common/Button";

type Props = {
  children: ReactNode;
  onStart: () => void;
  onStop: () => void;
};

export default function FloatingPanel({ children, onStart, onStop }: Props) {
  const isRecording = useInterviewStore((state) => state.isRecording);
  const chunkCount = useInterviewStore((state) => state.streamData.length);

  return (
    <>
      <div className="fixed bottom-6 right-6 h-[420px] w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <div className="text-sm font-medium">
            <RecordingIndicator active={isRecording} />
          </div>

          <Button onClick={isRecording ? onStop : onStart}>
            {isRecording ? "Stop" : "Start"}
          </Button>
        </div>

        <div className="flex h-[calc(100%-48px)] flex-col p-3">
          <div className="mb-2 text-xs text-zinc-400">
            {chunkCount > 0
              ? `${chunkCount} transcript chunk${chunkCount > 1 ? "s" : ""}`
              : "No transcript yet"}
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3">
            <TranscriptView />
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
