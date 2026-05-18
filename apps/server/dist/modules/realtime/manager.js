class RealtimeManager {
    sessions = new Map();
    sockets = new Map();
    createSession(sessionId) {
        this.sessions.set(sessionId, {
            sessionId,
            transcript: [],
            aiResponse: [],
            connected: true,
        });
    }
    removeSession(sessionId) {
        this.sessions.delete(sessionId);
        this.sockets.delete(sessionId);
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    attachSocket(sessionId, socket) {
        this.sockets.set(sessionId, socket);
    }
    getSocket(sessionId) {
        return this.sockets.get(sessionId);
    }
    appendTranscript(sessionId, text) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.transcript.push(text);
    }
    appendAiResponse(sessionId, token) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.aiResponse.push(token);
    }
    getFullTranscript(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return "";
        return session.transcript.join(" ");
    }
    getFullAiResponse(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return "";
        return session.aiResponse.join(" ");
    }
}
export const realtimeManager = new RealtimeManager();
