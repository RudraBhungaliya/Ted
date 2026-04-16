"use client";

import { useState } from "react";
import { ArrowUpRight, Activity, Zap, Mic } from "lucide-react";
import Overlay from "../overlay/Overlay";
import { useInterview } from "../features/interview/useInterview";
import { useInterviewStore } from "../features/interview/store";
import { useSessions } from "../features/interview/useSessions";

export default function Home() {
  const [isDetectable, setIsDetectable] = useState(true);
  const { handleStart } = useInterview();
  const isRecording = useInterviewStore((s) => s.isRecording);
  const { groupedSessions, isLoading } = useSessions();

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-indigo-500/20">
      {/* Only show dashboard when not recording to make it "undetectable" */}
      {!isRecording && (
        <>
          <div className="flex justify-center pt-8 pb-6">
            <a href="#" className="group flex items-center gap-2 rounded-full bg-white border border-indigo-100 text-indigo-700 px-4 py-1.5 text-sm font-medium hover:bg-indigo-50 transition-all shadow-sm">
              <span>What&apos;s new in <strong className="text-indigo-900">Reflex v0.1</strong></span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          <div className="max-w-[1000px] mx-auto px-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Zap className="text-white w-5 h-5 fill-white/20" />
                  </div>
                  <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Reflex</h1>
                </div>
                
                <button className="p-2.5 rounded-xl bg-white hover:bg-zinc-50 transition-colors text-zinc-400 border border-zinc-200 shadow-sm">
                  <Activity className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl ml-2 border border-zinc-200 shadow-sm">
                  <span className="text-sm text-zinc-600 font-medium">Interview Mode</span>
                  <button 
                    onClick={() => setIsDetectable(!isDetectable)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isDetectable ? 'bg-indigo-500' : 'bg-zinc-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDetectable ? 'translate-x-4' : 'translate-x-1'} shadow-sm`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <button 
                  onClick={handleStart}
                  className="relative group flex items-center gap-3 px-8 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-base overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Mic className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Start Reflex</span>
                </button>
              </div>
            </div>

            {/* Alert Banner */}
            <div className="mb-12 p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-sm flex items-center gap-3 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              Ready to begin. <a href="#" className="font-semibold hover:text-blue-600 transition-colors underline decoration-blue-300 underline-offset-4">Connect your calendar</a> to import upcoming interviews.
            </div>

            {/* History List */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl shadow-zinc-200/50">
              <h2 className="text-lg font-semibold text-zinc-800 mb-6 flex items-center gap-2">
                Recent Sessions
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-xs font-medium text-zinc-500 border border-zinc-200">Local DB</span>
              </h2>
              
              {isLoading ? (
                <div className="text-sm text-zinc-500 text-center py-8">Loading sessions...</div>
              ) : groupedSessions.length === 0 ? (
                <div className="text-sm text-zinc-500 text-center py-8">No sessions recorded yet. Start an interview!</div>
              ) : (
                groupedSessions.map((group, groupIdx) => (
                  <div key={groupIdx} className="mb-8 last:mb-0">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{group.date}</h3>
                    <div className="flex flex-col gap-2">
                      {group.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 rounded-xl transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${item.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-indigo-400/50 group-hover:bg-indigo-500'} transition-colors`}></div>
                            <span className="text-[15px] font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="px-2.5 py-1 rounded-md bg-white text-xs font-mono text-zinc-500 border border-zinc-200 shadow-sm">
                              {item.duration}
                            </span>
                            <span className="text-sm font-medium text-zinc-400 w-20 text-right">
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

      <Overlay />
    </main>
  );
}
