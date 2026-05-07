"use client";

import { useInterviewStore } from "../../features/interview/store";
import TranscriptEmptyState from "./TranscriptEmptyState";

export default function TranscriptView() {
  const streamData = useInterviewStore((s) => s.streamData);

  if (streamData.length === 0) {
    return <TranscriptEmptyState />;
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      {streamData.map((c: string, i: number) => (
        <div key={`${i}-${c.slice(0, 16)}`} className="whitespace-pre-wrap break-words">
          {c}
        </div>
      ))}
    </div>
  );
}