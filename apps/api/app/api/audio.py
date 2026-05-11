from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from app.services.realtime.manager import manager
from app.services.audio.stt import stt_provider
from app.services.audio.stt import BaseSTTProvider
from app.services.interview.pipeline import run_pipeline

router = APIRouter()

@router.websocket("/ws/audio/{session_id}")
async def audio_ws(
    websocket : WebSocket,
    session_id : str,
) :
    
    await manager.connect(
        session_id,
        websocket,
    )
    
    try :
        while True :
            audio_chunk = await websocket.receive_bytes()
            transcript = await stt_provider.transcribe(audio_chunk)
            
            if transcript.strip():
                manager.append_transcript(session_id, transcript,)
                
                await manager.send_json(
                    session_id,
                    { 
                        "type" : "partial_transcript", 
                        "data" : transcript,
                    }
                )
                
                full_query = manager.get_full_transcription(session_id)
                
                response = ""
                
                async for token in run_pipeline(full_query) :
                    response += token
                    await manager.send_json(
                        session_id,
                        {
                            "type" : "response_token",
                            "data" : token,
                        }
                    ) 
                
                await manager.send_json(
                    session_id,
                    {
                        "type" : "response_end",
                        "data" : response,
                    }
                )
                
    except WebSocketDisconnect :
        manager.disconnect(session_id)           
            
