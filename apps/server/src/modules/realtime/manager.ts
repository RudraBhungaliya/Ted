import { WebSocket } from "ws";
import { SessionState } from "./types.js";

class RealtimeManager {
    private sessions = 
        new Map<
        string, SessionState
    >(); 

    private sockets = 
        new Map<
        string, WebSocket
    >();

    createSession(
        sessionId : string,
    ){
        this.sessions.set(
            sessionId,
            {
                sessionId,
                transcript : [],
                aiResponse : [],
                connected : true,
            }
        )
    }

    removeSession(
        sessionId : string
    ){
        this.sessions.delete(sessionId);
        this.sockets.delete(sessionId);
    }

    getSession(
        sessionId : string,
    ){
        return this.sessions.get(sessionId);
    }

    attachSocket(
        sessionId : string,
        socket : WebSocket,
    ){
        this.sockets.set(sessionId, socket);
    }

    getSocket(
        sessionId : string,
    ){
        return this.sockets.get(sessionId);
    }

    appendTranscript(
        sessionId : string,
        text : string,
    ){
        const session = this.sessions.get(sessionId);
        if(!session) return;

        session.transcript.push(text);
    }

    appendAiResponse(
        sessionId : string,
        token : string,
    ){
        const session = this.sessions.get(sessionId);
        if(!session) return;

        session.aiResponse.push(token);
    }

    getFullTranscript(
        sessionId : string,
    ){
        const session = this.sessions.get(sessionId);

        if(!session) return "";

        return session.transcript.join(" ");
    }

    getFullAiResponse(
        sessionId : string,
    ){
        const session = this.sessions.get(sessionId);

        if(!session) return "";

        return session.aiResponse.join(" ");
    }
}

export const realtimeManager = new RealtimeManager();