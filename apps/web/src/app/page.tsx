"use client";

import { useState } from "react";
import { ArrowUpRight, Activity, Zap, Mic } from "lucide-react";
import Overlay from "../overlay/Overlay";
import { useInterview } from "../features/interview/useInterview";
import { useInterviewStore } from "../features/interview/store";

export default function Home() {
  const [isDetectable, setIsDetectable] = useState(true);
  const { handleStart } = useInterview();
  const isRecording = useInterviewStore((s) => s.isRecording);

  const mockSessions = [
    {
      date: "Today",
      items: [
        { title: "Frontend Architecture Discussion", duration: "12:05", time: "2:30 PM", status: "completed" },
        { title: "System Design Mock Interview", duration: "45:20", time: "10:15 AM", status: "completed" },
      ],
    },
    {
      date: "Yesterday",
      items: [
        { title: "Behavioral Interview Prep", duration: "25:10", time: "4:00 PM", status: "completed" },
        { title: "Algorithm Whiteboarding", duration: "30:45", time: "1:00 PM", status: "completed" },
        { title: "Initial Screen Setup", duration: "05:12", time: "9:00 AM", status: "completed" },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-purple-500/30">
      {/* Only show dashboard when not recording to make it "undetectable" */}
      {!isRecording && (
        <>
          <div className="flex justify-center pt-8 pb-6">
            <a href="#" className="group flex items-center gap-2 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-300 px-4 py-1.5 text-sm font-medium hover:bg-purple-900/40 transition-all backdrop-blur-sm">
              <span>What&apos;s new in <strong className="text-purple-200">Reflex v0.1</strong></span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          <div className="max-w-[1000px] mx-auto px-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Zap className="text-white w-5 h-5 fill-white/20" />
                  </div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">Reflex</h1>
                </div>
                
                <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 border border-white/5">
                  <Activity className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl ml-2 border border-white/5">
                  <span className="text-sm text-zinc-300 font-medium">Interview Mode</span>
                  <button 
                    onClick={() => setIsDetectable(!isDetectable)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isDetectable ? 'bg-purple-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDetectable ? 'translate-x-4' : 'translate-x-1'} shadow-sm`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <button 
                  onClick={handleStart}
                  className="relative group flex items-center gap-3 px-8 py-3.5 rounded-xl bg-white text-black font-bold text-base overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(168,85,247,0.4)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <Mic className="w-5 h-5" />
                  <span>Start Reflex</span>
                </button>
              </div>
            </div>

            {/* Alert Banner */}
            <div className="mb-12 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-200 text-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              Ready to begin. <a href="#" className="font-semibold hover:text-indigo-100 transition-colors underline decoration-indigo-500/30 underline-offset-4">Connect your calendar</a> to import upcoming interviews.
            </div>

            {/* History List */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                Recent Sessions
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-medium text-zinc-400">Mock Data</span>
              </h2>
              
              {mockSessions.map((group, groupIdx) => (
                <div key={groupIdx} className="mb-8 last:mb-0">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">{group.date}</h3>
                  <div className="flex flex-col gap-2">
                    {group.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors"></div>
                          <span className="text-[15px] font-medium text-zinc-300 group-hover:text-white transition-colors">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-2.5 py-1 rounded-md bg-black/40 text-xs font-mono text-zinc-400 border border-white/5">
                            {item.duration}
                          </span>
                          <span className="text-sm font-medium text-zinc-500 w-20 text-right">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Overlay />
    </main>
  );
}
