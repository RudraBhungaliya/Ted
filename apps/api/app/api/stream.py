from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.interview.pipeline import run_pipeline
router = APIRouter()

@router.get("/stream")
async def stream(
    query : str,
) :
    
    async def token_generator() :
        async for token in run_pipeline(query) :
            yield f"data: {token}\n\n"
            
    return StreamingResponse(
        token_generator(),
        media_type = "text/event-stream",
    )