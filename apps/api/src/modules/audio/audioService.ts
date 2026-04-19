import { publish } from "../../lib/eventBus";

type UploadedAudioFile = {
    buffer: Buffer;
};

export const uploadActive = async (file: UploadedAudioFile | undefined) => {
    if (!file) throw new Error("No file uploaded");

    const data = {
        fileName: "audio",
        size: file.buffer.byteLength,
    };

    publish({ type: "audio_uploaded", data });
    return data;
};

export const processChunk = async (file: UploadedAudioFile | undefined) => {
    if (!file) throw new Error("No file uploaded");

    const data = {
        text: "Processing Chunk...",
        timeStamp: Date.now(),
    };

    publish({
        type: "grok_response",
        data,
    });
};
