"use client";

import { useInterviewStore } from "../features/interview/store";

export default function TranscriptView() {
  const chunks = useInterviewStore((s) => s.chunks);

  return (
    <div className="flex flex-col gap-1 text-sm">
      {chunks.map((c, i) => (
        <div key={i} className="whitespace-pre-wrap break-words">
          {c}
        </div>
      ))}
    </div>
  );
}