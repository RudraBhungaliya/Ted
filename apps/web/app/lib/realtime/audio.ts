import {
  acquireScreenShareStream,
  releaseScreenShareStream,
} from "../screen/capture";

const TARGET_SAMPLE_RATE = 16000;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private screenSource: MediaStreamAudioSourceNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private micStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private silentGain: GainNode | null = null;

  private logCounter = 0;

  private rms(buf: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  }

  async start(onChunk: (audio: Uint8Array) => void): Promise<void> {
    // --- Mic stream (channel 0): captured for your speech tracking only ---
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.micStream = micStream;

    // --- Screen/system audio stream (channel 1): this is what the interviewer says ---
    let screenStream: MediaStream | null = null;
    try {
      screenStream = await acquireScreenShareStream(true);
      const audioTracks = screenStream.getAudioTracks();
      const videoTracks = screenStream.getVideoTracks();
      console.log("[AudioEngine] Screen audio tracks:", audioTracks.length);
      console.log("[AudioEngine] Screen video tracks:", videoTracks.length);

      if (audioTracks.length === 0) {
        console.warn(
          "[AudioEngine] No system audio tracks found. " +
          "Make sure to check 'Share system audio' when sharing your screen/tab.",
        );
      }
    } catch (err) {
      console.warn("[AudioEngine] Screen stream acquisition failed:", err);
    }
    this.screenStream = screenStream;

    this.audioContext = new AudioContext();
    await this.audioContext.resume();

    const inputSampleRate = this.audioContext.sampleRate;

    // Build a 2-channel merger:
    //   Left  (index 0) = mic       → deepgram channel 0 → tracked as YOU, never triggers AI
    //   Right (index 1) = system    → deepgram channel 1 → tracked as INTERVIEWER, triggers AI
    this.merger = this.audioContext.createChannelMerger(2);

    // Channel 0: mic
    this.micSource = this.audioContext.createMediaStreamSource(micStream);
    this.micSource.connect(this.merger, 0, 0);

    // Channel 1: system/screen audio
    if (screenStream && screenStream.getAudioTracks().length > 0) {
      this.screenSource = this.audioContext.createMediaStreamSource(screenStream);
      this.screenSource.connect(this.merger, 0, 1);
      console.log("[AudioEngine] System audio connected to channel 1.");
    } else {
      // Feed silence into channel 1 so the buffer shape stays consistent
      const silenceBuffer = this.audioContext.createBuffer(1, 1, inputSampleRate);
      const silenceSource = this.audioContext.createBufferSource();
      silenceSource.buffer = silenceBuffer;
      silenceSource.loop = true;
      silenceSource.start();
      silenceSource.connect(this.merger, 0, 1);
      console.warn("[AudioEngine] Channel 1 filled with silence — no system audio available.");
    }

    // ScriptProcessor reads 2 input channels, outputs 2 (we discard output via silent gain)
    this.processor = this.audioContext.createScriptProcessor(4096, 2, 2);

    this.silentGain = this.audioContext.createGain();
    this.silentGain.gain.value = 0;

    this.merger.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
      // Channel 0 = mic (you), Channel 1 = system audio (interviewer)
      const micChannel = event.inputBuffer.getChannelData(0);
      const systemChannel =
        event.inputBuffer.numberOfChannels > 1
          ? event.inputBuffer.getChannelData(1)
          : new Float32Array(micChannel.length); // silence fallback

      const downsampledMic = this.downsample(micChannel, inputSampleRate, TARGET_SAMPLE_RATE);
      const downsampledSystem = this.downsample(systemChannel, inputSampleRate, TARGET_SAMPLE_RATE);

      // ── DIAGNOSTIC: log signal energy every ~1s to confirm both channels carry real audio ──
      this.logCounter++;
      if (this.logCounter % 12 === 0) { // ~every 1s at 4096-sample buffers @ ~48kHz
        const micEnergy = this.rms(downsampledMic);
        const sysEnergy = this.rms(downsampledSystem);
        console.log(
          `[AudioEngine] mic RMS=${micEnergy.toFixed(4)}  system RMS=${sysEnergy.toFixed(4)}`,
        );
      }

      // Interleave: mic(L) + system(R) → deepgram multichannel linear16
      const interleaved = this.interleave(downsampledMic, downsampledSystem);

      onChunk(new Uint8Array(this.float32ToPCM16(interleaved)));
    };
  }

  stop(): void {
    this.processor?.disconnect();
    this.micSource?.disconnect();
    this.screenSource?.disconnect();
    this.merger?.disconnect();
    this.silentGain?.disconnect();

    this.micStream?.getTracks().forEach((t) => t.stop());
    releaseScreenShareStream();

    void this.audioContext?.close();

    this.processor = null;
    this.micSource = null;
    this.screenSource = null;
    this.merger = null;
    this.silentGain = null;
    this.micStream = null;
    this.screenStream = null;
    this.audioContext = null;
  }

  private interleave(left: Float32Array, right: Float32Array): Float32Array {
    const length = left.length + right.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    while (index < length) {
      result[index++] = left[inputIndex];
      result[index++] = right[inputIndex];
      inputIndex++;
    }
    return result;
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