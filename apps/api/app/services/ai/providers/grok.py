from app.core.http import http_manager
from app.core.logging import logger
from app.core.settings import settings

from app.services.ai.providers.base import BaseLLMProvider 

class GrokProvider(BaseLLMProvider) :
    BASE_URL = "https://api.x.ai/v1/chat/completions"
    
    async def generate_response(
        self,
        prompt : str,
        system_prompt : str | None = None,
        temperature : float = 0.7,
    ) -> str :
        
        client = http_manager.get_client()
        messages = []
        
        if system_prompt :
            messages.append({
                "role" : "system",
                "content" : system_prompt,   
            })
            
        messages.append({
            "role" : "user",
            "content" : prompt,
        })
        
        payload = {
            "model" : "grok-3-mini",
            "messages" : messages,
            "temperature" : temperature
        }
        
        headers = {
            "Authorization" : f"Bearer { settings.GROK_API_KEY }",
            "Content-Type" : "application/json",
        }
        
        try : 
            response = await client.post(
                self.BASE_URL,
                json=payload,
                headers=headers,
            )
            
            response.raise_for_status()
            data = response.json()
            
            content = (
                data["choices"][0]
                ["message"]
                ["content"]
            )
            
            return content.strip()
        
        except Exception as e :
            logger.error(f"Grok API Error : {str(e)}")
            
            raise
        