import { useRef } from "react";
import { createRecorder } from "./recorder";

export const useMic = () => {
  const recorderRef = useRef<ReturnType<typeof createRecorder> | null>(null);

  const start = async (onData: (blob: Blob) => void) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = createRecorder(stream, onData);

    recorder.start();
    recorderRef.current = recorder;
  };

  const stop = () => {
    recorderRef.current?.stop();
  };

  return { start, stop };
};
