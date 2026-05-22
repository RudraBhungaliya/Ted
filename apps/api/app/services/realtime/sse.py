from app.services.realtime.manager import ( manager )
from app.services.interview.pipeline import ( run_pipeline )

async def stream_interview(
    session_id  : str,
    query : str,
) :
    async for token in run_pipeline(query) :
        await manager.send_json(
            session_id,
            {
                "type" : "token",
                "data" : token,
            }
        )