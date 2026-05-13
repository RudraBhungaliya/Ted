from app.core.http import http_manager
from app.core.logging import logger
from app.core.settings import settings

from app.services.ai.providers.base import BaseSTTProvider

class DeepgramProvider(BaseSTTProvider) :
    
    BASE_URL = (
        "https://api.deepgram.com.v1/listen"
    )
    
    async def transcibe(
        self,
        audio_chunk : bytes
    ) -> str :
        client = http_manager.get_client()
        headers = {
            "Authorization" : (
                f"Token {settings.DEEPGRAM_API_KEY}"
            ),
            "Content-Type" : "audio/wav"
        }
        
        params = {
            "model" : "nova-2",
            "smart_format" : "true"
        }
        
        try :
            response = await client.post(
                self.BASE_URL,
                headers = headers,
                params = params,
                content = audio_chunk,
            )
            
            response.raise_for_status()
            data = response.json()
            
            transcript = (
                data["results"]
                ["channels"][0]
                ["alternatives"][0]
                ["transcript"]
            )
            
            return transcript
        except Exception as e : 
            logger.error(
                f"Deepgram transcription failed : {str(e)}"
            )
            
            raise