from app.services.cache.redis import (
    redis_manager
)

class CacheRepository :
    async def get(
        self,
        key : str
    ) :
        client = redis_manager.get_client()
        return await client.get(key)
    
    async def set(
        self,
        key : str,
        value : str,
        ttl : int | None = None
    ) :
        client = redis_manager.get_client()
        
        await client.set(
            key,
            value,
            ex=ttl
        ) 

    async def delete(
        self,
        key : str
    ) :
        client = redis_manager.get_client()
        await client.delete(key)
        
cache_reppository = CacheRepository()