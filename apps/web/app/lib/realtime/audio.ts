import { acquireScreenShareStream, releaseScreenShareStream } from "../../../lib/screen/capture";

const TARGET_SAMPLE_RATE = 16000;

export class AudioEngine {
  private audioContext: AudioContext | null = null;

  private processor: ScriptProcessorNode | null = null;

  private micSource: MediaStreamAudioSourceNode | null = null;

  private systemSource: MediaStreamAudioSourceNode | null = null;

  private micStream: MediaStream | null = null;

  private systemStream: MediaStream | null = null;

  private silentGain: GainNode | null = null;

  async start(onChunk: (audio: Uint8Array) => void): Promise<void> {
    try{
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.systemStream = await acquireScreenShareStream(true);

      console.log("Mic Success");
      console.log(this.micStream.getAudioTracks());

      console.log("System share success");
      console.log(this.systemStream.getAudioTracks());
    }
    catch(err){ 
      console.error("Audio capture error", err);
      throw err;
    }
    
    const micTracks = this.micStream.getAudioTracks();
    const systemTracks = this.systemStream.getAudioTracks();

    if (micTracks.length === 0) {
      throw new Error("No microphone input detected.");
    }

    if (systemTracks.length === 0) {
      throw new Error(
        "No system audio detected. Select a screen, window, or tab and enable audio sharing.",
      );
    }

    this.audioContext = new AudioContext();

    await this.audioContext.resume();

    const inputSampleRate = this.audioContext.sampleRate;

    this.micSource = this.audioContext.createMediaStreamSource(this.micStream);

    this.systemSource = this.audioContext.createMediaStreamSource(this.systemStream);

    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.silentGain = this.audioContext.createGain();

    this.silentGain.gain.value = 0;

    this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
      const input = event.inputBuffer.getChannelData(0);

      const resampled = this.downsample(
        input,
        inputSampleRate,
        TARGET_SAMPLE_RATE,
      );

      onChunk(new Uint8Array(this.float32ToPCM16(resampled)));
    };

    this.micSource.connect(this.processor);

    this.systemSource.connect(this.processor);

    this.processor.connect(this.silentGain);

    this.silentGain.connect(this.audioContext.destination);
  }

  stop(): void {
    this.processor?.disconnect();

    this.micSource?.disconnect();

    this.systemSource?.disconnect();

    this.silentGain?.disconnect();

    this.micStream?.getTracks().forEach((track) => track.stop());

    releaseScreenShareStream();

    void this.audioContext?.close();

    this.processor = null;

    this.micSource = null;

    this.systemSource = null;

    this.silentGain = null;

    this.micStream = null;

    this.systemStream = null;

    this.audioContext = null;
  }

  private downsample(
    input: Float32Array,
    inputRate: number,
    outputRate: number,
  ): Float32Array {
    if (inputRate === outputRate) {
      return input;
    }

    const ratio = inputRate / outputRate;

    const outputLength = Math.floor(input.length / ratio);

    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const position = i * ratio;

      const index = Math.floor(position);

      const fraction = position - index;

      const sample0 = input[index] ?? 0;

      const sample1 = input[index + 1] ?? sample0;

      output[i] = sample0 + (sample1 - sample0) * fraction;
    }

    return output;
  }

  private float32ToPCM16(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);

    const view = new DataView(buffer);

    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]));

      view.setInt16(
        i * 2,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
    }

    return buffer;
  }
}
