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
    <div className="flex flex-col gap-3 text-[13.5px]">
      {/* Transcript section */}
      {(finalTranscript || partialTranscript) && (
        <div className="space-y-1.5">
          {finalTranscript && (
            <div className="whitespace-pre-wrap break-words text-zinc-200 leading-relaxed">
              {finalTranscript}
            </div>
          )}
          {partialTranscript && (
            <div className="whitespace-pre-wrap break-words text-zinc-500 italic font-normal">
              {partialTranscript}
            </div>
          )}
        </div>
      )}

      {/* AI Response section */}
      {aiResponse && (
        <div className="mt-2.5 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 shadow-inner">
          <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI Suggestion
          </div>
          <div className="whitespace-pre-wrap break-words text-zinc-100 leading-relaxed font-normal text-[13px]">
            {aiResponse}
          </div>
        </div>
      )}
    </div>
  );
}
