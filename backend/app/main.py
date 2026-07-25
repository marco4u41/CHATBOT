import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.infrastructure.database.models
from app.api.v1.automotive import router as automotive_router
from app.api.v1.router import router as api_router
from app.config import settings
from app.infrastructure.database.connection import create_tables, get_existing_tables

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AutoExpert AI backend...")
    logger.info("Database: %s@%s:%s/%s",
                settings.postgres_user or "(sqlite)",
                settings.postgres_host or "localhost",
                settings.postgres_port,
                settings.postgres_db or "chatbot.db")

    try:
        await create_tables()
    except Exception:
        logger.exception("Failed to connect to database or create tables")
        raise

    tables = await get_existing_tables()
    logger.info("Startup complete. Total tables in DB: %d", len(tables))
    yield
    logger.info("Shutting down backend.")


def create_app() -> FastAPI:
    app = FastAPI(
        title="AutoExpert AI",
        description="API de chatbot automotriz con agente inteligente",
        version="0.2.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api")
    app.include_router(automotive_router, prefix="/api/automotive")

    @app.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
