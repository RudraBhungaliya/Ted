"use client";

import { useInterviewStore } from "../../features/interview/store";
import TranscriptEmptyState from "./TranscriptEmptyState";

export default function TranscriptView() {
  const history = useInterviewStore((s) => s.history);

  const finalTranscript = useInterviewStore((s) => s.finalTranscript);

  const partialTranscript = useInterviewStore((s) => s.partialTranscript);

  const aiResponse = useInterviewStore((s) => s.aiResponse);

  const hasContent = history.length > 0 || finalTranscript || partialTranscript || aiResponse;

  if (!hasContent) {
    return <TranscriptEmptyState />;
  }

  return (
    <div className="flex flex-col gap-4 text-[13.5px]">
      {/* History of transcript turns */}
      {history.map((turn, index) => (
        <div key={index} className="space-y-1">
          {turn.role === "user" ? (
            <div className="whitespace-pre-wrap break-words text-zinc-300 leading-relaxed font-medium">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">You</span>
              {turn.text}
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
                AI Answer
              </div>
              <div className="whitespace-pre-wrap break-words text-zinc-300 leading-relaxed font-normal text-[13px]">
                {turn.text}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Current/live user transcript */}
      {(finalTranscript || partialTranscript) && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">You (speaking)</span>
          {finalTranscript && (
            <div className="whitespace-pre-wrap break-words text-zinc-200 leading-relaxed font-medium">
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
        <div className="mt-1 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 shadow-inner">
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
