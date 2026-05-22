import { useState, useEffect } from 'react';
import { dbService, Session } from '../../lib/db/postgre';
import { format, isToday, isYesterday } from 'date-fns';

export interface GroupedSessions {
    date: string;
    items: {
        id: string;
        title: string;
        duration: string;
        time: string;
        status: string;
    }[];
}

export const useSessions = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSessions = async () => {
        try {
            const data = await dbService.getAllSessions();
            setSessions(data);
        } catch (error) {
            console.error("Failed to load sessions", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(() => {
            loadSessions();
        });

        const handleSessionStopped = () => {
            loadSessions();
        };

        window.addEventListener('session-stopped', handleSessionStopped);
        return () => window.removeEventListener('session-stopped', handleSessionStopped);
    }, []);

    const groupedSessions: GroupedSessions[] = [];
    
    // Group sessions by date
    sessions.forEach(session => {
        const dateObj = new Date(session.startTime);
        let dateLabel = format(dateObj, 'MMM d, yyyy');
        
        if (isToday(dateObj)) {
            dateLabel = 'Today';
        } else if (isYesterday(dateObj)) {
            dateLabel = 'Yesterday';
        }

        let existingGroup = groupedSessions.find(g => g.date === dateLabel);
        if (!existingGroup) {
            existingGroup = { date: dateLabel, items: [] };
            groupedSessions.push(existingGroup);
        }

        // format duration neatly
        const durSecs = session.duration || 0;
        const mins = Math.floor(durSecs / 60);
        const secs = durSecs % 60;
        const durationStr = session.status === 'running' 
            ? 'Running' 
            : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        existingGroup.items.push({
            id: session.id,
            title: session.title || 'Untitled Session',
            duration: durationStr,
            time: format(dateObj, 'h:mm a'),
            status: session.status,
        });
    });

    return { sessions, groupedSessions, isLoading, refetch: loadSessions };
};
