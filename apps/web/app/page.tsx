"use client";

import { useState } from "react";

import { ArrowUpRight, Activity, Zap, Mic } from "lucide-react";

import Overlay from "./overlay/Overlay";

import { useInterview } from "./features/interview/useInterview";

import { useInterviewStore } from "./features/interview/store";

import { useSessions } from "./features/interview/useSessions";

export default function Home() {
  const [isDetectable, setIsDetectable] = useState(true);

  const { handleStart } = useInterview();

  const isRecording = useInterviewStore((s) => s.isRecording);
  const error = useInterviewStore((s) => s.error);

  const { groupedSessions, isLoading } = useSessions();

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
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {!isRecording && (
        <>
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
                Low-latency mode for{" "}
                <strong
                  className="
                    text-white
                  "
                >
                  Ted
                </strong>
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
              max-w-[1000px]
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
              <div
                className="
                  flex
                  items-center
                  gap-5
                "
              >
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
                      bg-gradient-to-br
                      from-indigo-500
                      to-indigo-600
                      flex
                      items-center
                      justify-center
                      shadow-lg
                      shadow-indigo-500/30
                    "
                  >
                    <Zap
                      className="
                        text-white
                        w-5
                        h-5
                        fill-white/20
                      "
                    />
                  </div>

                  <h1
                    className="
                      text-3xl
                      font-bold
                      text-white
                      tracking-tight
                    "
                  >
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
                  <Activity
                    className="
                      w-4
                      h-4
                    "
                  />
                </button>

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    bg-white/5
                    px-4
                    py-2
                    rounded-xl
                    ml-2
                    border
                    border-white/10
                    shadow-sm
                  "
                >
                  <span
                    className="
                      text-sm
                      text-zinc-300
                      font-medium
                    "
                  >
                    Interview Mode
                  </span>

                  <button
                    onClick={() => setIsDetectable(!isDetectable)}
                    className={`
                      relative
                      inline-flex
                      h-5
                      w-9
                      items-center
                      rounded-full
                      transition-colors
                      focus:outline-none
                      ${isDetectable ? "bg-indigo-600" : "bg-neutral-800"}
                    `}
                  >
                    <span
                      className={`
                        inline-block
                        h-4
                        w-4
                        transform
                        rounded-full
                        bg-white
                        transition-transform
                        ${isDetectable ? "translate-x-4" : "translate-x-1"}
                        shadow-sm
                      `}
                    />
                  </button>
                </div>
              </div>

              <div
                className="
                  flex
                  flex-col
                  items-center
                "
              >
                <button
                  onClick={handleStart}
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
                      bg-gradient-to-r
                      from-indigo-400
                      to-indigo-600
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                    "
                  />

                  <Mic
                    className="
                      w-5
                      h-5
                      relative
                      z-10
                    "
                  />

                  <span
                    className="
                      relative
                      z-10
                    "
                  >
                    Start Ted
                  </span>
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
              <div
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-indigo-400
                  animate-pulse
                "
              />
              {error ?? "Ready for realtime microphone questions and instant text answers."}
            </div>

            <div
              className="
                bg-neutral-900/40
                backdrop-blur-xl
                border
                border-white/[0.06]
                rounded-2xl
                p-6
                shadow-2xl
                shadow-black/40
              "
            >
              <h2
                className="
                  text-lg
                  font-semibold
                  text-white
                  mb-6
                  flex
                  items-center
                  gap-2
                "
              >
                Recent Sessions
                <span
                  className="
                    px-2
                    py-0.5
                    rounded-md
                    bg-neutral-800
                    text-xs
                    font-medium
                    text-zinc-400
                    border
                    border-white/5
                  "
                >
                  Local DB
                </span>
              </h2>

              {isLoading ? (
                <div
                  className="
                      text-sm
                      text-zinc-400
                      text-center
                      py-8
                    "
                >
                  Loading sessions...
                </div>
              ) : groupedSessions.length === 0 ? (
                <div
                  className="
                      text-sm
                      text-zinc-400
                      text-center
                      py-8
                    "
                >
                  No sessions recorded yet.
                </div>
              ) : (
                groupedSessions.map((group, groupIdx) => (
                  <div
                    key={groupIdx}
                    className="
                          mb-8
                          last:mb-0
                        "
                  >
                    <h3
                      className="
                            text-xs
                            font-bold
                            text-zinc-500
                            uppercase
                            tracking-wider
                            mb-3
                          "
                    >
                      {group.date}
                    </h3>

                    <div
                      className="
                            flex
                            flex-col
                            gap-2
                          "
                    >
                      {group.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
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
                          <div
                            className="
                                      flex
                                      items-center
                                      gap-4
                                    "
                          >
                            <div
                              className={`
                                        w-2
                                        h-2
                                        rounded-full
                                        ${
                                          item.status === "running"
                                            ? "bg-green-500 animate-pulse"
                                            : "bg-indigo-500/30"
                                        }
                                      `}
                            />

                            <span
                              className="
                                        text-[15px]
                                        font-medium
                                        text-zinc-200
                                      "
                            >
                              {item.title}
                            </span>
                          </div>

                          <div
                            className="
                                      flex
                                      items-center
                                      gap-4
                                    "
                          >
                            <span
                              className="
                                        px-2.5
                                        py-1
                                        rounded-md
                                        bg-neutral-900
                                        text-xs
                                        font-mono
                                        text-zinc-400
                                        border
                                        border-white/5
                                      "
                            >
                              {item.duration}
                            </span>

                            <span
                              className="
                                        text-sm
                                        text-zinc-500
                                      "
                            >
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
