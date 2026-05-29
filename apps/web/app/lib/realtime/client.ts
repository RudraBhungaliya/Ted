import { REALTIME_CONFIG } from "../constants";
import { AudioEngine } from "./audio";
import { REALTIME_EVENTS, type RealtimeInboundMessage } from "./event";
import { useInterviewStore } from "../../features/interview/store";

type TranscriptHandler = (text: string, isFinal: boolean) => void;
type AiTokenHandler = (token: string) => void;
type StatusHandler = (message: string) => void;
type ErrorHandler = (message: string) => void;

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private audioEngine = new AudioEngine();
  private sessionId: string | null = null;
  private streaming = false;

  async connect(
    sessionId: string,
    onTranscript: TranscriptHandler,
    onAiToken: AiTokenHandler,
    onAiStart: () => void,
    onAiEnd: () => void,
    onStatus?: StatusHandler,
    onError?: ErrorHandler,
  ): Promise<void> {
    this.disconnect();
    this.sessionId = sessionId;

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(REALTIME_CONFIG.WS_URL);
      this.socket = socket;
      socket.binaryType = "arraybuffer";

      const connectionTimeout = window.setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          reject(new Error("Realtime WebSocket connection timed out."));
          socket.close();
        }
      }, 8000);

      socket.onopen = () => {
        const mode = useInterviewStore.getState().sessionMode;
        socket.send(
          JSON.stringify({
            event: REALTIME_EVENTS.session.start,
            payload: { sessionId, mode },
          }),
        );
      };

      socket.onmessage = (message) => {
        if (message.data instanceof ArrayBuffer) {
          return;
        }

        const inbound = JSON.parse(message.data as string) as RealtimeInboundMessage;

        switch (inbound.event) {
          case REALTIME_EVENTS.connection.connected:
            window.clearTimeout(connectionTimeout);
            onStatus?.("Listening");
            resolve();
            break;
          case REALTIME_EVENTS.connection.error:
            window.clearTimeout(connectionTimeout);
            onError?.(inbound.payload?.message ?? "Realtime connection failed.");
            reject(
              new Error(inbound.payload?.message ?? "Realtime connection failed."),
            );
            break;
          case REALTIME_EVENTS.transcript.partial:
            onTranscript(inbound.payload?.text ?? "", false);
            break;
          case REALTIME_EVENTS.transcript.final:
            onTranscript(inbound.payload?.text ?? "", true);
            onStatus?.("Thinking");
            break;
          case REALTIME_EVENTS.ai.start:
            onAiStart();
            onStatus?.("Answering");
            break;
          case REALTIME_EVENTS.ai.token:
            onAiToken(inbound.payload?.token ?? "");
            break;
          case REALTIME_EVENTS.ai.end:
            onAiEnd();
            onStatus?.("Listening");
            break;
          case REALTIME_EVENTS.ai.error:
            onAiEnd();
            onStatus?.("Error");
            onError?.(inbound.payload?.message ?? "AI response failed.");
            break;
          case REALTIME_EVENTS.ai.interrupt:
            onAiEnd();
            onStatus?.("Listening");
            break;
        }
      };

      socket.onerror = () => {
        window.clearTimeout(connectionTimeout);
        reject(new Error("Realtime WebSocket failed."));
      };

      socket.onclose = () => {
        onStatus?.("Disconnected");
        onAiEnd();

        if (this.sessionId && this.streaming) {
          console.warn("WebSocket closed unexpectedly. Triggering reconnect...");
          this.reconnect(
            onTranscript,
            onAiToken,
            onAiStart,
            onAiEnd,
            onStatus,
            onError
          );
        }
      };
    });
  }

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private reconnect(
    onTranscript: TranscriptHandler,
    onAiToken: AiTokenHandler,
    onAiStart: () => void,
    onAiEnd: () => void,
    onStatus?: StatusHandler,
    onError?: ErrorHandler,
  ) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached. Stopping session.");
      onStatus?.("Error");
      onError?.("Connection lost. Please refresh or restart interview.");
      this.disconnect();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    onStatus?.("Reconnecting");

    setTimeout(async () => {
      try {
        if (!this.sessionId) return;
        await this.connect(
          this.sessionId,
          onTranscript,
          onAiToken,
          onAiStart,
          onAiEnd,
          onStatus,
          onError
        );
        this.reconnectAttempts = 0;
        await this.startStreaming();
        console.log("Successfully reconnected and resumed streaming!");
      } catch (err) {
        console.error("Reconnection attempt failed:", err);
        this.reconnect(onTranscript, onAiToken, onAiStart, onAiEnd, onStatus, onError);
      }
    }, delay);
  }

  async startStreaming(): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Realtime socket is not connected.");
    }

    if (this.streaming) {
      return;
    }

    this.streaming = true;

    await this.audioEngine.start((chunk) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      this.socket.send(chunk.buffer);
    });
  }

  stopStreaming(): void {
    if (!this.streaming) {
      return;
    }

    this.streaming = false;
    this.audioEngine.stop();
  }

  disconnect(): void {
    this.stopStreaming();

    if (this.socket && this.sessionId) {
      try {
        this.socket.send(
          JSON.stringify({
            event: REALTIME_EVENTS.session.end,
            payload: { sessionId: this.sessionId },
          }),
        );
      } catch {
        // Socket may already be closed.
      }
    }

    this.socket?.close();
    this.socket = null;
    this.sessionId = null;
  }

  updateMode(mode: "interview" | "meeting"): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.sessionId) {
      try {
        this.socket.send(
          JSON.stringify({
            event: REALTIME_EVENTS.session.updateMode,
            payload: {
              sessionId: this.sessionId,
              mode,
            },
          })
        );
        console.log("WebSocket sent mode update:", mode);
      } catch (err) {
        console.error("Failed to send mode update", err);
      }
    }
  }
}
