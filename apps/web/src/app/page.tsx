
import Overlay from "../overlay/Overlay";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Reflex</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Real-time interview practice with mic capture and live transcript
          streaming.
        </p>
      </section>

      <Overlay />
    </main>
  );
}
