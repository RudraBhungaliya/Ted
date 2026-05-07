type Session = {
    buffer : Blob[];
    textBuffer : string;
    lastActive : number; 
};

export const sessions : Record<string, Session> = {};