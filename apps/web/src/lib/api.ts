import axios from "axios";

const baseURL =
    process.env.NEXT_PUBLIC_API_URL || process.env.API || "http://localhost:8000";

export const api = axios.create({
    baseURL,
    timeout: 10000,
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error("API Error:", err?.response?.data || err.message);
        return Promise.reject(err);
    },
);

// Session
export const startSession = async () => {
    const { data } = await api.post("/session/start");
    return data;
};

export const stopSession = async (sessionId: string) => {
    await api.post(`/session/stop/${sessionId}`);
};

// audio
export const sendAudioChunk = async (sessionId: string, chunk: Blob) => {
    const formData = new FormData();
    formData.append("audio", chunk);

    await api.post(`/audio/${sessionId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};