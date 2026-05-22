from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.logging import logger
from app.core.http import http_manager


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Starting Ted API...")
    await http_manager.connect()

    yield

    logger.info("Shutting down Ted API...")
    await http_manager.disconnect()