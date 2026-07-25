from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.connection import Base


class ConversationModel(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    messages: Mapped[list["MessageModel"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="MessageModel.created_at",
    )

    @property
    def message_count(self) -> int:
        return len(self.messages)


class MessageModel(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    conversation_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("conversations.id", ondelete="CASCADE"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    conversation: Mapped["ConversationModel"] = relationship(back_populates="messages")


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    primary_vehicle_brand: Mapped[str | None] = mapped_column(String(50), nullable=True)
    primary_vehicle_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    primary_vehicle_year: Mapped[int | None] = mapped_column(nullable=True)
    primary_vehicle_engine: Mapped[str | None] = mapped_column(String(50), nullable=True)
    budget_usd: Mapped[float | None] = mapped_column(nullable=True)
    terrain: Mapped[str | None] = mapped_column(String(20), nullable=True)
    engine_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    usage: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fuel_preference: Mapped[str | None] = mapped_column(String(30), nullable=True)
    family_size: Mapped[int | None] = mapped_column(nullable=True)
    preferences: Mapped[str | None] = mapped_column(Text, nullable=True)
    mentioned_brands: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_brands: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )


class VehicleMasterModel(Base):
    __tablename__ = "vehicles_master"

    vehicle_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vehicle_name: Mapped[str] = mapped_column(String(255), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(200), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    listing_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_mean: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_median: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_min: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_max: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    odometer_mean: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    odometer_median: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    fuel_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    transmission_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    condition_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cylinders_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    drive_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    type_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    size_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    paint_color_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    states_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    first_posting_date: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True,
    )
    last_posting_date: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True,
    )
    price_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    market_confidence: Mapped[str | None] = mapped_column(String(50), nullable=True)


class VehicleMarketStatsModel(Base):
    __tablename__ = "vehicle_market_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(200), nullable=False)
    years_available: Mapped[int | None] = mapped_column(Integer, nullable=True)
    oldest_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    newest_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_listings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overall_price_mean: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True,
    )
    overall_price_median: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True,
    )
    overall_odometer_mean: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True,
    )
    fuel_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    transmission_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    drive_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    type_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)


class BrandModel(Base):
    __tablename__ = "brands"

    brand_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    model_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    year_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_listings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    average_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
