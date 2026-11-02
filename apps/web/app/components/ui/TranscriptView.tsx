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
  if (turn.role === "ai" || turn.role === "assistant") return "Ted Note";
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
    <div className="flex flex-col gap-3 text-sm">
      {history.map((turn) => {
        const label = labelForTurn(turn);
        const isAssistant = turn.role === "ai" || turn.role === "assistant";
        const isUser = turn.role === "user";

        if (isAssistant) {
          return (
            <div
              key={turn.id}
              className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3.5 shadow-2xs"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                  {label}
                </span>
              </div>
              <div className="whitespace-pre-wrap break-words text-stone-800 leading-relaxed">
                {turn.text}
              </div>
            </div>
          );
        }

        return (
          <div
            key={turn.id}
            className={`rounded-xl border p-3.5 shadow-2xs ${
              isUser
                ? "bg-white border-stone-200/90"
                : "bg-stone-50 border-stone-200/80"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isUser ? "bg-emerald-600" : "bg-stone-500"
                }`}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                {label}
              </span>
            </div>
            <div className="whitespace-pre-wrap break-words text-stone-900 leading-relaxed">
              {turn.text}
            </div>
          </div>
        );
      })}

      {(finalTranscript || partialTranscript) && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
              Live Speech
            </span>
          </div>
          {finalTranscript && (
            <div className="whitespace-pre-wrap break-words text-stone-900 leading-relaxed">
              {finalTranscript}
            </div>
          )}
          {partialTranscript && (
            <div className="whitespace-pre-wrap break-words text-stone-500 italic mt-1 leading-relaxed">
              {partialTranscript}
            </div>
          )}
        </div>
      )}

      {aiResponse && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
              Suggested Note
            </span>
          </div>
          <div className="whitespace-pre-wrap break-words text-stone-900 leading-relaxed font-medium">
            {aiResponse}
          </div>
        </div>
      )}
    </div>
  );
}
