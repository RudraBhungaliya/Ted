"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Activity, Zap, Mic } from "lucide-react";
import Overlay from "./overlay/Overlay";
import { useInterview } from "./features/interview/useInterview";
import { useInterviewStore } from "./features/interview/store";
import { useSessions } from "./features/interview/useSessions";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showModeModal, setShowModeModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(typeof window !== "undefined" && "desktopControls" in window);
  }, []);

  useEffect(() => {
    const desktopControls = (window as any).desktopControls;
    if (desktopControls?.onSessionEnded) {
      const unsubscribe = desktopControls.onSessionEnded(() => {
        // Dispatch session-stopped event so useSessions automatically refreshes
        window.dispatchEvent(new Event("session-stopped"));
      });
      return unsubscribe;
    }
  }, []);

  useEffect(() => {
    // Auth checks bypassed on frontend for development testing
    setUser({ fullName: "Test User", email: "test@example.com" });
    setAuthLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
        "http://localhost:4000";
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  };

  const { handleStart, handleSetMode } = useInterview();
  const isRecording = useInterviewStore((s) => s.isRecording);
  const error = useInterviewStore((s) => s.error);
  const { groupedSessions, isLoading } = useSessions();

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#090D1A] text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-medium">
            Securing session connection...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#090D1A]
        text-zinc-100
        font-sans
        selection:bg-indigo-500/20
        relative
        overflow-hidden
      "
    >
      {/* Decorative premium background grid/glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1.2px,transparent_1.2px)] bg-size-[24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-125 h-125 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {!isRecording && (
        <>
          {/* Premium Navbar */}
          <nav className="relative z-20 border-b border-white/6 bg-neutral-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Zap className="text-white w-4 h-4 fill-white/10" />
              </div>
              <span className="font-bold text-lg text-white">
                Ted Intelligence
              </span>
            </div>
            <div className="flex items-center gap-6 font-medium">
              <a
                href="/"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Interview
              </a>
              <a
                href="/history"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                History
              </a>
              <a
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="text-sm text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </nav>

          <div
            className="
              flex
              justify-center
              pt-8
              pb-6
              relative
              z-10
            "
          >
            <a
              href="#"
              className="
                group
                flex
                items-center
                gap-2
                rounded-full
                bg-white/5
                border
                border-white/10
                text-indigo-400
                px-4
                py-1.5
                text-sm
                font-medium
                hover:bg-white/10
                transition-all
                shadow-sm
              "
            >
              <span>
                Low-latency mode for <strong className="text-white">Ted</strong>
              </span>

              <ArrowUpRight
                className="
                  w-4
                  h-4
                  group-hover:translate-x-0.5
                  group-hover:-translate-y-0.5
                  transition-transform
                "
              />
            </a>
          </div>

          <div
            className="
              max-w-2xl
              mx-auto
              px-6
              relative
              z-10
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                mb-10
              "
            >
              <div className="flex items-center gap-5">
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-linear-to-br
                      from-indigo-500
                      to-indigo-600
                      flex
                      items-center
                      justify-center
                      shadow-lg
                      shadow-indigo-500/30
                    "
                  >
                    <Zap className="text-white w-5 h-5 fill-white/20" />
                  </div>

                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Ted
                  </h1>
                </div>

                <button
                  className="
                    p-2.5
                    rounded-xl
                    bg-white/5
                    hover:bg-white/10
                    transition-colors
                    text-zinc-400
                    border
                    border-white/10
                    shadow-sm
                  "
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>

              <div>
                <button
                  onClick={() => {
                    if (isDesktop && (window as any).desktopControls?.showOverlay) {
                      (window as any).desktopControls.showOverlay();
                    } else {
                      setShowModeModal(true);
                    }
                  }}
                  className="
                    relative
                    group
                    flex
                    items-center
                    gap-3
                    px-8
                    py-3.5
                    rounded-xl
                    bg-indigo-600
                    text-white
                    font-bold
                    text-base
                    overflow-hidden
                    transition-all
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    shadow-lg
                    shadow-indigo-500/25
                    hover:shadow-indigo-500/45
                    cursor-pointer
                  "
                >
                  <div
                    className="
                      absolute
                      inset-0
                      bg-linear-to-r
                      from-indigo-400
                      to-indigo-600
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                    "
                  />

                  <Mic className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Start Ted</span>
                </button>
              </div>
            </div>

            <div
              className="
                mb-12
                p-4
                rounded-xl
                border
                border-indigo-500/20
                bg-indigo-500/5
                text-indigo-300
                text-sm
                flex
                items-center
                gap-3
                shadow-sm
              "
            >
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              {error ??
                "Ready for realtime microphone questions and instant text answers."}
            </div>

            <div
              className="
                bg-neutral-900/40
                backdrop-blur-xl
                border
                border-white/6
                rounded-2xl
                p-6
                shadow-2xl
                shadow-black/40
              "
            >
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                Recent Sessions
                <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-xs font-medium text-zinc-400 border border-white/5">
                  Local DB
                </span>
              </h2>

              {isLoading ? (
                <div className="text-sm text-zinc-400 text-center py-8 italic">
                  Loading sessions...
                </div>
              ) : groupedSessions.length === 0 ? (
                <div className="text-sm text-zinc-400 text-center py-8 italic">
                  No sessions recorded yet.
                </div>
              ) : (
                groupedSessions.map((group, groupIdx) => (
                  <div key={groupIdx} className="mb-8 last:mb-0">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                      {group.date}
                    </h3>

                    <div className="flex flex-col gap-2">
                      {group.items.map((item, itemIdx) => (
                        <div
                          key={item.id || itemIdx}
                          onClick={() => router.push(`/session/${item.id}`)}
                          className="
                            flex
                            items-center
                            justify-between
                            p-4
                            bg-neutral-950/45
                            hover:bg-neutral-800/40
                            border
                            border-white/5
                            rounded-xl
                            transition-all
                            cursor-pointer
                          "
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`
                                w-2
                                h-2
                                rounded-full
                                ${
                                  item.status === "ACTIVE" ||
                                  item.status === "running"
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-indigo-500/30"
                                }
                              `}
                            />
                            <span className="text-[15px] font-medium text-zinc-200">
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="px-2 py-0.5 text-[9px] font-mono tracking-wide rounded border uppercase border-white/5 bg-neutral-900 text-zinc-400">
                              {item.mode}
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-neutral-900 text-xs font-mono text-zinc-400 border border-white/5">
                              {item.duration}
                            </span>
                            <span className="text-sm text-zinc-500 font-medium">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {showModeModal && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
          <div className="w-[450px] bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              Select Session Type
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Choose how Ted should assist you.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  handleSetMode("interview");
                  setShowModeModal(false);
                  handleStart();
                }}
                className="w-full p-4 rounded-xl border border-indigo-500 hover:bg-indigo-500/10 text-left cursor-pointer"
              >
                <div className="font-semibold text-white">Interview Mode</div>
                <div className="text-sm text-zinc-400 mt-1">
                  Listen only to interviewer questions and generate answers.
                </div>
              </button>

              <button
                onClick={() => {
                  handleSetMode("meeting");
                  setShowModeModal(false);
                  handleStart();
                }}
                className="w-full p-4 rounded-xl border border-zinc-700 hover:bg-white/5 text-left cursor-pointer"
              >
                <div className="font-semibold text-white">Meeting Mode</div>
                <div className="text-sm text-zinc-400 mt-1">
                  Meeting copilot with notes and summaries.
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowModeModal(false)}
              className="mt-4 w-full py-3 rounded-xl bg-neutral-800 text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isDesktop && <Overlay />}
    </main>
  );
}
