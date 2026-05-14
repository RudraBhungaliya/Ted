from app.services.audio.providers.deepgram import (
    DeepgramProvider
)

class STTService :
    def __init__(self) :
        self.provider = DeepgramProvider()
        
    async def transcribe(
        self,
        audio_chunk : bytes
    ) -> str :
        return await self.provider.transcribe(audio_chunk)
    
stt_service = STTService() 