import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";

type Props = {
  session: {
    id: string;
    startedAt: string;
    endedAt: string | null;
    mode?: string;
    title?: string | null;
  };
};

export function SessionCard({ session }: Props) {
  const isCompleted = !!session.endedAt;
  const isMeeting = session.mode === "MEETING";

  return (
    <Link
      href={`/session/${session.id}`}
      className="block bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-200 group relative"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isMeeting
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-orange-50 text-orange-800 border-orange-200"
              }`}
            >
              {isMeeting ? "Meeting" : "Interview"}
            </span>

            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                isCompleted
                  ? "bg-stone-100 text-stone-600 border-stone-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {isCompleted ? "Saved" : "In Progress"}
            </span>
          </div>

          <h3 className="font-semibold text-stone-900 text-base group-hover:text-stone-950 transition-colors">
            {session.title || (isMeeting ? "General Discussion" : "Technical Interview")}
          </h3>
          <span className="font-mono text-xs text-stone-400 block mt-0.5">
            #{session.id.slice(0, 10)}
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-stone-900 group-hover:bg-stone-100 transition-colors">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>
            {new Date(session.startedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span>
            {new Date(session.startedAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
