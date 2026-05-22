"use client";

import { useInterviewStore } from "../../features/interview/store";
import TranscriptEmptyState from "./TranscriptEmptyState";

export default function TranscriptView() {
  const finalTranscript = useInterviewStore((s) => s.finalTranscript);

  const partialTranscript = useInterviewStore((s) => s.partialTranscript);

  const aiResponse = useInterviewStore((s) => s.aiResponse);

  const hasContent = finalTranscript || partialTranscript || aiResponse;

  if (!hasContent) {
    return <TranscriptEmptyState />;
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* Transcript section */}
      {(finalTranscript || partialTranscript) && (
        <div>
          {finalTranscript && (
            <div className="whitespace-pre-wrap break-words text-zinc-800">
              {finalTranscript}
            </div>
          )}
          {partialTranscript && (
            <div className="whitespace-pre-wrap break-words text-zinc-400 italic">
              {partialTranscript}
            </div>
          )}
        </div>
      )}

      {/* AI Response section */}
      {aiResponse && (
        <div className="mt-2 pt-2 border-t border-zinc-200/60">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 mb-1">
            AI Response
          </div>
          <div className="whitespace-pre-wrap break-words text-zinc-700 leading-relaxed">
            {aiResponse}
          </div>
        </div>
      )}
    </div>
  );
}
