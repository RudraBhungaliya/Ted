import { WebSocket } from "ws";
import { SessionState } from "./types.js";
import type { ConversationTurn } from "../ai/types.js";

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
                turns : [],
                currentAiTokens : [],
                pendingUserText: "",
                aiStreaming: false,
                connected : true,
            }
        )
    }

    appendFinalSegment(
        sessionId: string,
        text: string,
    ) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.pendingUserText = session.pendingUserText
            ? `${session.pendingUserText} ${text}`.trim()
            : text.trim();
    }

    commitUserTurn(
        sessionId: string,
    ): string {
        const session = this.sessions.get(sessionId);
        if (!session || !session.pendingUserText.trim()) {
            return "";
        }

        const text = session.pendingUserText.trim();
        session.turns.push({
            role: "user",
            text,
            timestamp: Date.now(),
        });
        session.pendingUserText = "";
        return text;
    }

    getLatestUserTurn(
        sessionId: string,
    ): string {
        const session = this.sessions.get(sessionId);
        if (!session) return "";

        if (session.pendingUserText.trim()) {
            return session.pendingUserText;
        }

        const userTurns = session.turns.filter((turn) => turn.role === "user");
        return userTurns[userTurns.length - 1]?.text ?? "";
    }

    setAiStreaming(
        sessionId: string,
        streaming: boolean,
    ) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        session.aiStreaming = streaming;
    }

    isAiStreaming(
        sessionId: string,
    ): boolean {
        return this.sessions.get(sessionId)?.aiStreaming ?? false;
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

    appendUserTurn(
        sessionId : string,
        text : string,
    ){
        const session = this.sessions.get(sessionId);
        if(!session) return;

        session.turns.push({
            role: "user",
            text: text.trim(),
            timestamp: Date.now()
        });
    }

    appendAiToken(
        sessionId : string,
        token : string,
    ){
        const session = this.sessions.get(sessionId);
        if(!session) return;

        session.currentAiTokens.push(token);
    }

    finalizeAiTurn(
        sessionId : string,
    ): string {
        const session = this.sessions.get(sessionId);
        if(!session) return "";

        const fullResponse = session.currentAiTokens.join("");
        if (fullResponse.trim()) {
            session.turns.push({
                role: "assistant",
                text: fullResponse.trim(),
                timestamp: Date.now()
            });
        }
        session.currentAiTokens = [];
        return fullResponse;
    }

    getTurns(
        sessionId : string,
    ): ConversationTurn[] {
        const session = this.sessions.get(sessionId);
        return session ? session.turns : [];
    }

    getFullTranscript(
        sessionId : string,
    ){
        const session = this.sessions.get(sessionId);

        if(!session) return "";

        return session.turns
            .filter(t => t.role === "user")
            .map(t => t.text)
            .join(" ");
    }

    getFullAiResponse(
        sessionId : string,
    ){
        const session = this.sessions.get(sessionId);

        if(!session) return "";

        return session.turns
            .filter(t => t.role === "assistant")
            .map(t => t.text)
            .join(" ");
    }
}

export const realtimeManager = new RealtimeManager();