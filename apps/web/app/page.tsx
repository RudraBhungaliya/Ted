"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, ArrowRight, Briefcase, Coffee, Calendar, Clock, Monitor } from "lucide-react";
import Overlay from "./overlay/Overlay";
import Navbar from "./components/common/Navbar";
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
        window.dispatchEvent(new Event("session-stopped"));
      });
      return unsubscribe;
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
          "http://localhost:4000";
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Unauthorized");
        }
        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          setUser(resJson.data);
        } else {
          throw new Error("Unauthorized");
        }
      } catch (err) {
        window.location.href = "/login";
      } finally {
        setAuthLoading(false);
      }
    }
    void checkAuth();
  }, []);

  const { handleStart, handleSetMode } = useInterview();
  const isRecording = useInterviewStore((s) => s.isRecording);
  const error = useInterviewStore((s) => s.error);
  const { groupedSessions, isLoading } = useSessions();

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-stone-900 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm font-medium">
            Loading your workspace...
          </p>
        </div>
      </main>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-amber-200">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Workspace Welcome & Action Bar */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Audio & Screen Ready
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-stone-900">
                Good day, {firstName}
              </h1>
              <p className="text-stone-500 text-sm mt-1 max-w-md leading-relaxed">
                Start a live session for interview practice or meeting notes. Ted runs cleanly alongside your workflow.
              </p>
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.99] cursor-pointer whitespace-nowrap w-full sm:w-auto"
              >
                <Mic className="w-4 h-4 text-amber-400" />
                <span>Start New Session</span>
              </button>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-stone-100">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/60">
              <div className="p-2.5 rounded-xl bg-orange-100/80 text-orange-800">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-stone-800">
                  Assistant Mode
                </h3>
                <p className="text-[12px] text-stone-500 mt-0.5 leading-relaxed">
                  Real-time suggestions and natural speaking points tailored for technical interviews.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/60">
              <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-800">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-stone-800">
                  Meeting Mode
                </h3>
                <p className="text-[12px] text-stone-500 mt-0.5 leading-relaxed">
                  Accurate full-meeting transcription with automatic key takeaways and action items.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {error}
          </div>
        )}

        {/* Desktop Helper Notice */}
        {isDesktop && (
          <div className="mb-8 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-4 h-4 text-blue-600" />
              <span>Desktop overlay is connected. Click-through and screen assist are enabled.</span>
            </div>
            <button
              onClick={() => (window as any).desktopControls?.showOverlay?.()}
              className="font-semibold underline hover:text-blue-950 cursor-pointer"
            >
              Open Overlay
            </button>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                Recent Sessions
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Review and replay past conversations.
              </p>
            </div>

            <button
              onClick={() => router.push("/history")}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 group cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-stone-400 text-sm">
              Loading sessions...
            </div>
          ) : groupedSessions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-stone-500" />
              </div>
              <p className="text-sm font-medium text-stone-700">No sessions recorded yet</p>
              <p className="text-xs text-stone-400 mt-1">
                Start a session to save your first transcript.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedSessions.slice(0, 3).map((group, groupIdx) => (
                <div key={groupIdx}>
                  <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block mb-3">
                    {group.date}
                  </span>

                  <div className="space-y-2.5">
                    {group.items.map((item) => {
                      const isMeeting = item.mode === "MEETING";
                      const isCompleted = item.status === "COMPLETED";

                      return (
                        <div
                          key={item.id}
                          onClick={() => router.push(`/session/${item.id}`)}
                          className="flex items-center justify-between p-4 rounded-2xl border border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/70 transition-all cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isCompleted ? "bg-stone-400" : "bg-emerald-500 animate-pulse"
                              }`}
                            />
                            <div>
                              <div className="font-semibold text-sm text-stone-900 group-hover:text-stone-950">
                                {item.title || (isMeeting ? "Meeting Session" : "Assistant Session")}
                              </div>
                              <span className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-stone-400" />
                                {item.time}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isMeeting
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-orange-50 text-orange-800 border-orange-200"
                              }`}
                            >
                              {item.mode}
                            </span>
                            <span className="text-xs font-mono text-stone-600 px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200">
                              {item.duration || "0:00"}
                            </span>
                            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-transform" />
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
      </div>

      {/* Mode Selection Modal */}
      {showModeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-bold text-stone-900 mb-1">
              Choose Session Mode
            </h2>
            <p className="text-stone-500 text-xs mb-6 leading-relaxed">
              Select the mode best suited for your conversation today.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  handleSetMode("interview");
                  setShowModeModal(false);
                  handleStart();
                }}
                className="w-full p-4 rounded-2xl border border-stone-200 hover:border-orange-300 hover:bg-orange-50/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-800">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-sm text-stone-900">
                    Assistant Mode
                  </div>
                </div>
                <div className="text-xs text-stone-500 pl-11 leading-relaxed">
                  Real-time suggestions and structure for technical interviews and problem solving.
                </div>
              </button>

              <button
                onClick={() => {
                  handleSetMode("meeting");
                  setShowModeModal(false);
                  handleStart();
                }}
                className="w-full p-4 rounded-2xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-sm text-stone-900">
                    Meeting Mode
                  </div>
                </div>
                <div className="text-xs text-stone-500 pl-11 leading-relaxed">
                  Clean verbatim transcription with automatic meeting summaries and action items.
                </div>
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModeModal(false)}
                className="w-full py-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!isDesktop && <Overlay />}
    </main>
  );
}
