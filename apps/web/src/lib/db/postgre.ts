import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Session {
    id: string;
    title: string;
    duration?: number;
    startTime: number;
    endTime?: number;
    status: 'running' | 'completed';
}

interface ReflexDBSchema extends DBSchema {
    sessions: {
        key: string;
        value: Session;
        indexes: { 'by-date': number };
    };
    audio_chunks: {
        key: string;
        value: {
            id: string;
            sessionId: string;
            blob: Blob;
            timestamp: number;
        };
        indexes: { 'by-session': string };
    };
}

let dbPromise: Promise<IDBPDatabase<ReflexDBSchema>> | null = null;

if (typeof window !== 'undefined') {
    dbPromise = openDB<ReflexDBSchema>('reflex-db', 1, {
        upgrade(db) {
            const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
            sessionStore.createIndex('by-date', 'startTime');

            const audioStore = db.createObjectStore('audio_chunks', { keyPath: 'id' });
            audioStore.createIndex('by-session', 'sessionId');
        },
    });
}

// Ensure unique ID generation without importing big libraries if unneeded
const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

export const dbService = {
    async startDBSession(title: string = "Mock Interview Session"): Promise<Session> {
        const db = await dbPromise;
        if (!db) throw new Error("IndexedDB not initialized");
        
        const newSession: Session = {
            id: generateId(),
            title,
            startTime: Date.now(),
            status: 'running',
        };

        await db.put('sessions', newSession);
        return newSession;
    },

    async stopDBSession(sessionId: string): Promise<void> {
        const db = await dbPromise;
        if (!db) throw new Error("IndexedDB not initialized");

        const session = await db.get('sessions', sessionId);
        if (session) {
            session.status = 'completed';
            session.endTime = Date.now();
            session.duration = Math.floor((session.endTime - session.startTime) / 1000); // duration in seconds
            await db.put('sessions', session);
        }
    },

    async saveAudioChunk(sessionId: string, blob: Blob): Promise<void> {
        const db = await dbPromise;
        if (!db) return;

        await db.put('audio_chunks', {
            id: generateId(),
            sessionId,
            blob,
            timestamp: Date.now(),
        });
    },

    async getAllSessions(): Promise<Session[]> {
        const db = await dbPromise;
        if (!db) return [];
        
        const sessions = await db.getAllFromIndex('sessions', 'by-date');
        // Return sorted by mostly recent
        return sessions.sort((a, b) => b.startTime - a.startTime);
    }
};
