import { Calendar, Clock, PlayCircle } from "lucide-react";

type Props = {
  session: {
    id: string;
    startedAt: string;
    endedAt: string | null;
  };
};

export function SessionCard({ session }: Props) {
  const isCompleted = !!session.endedAt;

  return (
    <a
      href={`/history/${session.id}`}
      className="block border border-white/[0.06] rounded-2xl p-5 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-indigo-500/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/5 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
        <PlayCircle className="w-16 h-16 text-indigo-400" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Session ID</span>
          <div className="font-mono text-sm text-zinc-300 truncate max-w-[200px] mt-0.5">{session.id}</div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
          isCompleted
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        }`}>
          {isCompleted ? "Completed" : "Active"}
        </span>
      </div>

      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>Started: {new Date(session.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        {session.endedAt && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Ended: {new Date(session.endedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
      </div>
    </a>
  );
}
