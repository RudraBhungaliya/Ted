from abc import ABC, abstractmethod

class BaseAudioProvider(ABC) :
    @abstractmethod
    async def transcribe(
        self,
        audio_chunk : bytes
    ) -> str : pass