import {
    REALTIME_EVENTS,
} from "./event.js";

import {
    AudioEngine,
} from "./audio.js";

type TranscriptHandler = (
    text : string,
    isFinal : boolean,
) => void;

type AiTokenHandler = (

    token : string,

) => void;

export class RealtimeClient {
    private ws : 
        WebSocket | null = null;

    private audioEngine =
        new AudioEngine();

    private chunkId = 0;

    connect (
        sessionId : string,
        onTranscript : TranscriptHandler,
        onAiToken : AiTokenHandler,
    ){
        this.ws = new WebSocket(
            "ws://localhost:4000/realtime/"
        );

        this.ws.onopen = () => {
            console.log("Realtime connected");

            this.ws?.send(
                JSON.stringify({
                    event :
                        REALTIME_EVENTS.session.start,
                        payload : {
                            sessionId,
                        }
                })
            );
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if(message.event === REALTIME_EVENTS.transcript.partial){
                onTranscript(
                    message.payload.text,
                    false,
                );
            }

            if(message.event === REALTIME_EVENTS.transcript.final){
                onTranscript(message.payload.text, true);
            }

            if(

        message.event ===
        REALTIME_EVENTS
            .ai
            .token

    ){

        onAiToken(

            message
                .payload
                .token,

        );

    }
    
        };

        this.ws.onerror = (error) => {
            console.error("Websocket error:", error);
        };

        this.ws.onclose = () => {
            console.log("Websocket closed");
        };
    }

    async startStreaming(
        sessionId: string,
    ) {

        await this.audioEngine
            .start(
                (audio) => {

                    if (
                        !this.ws ||
                        this.ws.readyState !==
                        WebSocket.OPEN
                    ) {
                        return;
                    }

                    this.ws.send(
                        JSON.stringify({
                            event:
                                REALTIME_EVENTS
                                    .audio
                                    .chunk,

                            payload: {
                                sessionId,
                                chunkId:
                                    this.chunkId++,
                                audio,
                            },
                        })
                    );
                }
            );
    }


    stopStreaming() {
        this.audioEngine.stop();
    }

    disconnect() {
        this.stopStreaming();
        this.ws?.close();
    }
}