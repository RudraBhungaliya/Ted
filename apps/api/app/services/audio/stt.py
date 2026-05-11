from abc import ABC, abstractmethod

class BaseSTTProvider(ABC) :
    @abstractmethod
    async def transcribe(self, audio_chunk : bytes) -> str :
        "Transcribe the audio chunk and return the transcribed text"
        pass
    
    class MockSTTProvider(BaseSTTProvider) :
        async def transcribe(self, audio_chunk : bytes) -> str : 
            return "test transcription"
        
stt_provider = MockSTTProvider()