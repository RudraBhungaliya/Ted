from pydantic import BaseModel
from typing import Optional

class StreamQueryRequest(BaseModel) :
    query : str
    session_id : str | None = None

class StreamChunkResponse(BaseModel) :
    type : Literal[
        "response_chunk",
        "response_end",
        "partial_transcript",
        "final_transcript",
        "error",
    ]
    
    data : str