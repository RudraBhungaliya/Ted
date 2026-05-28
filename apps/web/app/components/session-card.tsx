type Props = {
  session: {
    id: string;
    startedAt: string;
    endedAt: string | null;
  };
};

export function SessionCard({ session }: Props) {
  return (
    <a
      href={`/history/${session.id}`}
      className="
        block
        border
        border-white/10
        rounded-2xl
        p-5
        hover:border-violet-500
        transition
      "
    >
      <div className="text-sm opacity-60">Session ID</div>

      <div className="font-mono text-sm break-all mt-1">{session.id}</div>

      <div className="mt-4 text-sm">
        Started: {new Date(session.startedAt).toLocaleString()}
      </div>

      <div className="text-sm mt-1">
        Ended:{" "}
        {session.endedAt
          ? new Date(session.endedAt).toLocaleString()
          : "Active"}
      </div>
    </a>
  );
}
