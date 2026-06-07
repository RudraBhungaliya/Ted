const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/session/`;

export async function getAllSessions() {
  const response = await fetch(`${API_BASE}user/all`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions from server engine infrastructure.`);
  }

  return response.json();
}

export async function getSession(sessionId: string) {
  const response = await fetch(`${API_BASE}${sessionId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch session with id ${sessionId}`);
  }

  const data = await response.json();
  return data.session ?? data;
}