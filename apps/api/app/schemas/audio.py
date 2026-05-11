from pydantic import BaseModel
from typing import Optional

class AudioChunk(BaseModel) :
    session_id : str
    chunk_index : int
    mime_type : str
    size : int

class TranscriptChunk(BaseModel) :
    type : Literal[
        "partial_transcript",
        "final_transcript",
        "error",
    ]
    
    data : str

class AudioSession(BaseMode) :
    session_id : str
    connected : bool = False
    transcript : str = ""