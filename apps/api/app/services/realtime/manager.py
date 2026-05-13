from fastapi import WebSocket
from collections import defaultdict

class ConnectionManager :
    def __init__(self) :
        self.connections : dict[str, WebSocket] = {}
        self.transcripts : dict[str, list[str]] = defaultdict(list)
        
    async def connect(self, session_id : str, websocket : WebSocket) :
        await websocket.accept()
        self.connections[session_id] = websocket
    
    def disconnect(self, session_id : str) : 
        if session_id in self.connections :
            del self.connections[session_id]
            
        if session_id in self.trancscripts :
            del self.transcripts[session_id]
        
    async def send_json(self, session_id : str, data : dict) :
        websocket = self.connections.get(session_id)
        
        if websocket : 
            await websocket.send_json(data)
            
    def append_transcript(self, session_id : str, message : str) :
        self.transcripts[session_id].append(message)
        
    def get_full_transcript(self, session_id : str) -> str :
        return " ".join(self.transcripts[session_id]) 
        
manager = ConnectionManager()