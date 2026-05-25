type Props = {
  role: "user" | "assistant";

  text: string;
};

export function SessionMessage({ role, text }: Props) {
  return (
    <div
      className={`
        rounded-2xl
        p-4
        whitespace-pre-wrap
        ${
          role === "assistant"
            ? "bg-violet-500/10 border border-violet-500/20"
            : "bg-white/5 border border-white/10"
        }
      `}
    >
      <div className="text-xs uppercase opacity-60 mb-2">{role}</div>

      <div className="leading-7">{text}</div>
    </div>
  );
}
