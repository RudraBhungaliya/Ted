from app.services.realtime.sse import ( manager )
from app.services.interview.pipeline import ( run_pipeline )

async def stream_interview(
    session_id  : str,
    query : str,
) :
    async for token in run_pipeline(query) :
        await manager.send_message(
            session_id,
            {
                "type" : "token",
                "data" : token,
            }
        )