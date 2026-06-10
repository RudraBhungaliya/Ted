"use client";

import { useInterviewStore } from "../../features/interview/store";
import TranscriptEmptyState from "./TranscriptEmptyState";

function labelForTurn(turn: {
  role: string;
  speakerName: string;
}) {
  if (turn.speakerName) return turn.speakerName;
  if (turn.role === "user") return "You";
  if (turn.role === "interviewer") return "Interviewer";
  if (turn.role === "ai" || turn.role === "assistant") return "TED (AI)";
  return "Participant";
}

export default function TranscriptView() {
  const history = useInterviewStore((s) => s.history);
  const finalTranscript = useInterviewStore((s) => s.finalTranscript);
  const partialTranscript = useInterviewStore((s) => s.partialTranscript);
  const aiResponse = useInterviewStore((s) => s.aiResponse);

  const hasContent =
    history.length > 0 || finalTranscript || partialTranscript || aiResponse;

  if (!hasContent) {
    return <TranscriptEmptyState />;
  }

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      {history.map((turn) => {
        const label = labelForTurn(turn);
        const isAi = turn.role === "ai" || turn.role === "assistant";

        if (isAi) {
          return (
            <div
              key={turn.id}
              className="rounded-lg border border-indigo-500/15 bg-indigo-500/5 p-2.5"
            >
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                {label}
              </div>
              <div className="whitespace-pre-wrap break-words text-zinc-200">
                {turn.text}
              </div>
            </div>
          );
        }

        return (
          <div key={turn.id} className="space-y-0.5">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
              {label}
            </span>
            <div className="whitespace-pre-wrap break-words text-zinc-300">
              {turn.text}
            </div>
          </div>
        );
      })}

      {(finalTranscript || partialTranscript) && (
        <div className="space-y-1">
          <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
            Live
          </span>
          {finalTranscript && (
            <div className="whitespace-pre-wrap break-words text-zinc-200">
              {finalTranscript}
            </div>
          )}
          {partialTranscript && (
            <div className="whitespace-pre-wrap break-words italic text-zinc-500">
              {partialTranscript}
            </div>
          )}
        </div>
      )}

      {aiResponse && (
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2.5">
          <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-indigo-400">
            TED (AI)
          </div>
          <div className="whitespace-pre-wrap break-words text-zinc-100">
            {aiResponse}
          </div>
        </div>
      )}
    </div>
  );
}
