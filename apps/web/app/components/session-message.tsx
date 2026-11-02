type Props = {
  role: "user" | "assistant" | "interviewer" | "ai";
  speakerName?: string;
  text: string;
};

function displayLabel(role: Props["role"], speakerName?: string) {
  if (speakerName) return speakerName;
  if (role === "user") return "You";
  if (role === "interviewer") return "Interviewer";
  if (role === "ai" || role === "assistant") return "Ted Note";
  return role;
}

export function SessionMessage({ role, speakerName, text }: Props) {
  const isAssistant = role === "assistant" || role === "ai";
  const isUser = role === "user";
  const label = displayLabel(role, speakerName);

  if (isAssistant) {
    return (
      <div className="rounded-2xl p-4 bg-amber-50/70 border border-amber-200/90 shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
            {label}
          </span>
        </div>
        <div className="leading-relaxed text-stone-900 font-normal whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 border shadow-2xs ${
        isUser
          ? "bg-white border-stone-200/90"
          : "bg-stone-50 border-stone-200/80"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isUser ? "bg-emerald-600" : "bg-stone-500"
          }`}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
          {label}
        </span>
      </div>
      <div className="leading-relaxed text-stone-900 whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}
