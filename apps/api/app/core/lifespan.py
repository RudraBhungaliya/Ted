from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Starting Ted API...")

    yield

    logger.info("Shutting down Ted API...")