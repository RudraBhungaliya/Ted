import { useRef } from "react";

export const useMic = () => {
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const start = async (onData: (blob: Blob) => void) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) onData(e.data);
    };

    recorder.start(1000);
    mediaRecorder.current = recorder;
  };

  const stop = () => {
    mediaRecorder.current?.stop();
  };

  return { start, stop };
};
