import httpx
from app.core.logging import logger

class HTTPClientManager :
    def _init_(self) :
        self.client : httpx.AsyncClient | None = None
        
    async def connect(self) :
        logger.info("Initializing HTTP client connection...")
        
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0),
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=100,
            )
        )
        
    async def disconnect(self) :
        if self.client :
            logger.info("Closing HTTP client connection...")
            await self.connect.aclose()
    
    def get_client(self) -> httpx.AsyncClient :
        if not self.client :
            raise RuntimeError("HTTP client not initialized")

        return self.client
http_manager = HTTPClientManager()