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

    async def count_by_type(self) -> list[dict[str, object]]:
        stmt = (
            select(
                VehicleMasterModel.type_mode,
                func.count().label("count"),
                func.avg(VehicleMasterModel.price_median).label(
                    "avg_price"
                ),
            )
            .group_by(VehicleMasterModel.type_mode)
            .order_by(func.count().desc())
        )
        try:
            result = await self._session.execute(stmt)
            return [
                {
                    "vehicle_type": row[0],
                    "count": row[1],
                    "avg_price": (
                        float(row[2]) if row[2] else None
                    ),
                }
                for row in result.all()
            ]
        except SQLAlchemyError:
            logger.exception("count_by_type query failed")
            return []

    async def count_by_fuel(self) -> list[dict[str, object]]:
        stmt = (
            select(
                VehicleMasterModel.fuel_mode,
                func.count().label("count"),
                func.avg(VehicleMasterModel.price_median).label(
                    "avg_price"
                ),
            )
            .group_by(VehicleMasterModel.fuel_mode)
            .order_by(func.count().desc())
        )
        try:
            result = await self._session.execute(stmt)
            return [
                {
                    "fuel": row[0],
                    "count": row[1],
                    "avg_price": (
                        float(row[2]) if row[2] else None
                    ),
                }
                for row in result.all()
            ]
        except SQLAlchemyError:
            logger.exception("count_by_fuel query failed")
            return []

    async def count_by_transmission(self) -> list[dict[str, object]]:
        stmt = (
            select(
                VehicleMasterModel.transmission_mode,
                func.count().label("count"),
            )
            .group_by(VehicleMasterModel.transmission_mode)
            .order_by(func.count().desc())
        )
        try:
            result = await self._session.execute(stmt)
            return [
                {
                    "transmission": row[0],
                    "count": row[1],
                }
                for row in result.all()
            ]
        except SQLAlchemyError:
            logger.exception("count_by_transmission query failed")
            return []

    async def avg_price_by_year(self) -> list[dict[str, object]]:
        stmt = (
            select(
                VehicleMasterModel.year,
                func.count().label("count"),
                func.avg(VehicleMasterModel.price_median).label(
                    "avg_price"
                ),
            )
            .group_by(VehicleMasterModel.year)
            .order_by(VehicleMasterModel.year.asc())
        )
        try:
            result = await self._session.execute(stmt)
            return [
                {
                    "year": row[0],
                    "count": row[1],
                    "avg_price": (
                        float(row[2]) if row[2] else None
                    ),
                }
                for row in result.all()
            ]
        except SQLAlchemyError:
            logger.exception("avg_price_by_year query failed")
            return []

    async def price_distribution(self) -> list[dict[str, object]]:
        ranges = [
            ("0-10000", 0, 10000),
            ("10000-20000", 10000, 20000),
            ("20000-30000", 20000, 30000),
            ("30000-50000", 30000, 50000),
            ("50000-75000", 50000, 75000),
            ("75000-100000", 75000, 100000),
            ("100000+", 100000, None),
        ]
        try:
            result_list: list[dict[str, object]] = []
            for label, low, high in ranges:
                stmt = select(func.count()).select_from(
                    VehicleMasterModel
                ).where(
                    VehicleMasterModel.price_median.isnot(None),
                    VehicleMasterModel.price_median >= low,
                )
                if high is not None:
                    stmt = stmt.where(
                        VehicleMasterModel.price_median < high
                    )
                count_result = await self._session.execute(stmt)
                count = count_result.scalar() or 0
                result_list.append({
                    "price_range": label,
                    "count": count,
                })
            return result_list
        except SQLAlchemyError:
            logger.exception("price_distribution query failed")
            return []

    async def vehicle_overview(self) -> dict[str, object]:
        try:
            total_stmt = select(
                func.count()
            ).select_from(VehicleMasterModel)
            total_result = await self._session.execute(
                total_stmt
            )
            total_vehicles = total_result.scalar() or 0

            avg_stmt = select(
                func.avg(VehicleMasterModel.price_median)
            ).select_from(VehicleMasterModel)
            avg_result = await self._session.execute(avg_stmt)
            avg_price_raw = avg_result.scalar()
            avg_price = (
                float(avg_price_raw) if avg_price_raw else None
            )

            brands_stmt = select(
                func.count(
                    func.distinct(VehicleMasterModel.manufacturer)
                )
            )
            brands_result = await self._session.execute(
                brands_stmt
            )
            total_brands = brands_result.scalar() or 0

            models_stmt = select(
                func.count(func.distinct(
                    func.concat(
                        VehicleMasterModel.manufacturer,
                        " ",
                        VehicleMasterModel.model,
                    )
                ))
            )
            models_result = await self._session.execute(
                models_stmt
            )
            total_models = models_result.scalar() or 0

            return {
                "total_vehicles": total_vehicles,
                "avg_price": avg_price,
                "total_brands": total_brands,
                "total_models": total_models,
            }
        except SQLAlchemyError:
            logger.exception("vehicle_overview query failed")
            return {
                "total_vehicles": 0,
                "avg_price": None,
                "total_brands": 0,
                "total_models": 0,
            }

    async def brand_ranking(self, limit: int = 10) -> list[BrandSummary]:
        stmt = (
            select(BrandModel)
            .order_by(BrandModel.total_listings.desc().nullslast())
            .limit(limit)
        )
        try:
            result = await self._session.execute(stmt)
            return [map_brand(b) for b in result.scalars().all()]
        except SQLAlchemyError:
            logger.exception("brand_ranking query failed")
            return []

    async def health_check(self) -> bool:
        try:
            await self._session.execute(select(func.count()).select_from(BrandModel))
            return True
        except SQLAlchemyError:
            logger.exception("AutomotiveRepository health_check failed")
            return False
