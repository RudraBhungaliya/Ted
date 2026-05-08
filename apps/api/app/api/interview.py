from fastapi import APIRouter

from app.schemas.interview import InterviewRequest

from app.services.interview.pipeline import run_pipeline
from app.services.realtime.sse import create_sse 

router = APIRouter(
    prefix="/interview",
    tags=["interview"],
)

@router.post("/stream")
async def stream_interview(req : InterviewRequest):
    async def event_generator():
        async for token in run_pipeline(req.query):
            
            yield {
                "event" : "message",
                "data" : token
            }
    return create_sse(event_generator())