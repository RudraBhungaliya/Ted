import { REALTIME_CONFIG } from "../constants";
import { AudioEngine } from "./audio";
import { REALTIME_EVENTS, type RealtimeInboundMessage } from "./event";

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
        socket.send(
          JSON.stringify({
            event: REALTIME_EVENTS.session.start,
            payload: { sessionId },
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
      };
    });
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
}
