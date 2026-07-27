import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.infrastructure.database.models
from app.api.v1.analytics import router as analytics_router
from app.api.v1.automotive import router as automotive_router
from app.api.v1.auth import router as auth_router
from app.api.v1.garage import router as garage_router
from app.api.v1.router import router as api_router
from app.config import settings
from app.domain.exceptions import ChatbotError, ConversationNotFoundError
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
    app.include_router(auth_router, prefix="/api/auth")
    app.include_router(garage_router, prefix="/api")
    app.include_router(automotive_router, prefix="/api/automotive")
    app.include_router(analytics_router, prefix="/api/analytics")

    @app.exception_handler(ConversationNotFoundError)
    async def conversation_not_found_handler(
        request: Request, exc: ConversationNotFoundError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": str(exc)},
        )

    @app.exception_handler(ChatbotError)
    async def chatbot_error_handler(
        request: Request, exc: ChatbotError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(exc)},
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(
        request: Request, exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Error interno del servidor",
            },
        )

    @app.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
