import {
  useSessionDetails,
} from "./useSessions";

interface Props {
  sessionId: string;
}

export function SessionDetails({
  sessionId,
}: Props) {
  const {
    session,
    loading,
  } =
    useSessionDetails(
      sessionId,
    );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>No Session</div>;
  }

  return (
    <div>
      <h2>Summary</h2>

      {session.summary && (
        <>
          <div>
            Score:
            {" "}
            {session.summary.score}
          </div>

          <div>
            Strengths:
            <ul>
              {session.summary.strengths?.map(
                (
                  item: string,
                ) => (
                  <li key={item}>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            Weaknesses:
            <ul>
              {session.summary.weaknesses?.map(
                (
                  item: string,
                ) => (
                  <li key={item}>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </>
      )}

      <h2>Transcript</h2>

      {session.transcripts?.map(
        (t: any) => (
          <div key={t.id}>
            <strong>
              {t.speakerName ??
                t.source}
            </strong>

            : {t.text}
          </div>
        ),
      )}

      <h2>Analytics</h2>

      {session.analytics?.map(
        (a: any) => (
          <div key={a.id}>
            Words:
            {" "}
            {a.totalWords}
            {" | "}
            Confidence:
            {" "}
            {
              a.confidenceScore
            }
          </div>
        ),
      )}
    </div>
  );
}