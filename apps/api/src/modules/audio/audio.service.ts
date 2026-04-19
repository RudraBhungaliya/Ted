import { publish } from "../../lib/eventBus";

type UploadedAudioFile = {
    originalname: string;
    size: number;
};

export const uploadActive = async (file: UploadedAudioFile | undefined) => {
    if(!file) throw new Error("No file uploaded");

    const data = {
        fileName : file.originalname,
        size : file.size,
    };

    publish({ type : "audio_uploaded", data});
    return data;
};

export const processChunk = async (file: UploadedAudioFile | undefined) => {
    if(!file) throw new Error("No file uploaded");

    const data = {// TEMP Data
        text : "Processing Chunk...",
        timeStamp : Date.now(),
    }

    publish({
        type : "grok_response",
        data : data,
    });
};