"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Users,
  CheckCircle2,
  Mic,
  Shield,
  ArrowRight,
  Info,
} from "lucide-react";
import { createSession } from "../../features/session/api";

export default function NewSessionPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"INTERVIEW" | "MEETING">("INTERVIEW");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setIsStarting(true);
    setError(null);
    try {
      const session = await createSession(mode);
      if (session && session.id) {
        router.push(`/session/${session.id}`);
      } else {
        throw new Error("Invalid session response");
      }
    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Unable to initialize session. Please verify your connection and try again.");
      setIsStarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 antialiased selection:bg-amber-100 selection:text-amber-900 pb-20">
      {/* Top Bar */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-stone-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <span className="text-xs text-stone-400 font-mono tracking-wide">
            Workspace · New Session
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 pt-12 sm:pt-16">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Live Audio & Transcription Companion
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900 tracking-tight mb-2">
            What are we preparing for today?
          </h1>
          <p className="text-sm text-stone-500 max-w-xl leading-relaxed">
            Choose a session mode to configure real-time speech assistance, conversational insights, and tailored recap metrics.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {/* Interview Mode Card */}
          <button
            type="button"
            onClick={() => setMode("INTERVIEW")}
            className={`group text-left p-6 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
              mode === "INTERVIEW"
                ? "bg-white border-amber-400 shadow-md ring-2 ring-amber-400/20"
                : "bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white shadow-xs"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    mode === "INTERVIEW"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-stone-100 text-stone-600 group-hover:bg-amber-50 group-hover:text-amber-700"
                  }`}
                >
                  <Briefcase className="w-6 h-6" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    mode === "INTERVIEW"
                      ? "border-amber-600 bg-amber-600 text-white"
                      : "border-stone-300 bg-white"
                  }`}
                >
                  {mode === "INTERVIEW" && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              <h2 className="text-base font-semibold text-stone-900 mb-1.5">
                Interview Prep & Coaching
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed mb-6">
                Tailored for mock interviews, behavioral reviews, and technical discussions. Provides STAR technique prompts, filler word detection, and live confidence cues.
              </p>
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>STAR methodology tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Pacing & filler word alerts</span>
              </div>
            </div>
          </button>

          {/* Meeting Mode Card */}
          <button
            type="button"
            onClick={() => setMode("MEETING")}
            className={`group text-left p-6 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
              mode === "MEETING"
                ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white/80 border-stone-200 hover:border-stone-300 hover:bg-white shadow-xs"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    mode === "MEETING"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-100 text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                  }`}
                >
                  <Users className="w-6 h-6" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    mode === "MEETING"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-stone-300 bg-white"
                  }`}
                >
                  {mode === "MEETING" && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              <h2 className="text-base font-semibold text-stone-900 mb-1.5">
                Meeting & Team Discussion
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed mb-6">
                Ideal for 1-on-1s, syncs, client calls, and sprint planning. Automatically aggregates decisions, captures action items, and generates structured executive minutes.
              </p>
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Automatic action items extraction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Multi-speaker speech attribution</span>
              </div>
            </div>
          </button>
        </div>

        {/* Readiness Checklist / Device Notes */}
        <div className="p-5 rounded-2xl bg-stone-100/70 border border-stone-200/80 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-800">
                Microphone & Audio Access
              </p>
              <p className="text-[11px] text-stone-500">
                Audio is processed securely with on-device silence filtering before analysis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 bg-white px-3 py-1.5 rounded-lg border border-stone-200/70 shrink-0 self-start sm:self-auto">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Private & Encrypted
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200/70">
          <span className="text-xs text-stone-400">
            You can pause, mute, or end the session at any time.
          </span>
          <button
            type="button"
            disabled={isStarting}
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-stone-900 text-stone-50 hover:bg-stone-800 active:scale-[0.99] font-medium text-sm transition-all duration-150 shadow-md shadow-stone-900/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-stone-400 border-t-white animate-spin" />
                <span>Initializing Session...</span>
              </>
            ) : (
              <>
                <span>Start {mode === "INTERVIEW" ? "Interview" : "Meeting"} Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
