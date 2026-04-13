"use client";

export default function RecordingIndicator({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-2 h-2 rounded-full ${
          active ? "bg-red-500 animate-pulse" : "bg-gray-500"
        }`}
      />
      {active ? "Recording" : "Idle"}
    </div>
  );
}