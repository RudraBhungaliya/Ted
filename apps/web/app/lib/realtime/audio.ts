import { acquireScreenShareStream, releaseScreenShareStream } from "../../../lib/screen/capture";

const TARGET_SAMPLE_RATE = 16000;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private systemSource: MediaStreamAudioSourceNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private micStream: MediaStream | null = null;
  private systemStream: MediaStream | null = null;
  private silentGain: GainNode | null = null;

  async start(onChunk: (audio: Uint8Array) => void): Promise<void> {
    try {
      // 1. Capture user microphone
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Capture meeting platform layout sound
      this.systemStream = await acquireScreenShareStream(true);
    } catch (err) { 
      console.error("Audio capture initialization failure:", err);
      throw err;
    }
    
    this.audioContext = new AudioContext();
    await this.audioContext.resume();

    const inputSampleRate = this.audioContext.sampleRate;

    this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
    this.systemSource = this.audioContext.createMediaStreamSource(this.systemStream);
    
    // 3. Create a 2-channel structural merger node
    this.merger = this.audioContext.createChannelMerger(2);
    this.processor = this.audioContext.createScriptProcessor(4096, 2, 2);
    this.silentGain = this.audioContext.createGain();
    this.silentGain.gain.value = 0;

    // Connect Mic to Channel 0 (Left) and System Audio to Channel 1 (Right)
    this.micSource.connect(this.merger, 0, 0);
    this.systemSource.connect(this.merger, 0, 1);

    this.merger.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
      const leftChannelMic = event.inputBuffer.getChannelData(0);
      const rightChannelSystem = event.inputBuffer.getChannelData(1);

      // Downsample both discrete channels concurrently
      const downsampledMic = this.downsample(leftChannelMic, inputSampleRate, TARGET_SAMPLE_RATE);
      const downsampledSystem = this.downsample(rightChannelSystem, inputSampleRate, TARGET_SAMPLE_RATE);

      // Interleave samples sequentially: [Mic0, Sys0, Mic1, Sys1, ...]
      const interleaved = new Float32Array(downsampledMic.length + downsampledSystem.length);
      for (let i = 0; i < downsampledMic.length; i++) {
        interleaved[i * 2] = downsampledMic[i];
        interleaved[i * 2 + 1] = downsampledSystem[i];
      }

      onChunk(new Uint8Array(this.float32ToPCM16(interleaved)));
    };
  }

  stop(): void {
    this.processor?.disconnect();
    this.micSource?.disconnect();
    this.systemSource?.disconnect();
    this.merger?.disconnect();
    this.silentGain?.disconnect();

    this.micStream?.getTracks().forEach((t) => t.stop());
    releaseScreenShareStream();
    void this.audioContext?.close();

    this.processor = null;
    this.micSource = null;
    this.systemSource = null;
    this.merger = null;
    this.silentGain = null;
    this.micStream = null;
    this.systemStream = null;
    this.audioContext = null;
  }

  private downsample(input: Float32Array, inputRate: number, outputRate: number): Float32Array {
    if (inputRate === outputRate) return input;
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
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return buffer;
  }
}