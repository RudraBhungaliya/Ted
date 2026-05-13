from app.services.audio.providers.base import (
    DeepgramProvider
)

class STTService :
    def __init__(self) :
        self.provider = DeepgramProvider()
        
    async def transcribe(
        self,
        audio_chunk : bytes
    ) -> str :
        return await self.provider.transcrbe(audio_chunk)
    
stt_services = STTService() 