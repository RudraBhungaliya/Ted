type AudioChunk = {
    chunkId: string;
    audio: Buffer;
};

class AudioManager{
    private audioBuffers = 
    new Map<
        string, 
        AudioChunk[]
    >();

    appendChunk(
        sessionId : string,
        chunk : AudioChunk,
    ){
        const existingChunks = this.audioBuffers.get(sessionId);

        if (existingChunks) {
            existingChunks.push(chunk);

            existingChunks.sort((a, b) => a.chunkId.localeCompare(b.chunkId));

            return;
        }

        this.audioBuffers.set(sessionId, [chunk]);
    }

    getChunks(
        sessionId : string,
    ){  
        return this.audioBuffers.get(sessionId) || [];
    }

    clearChunks(
        sessionId : string,
    ){
        this.audioBuffers.delete(
            sessionId,
        );
    }

    getMergedBuffer(
        sessionId : string,
    ){
        const chunks = this.getChunks(sessionId);

        const buffers = chunks.map(
            (chunk) => chunk.audio,
        );

        if (buffers.length === 0) return Buffer.alloc(0);

        return Buffer.concat(buffers);
    }
}

export const audioManager = new AudioManager();