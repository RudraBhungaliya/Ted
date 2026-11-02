"use client";

import { Mic } from "lucide-react";

export default function TranscriptEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-3 shadow-2xs">
        <Mic className="w-5 h-5 text-stone-600" />
      </div>
      <h3 className="text-sm font-semibold text-stone-800">
        Ready to take notes
      </h3>
      <p className="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">
        Start speaking or play audio from your meeting. Transcripts and live suggestions will stream here naturally.
      </p>
    </div>
  );
}
