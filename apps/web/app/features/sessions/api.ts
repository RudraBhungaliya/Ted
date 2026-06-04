const API_URL = process.env.VITE_API_URL;

  export async function getSessions() {
  const response = await fetch(`${API_URL}/api/session/user/all`, {
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
    `${API_URL}/api/session/${sessionId}`,
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

export async function createSession(mode : "INTERVIEW" | "MEETING"){
  const response = await fetch(`${API_URL}/api/session/create`, {
    method : "POST",
    credentials : "include",
    headers : {
      "Content-Type" : "application/json",
    },
    body : JSON.stringify({
      mode,
    }),
  });

  if(!response.ok){
    throw new Error("Failed to create session");
  }

  const data = await response.json();
  return data.session;
}

export async function endSession(sessionId : string){
  const response = await fetch(`${API_URL}/api/session/end/${sessionId}`, {
    method : "POST",
    credentials : "include",
  });

  if(!response.ok){
    throw new Error("Failed to end session");
  }
  return response.json();
}
