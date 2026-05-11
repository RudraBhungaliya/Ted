from pydantic import BaseModel
from typing import Optional

class StreamRequest(BaseModel) :
    query : str
    session_id : Optional[str] = None

class StreamResponse(BaseModel) :
    type : Literal[
        "response_chunk",
        "response_end",
        "error",
    ]
    
    data : str