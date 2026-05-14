import redis.asyncio as redis

from app.core.settings import settings
from app.core.logging import logger

class RedisManager :
    def __init__(self) :
        self.client :  redis.Redis | None = None
        
    async def connect(self) :
        logger.info("Connecting to Redis...")
        
        self.client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True
        )
        
        await self.client.ping()
        logger.info("Redis Connected")
    
    async def disconnect(self) :
        if self.client :
            logger.info("Disconnecting from Redis...")
            await self.client.close()
            
    def get_client(self) -> redis.Redis :
        if not self.client :
            raise RuntimeError(
                "Redis client not initialized"
            )
            
        return self.client
    
redis_manager = RedisManager();