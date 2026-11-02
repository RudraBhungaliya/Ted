"use client";

export default function RecordingIndicator({ active }: { active: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-rose-50 text-rose-800 border-rose-200"
          : "bg-stone-100 text-stone-600 border-stone-200"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          active ? "bg-rose-600 animate-pulse" : "bg-stone-400"
        }`}
      />
      <span>{active ? "Listening Live" : "Microphone Idle"}</span>
    </div>
  );
}
