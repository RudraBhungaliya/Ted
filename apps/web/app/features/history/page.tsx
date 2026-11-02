"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { SessionList } from "../session/sessionList";
import { SessionDetails } from "../session/sessionDetails";

export default function HistoryPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 antialiased selection:bg-amber-100 selection:text-amber-900 pb-20">
      {/* Top Header */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-stone-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="text-xs text-stone-600 hover:text-stone-900 font-medium px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
            >
              Archive Grid View
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-stone-600 text-xs font-medium mb-2.5">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            Historical Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900 tracking-tight">
            Session History & Insights
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
            Review past interviews and meeting logs, examine pace analytics, and view tailored feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Master List Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Sessions
              </span>
            </div>
            <SessionList
              selectedId={selectedSessionId}
              onSelect={setSelectedSessionId}
            />
          </div>

          {/* Detail Column */}
          <div className="lg:col-span-8">
            {selectedSessionId ? (
              <SessionDetails sessionId={selectedSessionId} />
            ) : (
              <div className="border border-stone-200/80 bg-white rounded-2xl p-16 text-center shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-3 text-stone-400">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-stone-800 mb-1">
                  Select a Session
                </h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Click any session on the left to examine real-time coaching metrics, transcripts, and speaker breakdowns.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
