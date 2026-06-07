"use client";

import { useRouter } from "next/navigation";
import { useSessions } from "../features/interview/useSessions";

export default function HistoryPage() {
  const router = useRouter();

  const { groupedSessions, isLoading } = useSessions();

  return (
    <main className="min-h-screen bg-[#090D1A] text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Session History</h1>

            <p className="text-zinc-400 mt-2">Review previous TED sessions.</p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="
              px-4
              py-2
              rounded-lg
              bg-indigo-600
              hover:bg-indigo-500
              transition
            "
          >
            Back
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-zinc-400">
            Loading sessions...
          </div>
        ) : groupedSessions.length === 0 ? (
          <div
            className="
              rounded-xl
              border
              border-white/10
              bg-white/5
              p-10
              text-center
              text-zinc-400
            "
          >
            No sessions found.
          </div>
        ) : (
          groupedSessions.map((group, idx) => (
            <div key={idx} className="mb-10">
              <h2
                className="
                  text-sm
                  uppercase
                  tracking-widest
                  text-zinc-500
                  mb-4
                "
              >
                {group.date}
              </h2>

              <div className="space-y-3">
                {group.items.map((session: any) => (
                  <div
                    key={session.id}
                    onClick={() => router.push(`/session/${session.id}`)}
                    className="
                      p-5
                      rounded-xl
                      bg-white/5
                      border
                      border-white/10
                      hover:bg-white/10
                      transition
                      cursor-pointer
                    "
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {session.title}
                        </h3>

                        <p className="text-zinc-400 text-sm mt-1">
                          {session.mode}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-zinc-300">
                          {session.time}
                        </div>

                        <div className="text-xs text-zinc-500 mt-1">
                          {session.duration}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <span
                        className={`
                          px-2
                          py-1
                          rounded-md
                          text-xs
                          ${
                            session.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400"
                              : session.status === "ACTIVE"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-red-500/20 text-red-400"
                          }
                        `}
                      >
                        {session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
