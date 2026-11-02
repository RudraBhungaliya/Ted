"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Clock, ArrowRight, Filter } from "lucide-react";
import Navbar from "../components/common/Navbar";
import { useSessions } from "../features/interview/useSessions";

export default function HistoryPage() {
  const router = useRouter();
  const { groupedSessions, isLoading } = useSessions();
  const [filterMode, setFilterMode] = useState<"ALL" | "INTERVIEW" | "MEETING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = groupedSessions
    .map((group) => {
      const filteredItems = group.items.filter((item: any) => {
        const matchesMode =
          filterMode === "ALL" || item.mode === filterMode;
        const matchesSearch =
          searchQuery.trim() === "" ||
          (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMode && matchesSearch;
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-amber-200">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Session History
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Search, review, and export previous interview transcripts and meeting summaries.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-stone-200 shadow-2xs w-full sm:w-auto">
            <button
              onClick={() => setFilterMode("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterMode === "ALL"
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setFilterMode("INTERVIEW")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterMode === "INTERVIEW"
                  ? "bg-orange-600 text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Interviews
            </button>
            <button
              onClick={() => setFilterMode("MEETING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterMode === "MEETING"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Meetings
            </button>
          </div>
        </div>

        {/* Sessions list */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center text-stone-400 text-sm">
            Loading your session history...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
              <Calendar className="w-5 h-5 text-stone-500" />
            </div>
            <h3 className="text-base font-semibold text-stone-800">
              No sessions found
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? `No sessions match "${searchQuery}". Try a different keyword.`
                : "You have not recorded any sessions in this category yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredGroups.map((group, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-stone-200/80" />
                </div>

                <div className="space-y-2.5">
                  {group.items.map((session: any) => {
                    const isMeeting = session.mode === "MEETING";
                    const isCompleted = session.status === "COMPLETED";

                    return (
                      <div
                        key={session.id}
                        onClick={() => router.push(`/session/${session.id}`)}
                        className="bg-white p-5 rounded-2xl border border-stone-200/90 hover:border-stone-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 sm:mt-0 ${
                              isCompleted
                                ? "bg-stone-300"
                                : "bg-emerald-500 animate-pulse"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm text-stone-900 group-hover:text-stone-950">
                                {session.title || (isMeeting ? "Meeting Session" : "Assistant Session")}
                              </h3>
                              <span
                                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  isMeeting
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-orange-50 text-orange-800 border-orange-200"
                                }`}
                              >
                                {session.mode}
                              </span>
                            </div>
                            <span className="text-xs text-stone-400 font-mono block">
                              ID: {session.id.slice(0, 14)}...
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-stone-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>{session.time}</span>
                          </div>

                          <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-mono border border-stone-200">
                            {session.duration || "0:00"}
                          </span>

                          <div className="w-7 h-7 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-stone-900 group-hover:bg-stone-100 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
