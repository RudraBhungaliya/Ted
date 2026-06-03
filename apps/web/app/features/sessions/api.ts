const API_URL = process.env.VITE_API_URL;

  export async function getSessions() {
  const response = await fetch(`${API_URL}/api/sessions`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sessions");
  }

  const data = await response.json();
  return data.sessions;
}

export async function getSessionDetails(sessionId: string) {
  const response = await fetch(
    `${API_URL}/api/sessions/${sessionId}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch session");
  }

  const data = await response.json();

  return data.session;
}
