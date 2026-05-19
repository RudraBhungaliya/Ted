export class AudioEngine {

    private audioContext:
        AudioContext | null = null;

    private processor:
        ScriptProcessorNode | null = null;

    private source:
        MediaStreamAudioSourceNode | null = null;

    private mediaStream:
        MediaStream | null = null;


    async start(
        onChunk: (
            audio: string
        ) => void,
    ) {

        this.mediaStream =
            await navigator
                .mediaDevices
                .getUserMedia({
                    audio: true,
                });

        this.audioContext =
            new AudioContext({
                sampleRate: 16000,
            });

        this.source =
            this.audioContext
                .createMediaStreamSource(
                    this.mediaStream
                );

        this.processor =
            this.audioContext
                .createScriptProcessor(
                    4096,
                    1,
                    1
                );

        this.processor
            .onaudioprocess =
            (
                event:
                AudioProcessingEvent
            ) => {

                const input =
                    event
                        .inputBuffer
                        .getChannelData(
                            0
                        );

                const pcm =
                    this.float32ToPCM16(
                        input
                    );

                const base64 =
                    this.arrayBufferToBase64(
                        pcm
                    );

                onChunk(
                    base64
                );

            };

        this.source.connect(
            this.processor
        );

        this.processor.connect(
            this.audioContext.destination
        );

    }


    stop() {

        this.processor?.disconnect();

        this.source?.disconnect();

        this.mediaStream
            ?.getTracks()
            .forEach(
                (track) => {
                    track.stop();
                }
            );

        this.audioContext?.close();

    }


    private float32ToPCM16(
        input: Float32Array,
    ): ArrayBuffer {

        const buffer =
            new ArrayBuffer(
                input.length * 2
            );

        const view =
            new DataView(
                buffer
            );

        let offset = 0;

        for (
            let i = 0;
            i < input.length;
            i++
        ) {

            let sample =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        input[i]
                    )
                );

            view.setInt16(
                offset,

                sample < 0
                    ? sample * 0x8000
                    : sample * 0x7fff,

                true
            );

            offset += 2;

        }

        return buffer;

    }


    private arrayBufferToBase64(
        buffer: ArrayBuffer,
    ): string {

        let binary = "";

        const bytes =
            new Uint8Array(
                buffer
            );

        for (
            let i = 0;
            i < bytes.byteLength;
            i++
        ) {

            binary +=
                String.fromCharCode(
                    bytes[i]
                );

        }

        return btoa(binary);

    }

}