"use client";

import { useState } from "react";

import { SessionList } from "../sessions/SessionList";
import { SessionDetails } from "../sessions/SessionDetails";

export default function HistoryPage() {
  const [
    selectedSessionId,
    setSelectedSessionId,
  ] = useState<string | null>(
    null,
  );

  return (
    <main className="min-h-screen bg-[#090D1A] text-white">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">
          Session History
        </h1>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <SessionList
              onSelect={
                setSelectedSessionId
              }
            />
          </div>

          <div className="col-span-8">
            {selectedSessionId ? (
              <SessionDetails
                sessionId={
                  selectedSessionId
                }
              />
            ) : (
              <div className="border border-white/10 rounded-xl p-8">
                Select a session
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}