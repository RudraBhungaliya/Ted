import { useSessions } from "./useSessions";

interface Props {
  onSelect: (sessionId: string) => void;
}

export function SessionList({ onSelect }: Props) {
  const { sessions, loading } = useSessions();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {sessions.map((session) => (
        <button key={session.id} onClick={() => onSelect(session.id)}>
          <div>{session.mode}</div>

          <div>{session.status}</div>

          <div>{new Date(session.startedAt).toLocaleString()}</div>
        </button>
      ))}
    </div>
  );
}
