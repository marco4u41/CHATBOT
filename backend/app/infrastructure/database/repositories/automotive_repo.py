from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from app.domain.interfaces.repository import AutomotiveRepository
from app.domain.models.automotive import (
    BrandSummary,
    VehicleMarketSummary,
    VehicleSummary,
)
from app.infrastructure.database.mappers import (
    map_brand,
    map_vehicle_market_stats,
    map_vehicle_master,
)
from app.infrastructure.database.models import (
    BrandModel,
    VehicleMarketStatsModel,
    VehicleMasterModel,
)

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

_LIMIT_MIN = 1
_LIMIT_MAX_SEARCH = 50
_LIMIT_MAX_LIST = 100
_OFFSET_MIN = 0


def _normalize_filter(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    if not stripped:
        return None
    return stripped


def _clamp(value: int, min_val: int, max_val: int) -> int:
    return max(min_val, min(value, max_val))


class SqlAlchemyAutomotiveRepository(AutomotiveRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def search_vehicles(
        self,
        manufacturer: str | None = None,
        model: str | None = None,
        year: int | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        fuel: str | None = None,
        transmission: str | None = None,
        vehicle_type: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> list[VehicleSummary]:
        limit = _clamp(limit, _LIMIT_MIN, _LIMIT_MAX_SEARCH)
        offset = max(_OFFSET_MIN, offset)

        stmt = select(VehicleMasterModel)

        norm_mfr = _normalize_filter(manufacturer)
        if norm_mfr is not None:
            stmt = stmt.where(
                func.lower(VehicleMasterModel.manufacturer) == norm_mfr.lower()
            )

        norm_model = _normalize_filter(model)
        if norm_model is not None:
            stmt = stmt.where(
                func.lower(VehicleMasterModel.model).like(f"%{norm_model.lower()}%")
            )

        if year is not None:
            stmt = stmt.where(VehicleMasterModel.year == year)

        if min_price is not None:
            stmt = stmt.where(
                VehicleMasterModel.price_median.isnot(None),
                VehicleMasterModel.price_median >= min_price,
            )

        if max_price is not None:
            stmt = stmt.where(
                VehicleMasterModel.price_median.isnot(None),
                VehicleMasterModel.price_median <= max_price,
            )

        norm_fuel = _normalize_filter(fuel)
        if norm_fuel is not None:
            stmt = stmt.where(
                func.lower(VehicleMasterModel.fuel_mode) == norm_fuel.lower()
            )

        norm_trans = _normalize_filter(transmission)
        if norm_trans is not None:
            stmt = stmt.where(
                func.lower(VehicleMasterModel.transmission_mode) == norm_trans.lower()
            )

        norm_type = _normalize_filter(vehicle_type)
        if norm_type is not None:
            stmt = stmt.where(
                func.lower(VehicleMasterModel.type_mode) == norm_type.lower()
            )

        stmt = stmt.order_by(
            VehicleMasterModel.listing_count.desc().nullslast(),
            VehicleMasterModel.year.desc(),
            VehicleMasterModel.manufacturer.asc(),
            VehicleMasterModel.model.asc(),
        )

        stmt = stmt.limit(limit).offset(offset)

        try:
            result = await self._session.execute(stmt)
            vehicles = [map_vehicle_master(v) for v in result.scalars().all()]
            logger.debug(
                "search_vehicles: %d results (mfr=%s, model=%s)",
                len(vehicles), norm_mfr, norm_model,
            )
            return vehicles
        except SQLAlchemyError:
            logger.exception("search_vehicles query failed")
            return []

    async def get_vehicle_details(
        self,
        manufacturer: str,
        model: str,
        year: int | None = None,
    ) -> list[VehicleSummary]:
        norm_mfr = _normalize_filter(manufacturer)
        norm_model = _normalize_filter(model)
        if not norm_mfr or not norm_model:
            return []

        stmt = select(VehicleMasterModel).where(
            func.lower(VehicleMasterModel.manufacturer) == norm_mfr.lower(),
            func.lower(VehicleMasterModel.model) == norm_model.lower(),
        )

        if year is not None:
            stmt = stmt.where(VehicleMasterModel.year == year)

        stmt = stmt.order_by(VehicleMasterModel.year.desc()).limit(50)

        try:
            result = await self._session.execute(stmt)
            vehicles = [map_vehicle_master(v) for v in result.scalars().all()]
            logger.debug(
                "get_vehicle_details: %d results (%s %s, year=%s)",
                len(vehicles), norm_mfr, norm_model, year,
            )
            return vehicles
        except SQLAlchemyError:
            logger.exception("get_vehicle_details query failed")
            return []

    async def get_model_stats(
        self,
        manufacturer: str,
        model: str,
    ) -> VehicleMarketSummary | None:
        norm_mfr = _normalize_filter(manufacturer)
        norm_model = _normalize_filter(model)
        if not norm_mfr or not norm_model:
            return None

        stmt = select(VehicleMarketStatsModel).where(
            func.lower(VehicleMarketStatsModel.manufacturer) == norm_mfr.lower(),
            func.lower(VehicleMarketStatsModel.model) == norm_model.lower(),
        )

        try:
            result = await self._session.execute(stmt)
            model_obj = result.scalar_one_or_none()
            if model_obj is None:
                logger.debug("get_model_stats: no stats for %s %s", norm_mfr, norm_model)
                return None
            return map_vehicle_market_stats(model_obj)
        except SQLAlchemyError:
            logger.exception("get_model_stats query failed")
            return None

    async def get_brand_stats(
        self,
        manufacturer: str,
    ) -> BrandSummary | None:
        norm_mfr = _normalize_filter(manufacturer)
        if not norm_mfr:
            return None

        stmt = select(BrandModel).where(
            func.lower(BrandModel.manufacturer) == norm_mfr.lower(),
        )

        try:
            result = await self._session.execute(stmt)
            brand = result.scalar_one_or_none()
            if brand is None:
                logger.debug("get_brand_stats: no stats for %s", norm_mfr)
                return None
            return map_brand(brand)
        except SQLAlchemyError:
            logger.exception("get_brand_stats query failed")
            return None

    async def list_brands(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> list[BrandSummary]:
        limit = _clamp(limit, _LIMIT_MIN, _LIMIT_MAX_LIST)
        offset = max(_OFFSET_MIN, offset)

        stmt = (
            select(BrandModel)
            .order_by(
                BrandModel.total_listings.desc().nullslast(),
                BrandModel.manufacturer.asc(),
            )
            .limit(limit)
            .offset(offset)
        )

        try:
            result = await self._session.execute(stmt)
            brands = [map_brand(b) for b in result.scalars().all()]
            logger.debug("list_brands: %d results", len(brands))
            return brands
        except SQLAlchemyError:
            logger.exception("list_brands query failed")
            return []

    async def health_check(self) -> bool:
        try:
            await self._session.execute(select(func.count()).select_from(BrandModel))
            return True
        except SQLAlchemyError:
            logger.exception("AutomotiveRepository health_check failed")
            return False
