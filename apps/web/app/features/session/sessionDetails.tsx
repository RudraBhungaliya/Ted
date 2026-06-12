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

  const timeline = session.timeline ?? [
    ...(session.transcripts ?? []).map((t: any) => ({
      id: t.id,
      role:
        t.speakerType === "USER"
          ? "user"
          : t.speakerType === "PARTICIPANT"
            ? "interviewer"
            : "ai",
      speakerName:
        t.speakerName ||
        (t.speakerType === "USER"
          ? "You"
          : t.speakerType === "AI"
            ? "TED (AI)"
            : "Interviewer"),
      text: t.text,
      timestamp: new Date(t.createdAt).getTime(),
    })),
    ...(session.aiMessages ?? []).map((m: any) => ({
      id: m.id,
      role: "ai",
      speakerName: "TED (AI)",
      text: m.text,
      timestamp: new Date(m.createdAt).getTime(),
    })),
  ].sort((a: any, b: any) => a.timestamp - b.timestamp);

  const analytics = Array.isArray(session.analytics)
    ? session.analytics[0]
    : session.analytics;

  const summary = session.summary
    ? {
        score:
          session.summary.score ??
          analytics?.technicalScore ??
          analytics?.communicationScore ??
          0,
        strengths: session.summary.strengths ?? session.summary.keyPoints ?? [],
        weaknesses: session.summary.weaknesses ?? [],
      }
    : null;

  return (
    <div>
      <h2>Summary</h2>

      {summary && (
        <>
          <div>
            Score:
            {" "}
            {summary.score}
          </div>

          <div>
            Strengths:
            <ul>
              {summary.strengths?.map(
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
              {summary.weaknesses?.map(
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

      {timeline.map(
        (item: any) => (
          <div key={item.id}>
            <strong>
              {item.speakerName}
            </strong>
            : {item.text}
          </div>
        ),
      )}

      <h2>Analytics</h2>

      {analytics && (
          <div>
            Words:
            {" "}
            {analytics.totalWords}
            {" | "}
            Confidence:
            {" "}
            {
              analytics.confidenceScore
            }
          </div>
      )}
    </div>
  );
}
