"use client";

import { useSessions } from "./useSessions";
import { Briefcase, Users, Calendar, ArrowRight } from "lucide-react";
import Loader from "../../components/common/Loader";

interface Props {
  selectedId?: string | null;
  onSelect: (sessionId: string) => void;
}

interface SessionItem {
  id: string;
  mode?: string;
  status?: string;
  startedAt?: string;
}

export function SessionList({ selectedId, onSelect }: Props) {
  const { sessions, loading } = useSessions();

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs">
        <Loader label="Loading session records..." />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs">
        <p className="text-xs text-stone-400">No session recordings found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {sessions.map((session: SessionItem) => {
        const isSelected = selectedId === session.id;
        const isInterview = session.mode === "INTERVIEW";
        const dateStr = session.startedAt
          ? new Date(session.startedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recent Session";

        return (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
              isSelected
                ? "bg-amber-50/70 border-amber-300 shadow-xs"
                : "bg-white border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/70"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isInterview
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isInterview ? (
                  <Briefcase className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-stone-800">
                    {isInterview ? "Interview Prep" : "Meeting Sync"}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      session.status === "ACTIVE"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-stone-100 text-stone-600 border border-stone-200/70"
                    }`}
                  >
                    {session.status === "ACTIVE" ? "Live" : "Completed"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <Calendar className="w-3 h-3" />
                  <span className="truncate">{dateStr}</span>
                </div>
              </div>
            </div>

            <ArrowRight
              className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                isSelected
                  ? "text-amber-700 translate-x-0.5"
                  : "text-stone-300 group-hover:text-stone-500"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
