from app.services.cache.redis import (
    redis_manager
)

class CacheLockService :
    async def acquire_lock(
        self,
        key : str,
        ttl : int = 30,
    ) -> bool :
        client = redis_manager.get_client()
        
        return await client.set(
            key,
            "1",
            ex=ttl,
            nx=True,
        )
        
    async def release_lock(
        self,
        key : str
    ) :
        client = redis_manager.get_client()
        await client.delete(key)

cache_lock = CacheLockService()