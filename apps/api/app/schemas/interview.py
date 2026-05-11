from pydantic import BaseModel
from typing import Optional
from typing import Literal

class InterviewRequest(BaseModel) :
    query : str
    session_id : Optional[str] = None
    
class AudioChunk(BaseModel) :
    session_id : str
    chunk_index : int
    mime_type : str

class StreamChunk(BaseModel) :
    type : Literal[
        "partial_transcript",
        "response_chunk",
        "response_end",
        "error",
    ]
    
    data : str

class SessionState(BaseModel) :
    session_id : str
    transcript : str = ""
    response : str = ""
    connected : bool = False