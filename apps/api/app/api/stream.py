from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)

from app.services.realtime.manager import ( manager )
from app.services.audio.stt import stt_service
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
            while True :
                message = await websocket.receive()
                if "text" in message :
                    data = message.json_loads(
                        message["text"]
                    )
                    
                    query = data.get("query", "")
                    
                    if not query :
                        continue
                    manager.append_transcript(
                        session_id,
                        query,
                    )
                    
                    await stream_interview(
                        session_id,
                        query
                    )
                    
                elif "bytes" in message :
                    audio_chunk = message["bytes"]
                    
                    if not audio_chunk :
                        continue
                    
                    transcript = await stt_service.transcribe(
                        audio_chunk,
                    )
                    
                    if not transcript:
                        continue
                    
                    manager.append_transcript(
                        session_id,
                        transcript,
                    )
                    
                    await manager.send_json(
                        session_id, {
                            "type" : "transcript",
                            "data" : transcript,
                        }
                    )
                    
                    await stream_interview(
                        session_id,
                        transcript,
                    )
                    
    except WebSocketDisconnect :
        manager.disconnect(session_id)
