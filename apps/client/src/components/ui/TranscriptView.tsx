"use client";

import { useInterviewStore } from "../../features/interview/store";

export default function TranscriptView() {
  const streamData = useInterviewStore((s) => s.streamData);

  return (
    <div className="flex flex-col gap-1 text-sm">
      {streamData.map((c: string, i: number) => (
        <div key={i} className="whitespace-pre-wrap break-words">
          {c}
        </div>
      ))}
    </div>
  );
}