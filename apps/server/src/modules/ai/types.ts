export type ConversationRole =
    | "system"
    | "user"
    | "assistant";

export type ConversationTurn = {
    role : 
        ConversationRole;
    text : 
        string;
    timestamp : 
        number;
};

export type StreamTokenHandler = (token : string) => void;