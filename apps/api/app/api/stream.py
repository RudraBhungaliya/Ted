from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)

from app.services.realtime.manager import ( manager )

from app.services.realtime.sse import (
    stream_interview
)

router = APIRouter()

@router.websocket("ws:/{session_id}")
async def websocket_endpoint(
    websocket : WebSocket,
    session_id : str,
) :
    await manager.connect(
        session_id,
        websocket,
    )
    
    try :
        while True :
            data = await websocket.receive_json()
            query = data.get("query", "")
            
            if not query :
                continue
            
            manager.append_trancript(
                session_id,
                query,
            )
            
            await stream_interview(# using sse
                session_id,
                query,
            )
            
    except WebSocketDisconnect :
        manager.disconnect(session_id)
