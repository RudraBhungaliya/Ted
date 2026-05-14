from app.services.cache.redis import (
    redis_manager
)

from app.services.cache.keys import (
    transcript_key
)

from app.services.cache.repository import (
    cache_repository
)

class SessionCacheService :
    async def save_trasnscript(
        self,
        session_id : str,
        transcript : str
    ) :
        client = redis_manager.get_client()
        
        await cache_repository.set(
            transcript_key(session_id),
            transcript,
            ttl=3600
        )
        
    async def get_transcript(
        self, 
        session_id : str,        
    ) -> str : 
        client = redis_manager.get_client()
        
        transcript = await client.get(
            transcript_key(session_id)
        )
        
        return transcript or ""
    
    async def clear_session(
        self,
        session_id : str
    ) :
        client = redis_manager.get_client()
        
        await client.delete(
            transcript_key(session_id)
        )
        
session_cache = SessionCacheService()
    
