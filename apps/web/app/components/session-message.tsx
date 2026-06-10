type Props = {
  role: "user" | "assistant" | "interviewer" | "ai";
  speakerName?: string;
  text: string;
};

function displayLabel(role: Props["role"], speakerName?: string) {
  if (speakerName) return speakerName;
  if (role === "user") return "You";
  if (role === "interviewer") return "Interviewer";
  if (role === "ai" || role === "assistant") return "TED (AI)";
  return role;
}

export function SessionMessage({ role, speakerName, text }: Props) {
  const isAi = role === "assistant" || role === "ai";
  const label = displayLabel(role, speakerName);

  return (
    <div
      className={`rounded-2xl p-4 whitespace-pre-wrap ${
        isAi
          ? "border border-violet-500/20 bg-violet-500/10"
          : "border border-white/10 bg-white/5"
      }`}
    >
      <div className="mb-2 text-xs uppercase opacity-60">{label}</div>
      <div className="leading-7">{text}</div>
    </div>
  );
}
