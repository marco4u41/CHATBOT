import logging
from collections.abc import AsyncGenerator

from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    **({"pool_pre_ping": True} if not settings.is_sqlite else {}),
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_existing_tables() -> list[str]:
    """Return list of all table names currently in the database."""
    async with engine.begin() as conn:
        result = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).get_table_names()
        )
        return sorted(result)


async def create_tables() -> None:
    """Create only the tables defined in Base.metadata (chatbot internal tables).

    This uses CREATE TABLE IF NOT EXISTS under the hood, so it will:
    - Create conversations, messages, user_profiles if they don't exist
    - Leave ALL other tables untouched (vehicles_master, brands, etc.)
    """
    tables_before = await get_existing_tables()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    tables_after = await get_existing_tables()

    created = set(tables_after) - set(tables_before)
    if created:
        logger.info("Created tables: %s", ", ".join(sorted(created)))

    managed = {t.name for t in Base.metadata.sorted_tables}
    existing_managed = sorted(managed & set(tables_after))
    existing_external = sorted(set(tables_after) - managed)

    logger.info(
        "DB connected: %s | Internal tables: %s | External tables: %s",
        settings.postgres_db or "sqlite",
        ", ".join(existing_managed) or "(none)",
        ", ".join(existing_external) or "(none)",
    )


async def get_async_session() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
