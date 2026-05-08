from pydantic import BaseModel

class InterviewRequest(BaseModel):
    query : str