"""SQLAlchemy implementation of GarageVehicleRepository."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.interfaces.repository import GarageVehicleRepository
from app.domain.models.garage_vehicle import GarageVehicle
from app.infrastructure.database.models import UserGarageVehicleModel


def _to_domain(model: UserGarageVehicleModel) -> GarageVehicle:
    return GarageVehicle(
        id=model.id,
        user_id=model.user_id,
        brand=model.brand,
        model=model.model,
        year=model.year,
        engine=model.engine or "",
        transmission=model.transmission or "",
        fuel_type=model.fuel_type or "",
        mileage_km=model.mileage_km,
        price_usd=float(model.price_usd) if model.price_usd else None,
        body_type=model.body_type or "",
        drive=model.drive or "",
        condition=model.condition or "",
        color=model.color or "",
        cylinders=model.cylinders,
        passengers=model.passengers,
        consumption=model.consumption or "",
        notes=model.notes or "",
        added_at=model.added_at,
    )


class SQLAlchemyGarageVehicleRepository(GarageVehicleRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_user(self, user_id: str) -> list[GarageVehicle]:
        stmt = (
            select(UserGarageVehicleModel)
            .where(UserGarageVehicleModel.user_id == user_id)
            .order_by(UserGarageVehicleModel.added_at.desc())
        )
        result = await self._session.execute(stmt)
        return [_to_domain(m) for m in result.scalars().all()]

    async def get_by_id(self, vehicle_id: str, user_id: str) -> GarageVehicle | None:
        stmt = select(UserGarageVehicleModel).where(
            UserGarageVehicleModel.id == vehicle_id,
            UserGarageVehicleModel.user_id == user_id,
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _to_domain(model) if model else None

    async def add(self, vehicle: GarageVehicle) -> GarageVehicle:
        model = UserGarageVehicleModel(
            id=vehicle.id,
            user_id=vehicle.user_id,
            brand=vehicle.brand,
            model=vehicle.model,
            year=vehicle.year,
            engine=vehicle.engine or None,
            transmission=vehicle.transmission or None,
            fuel_type=vehicle.fuel_type or None,
            mileage_km=vehicle.mileage_km,
            price_usd=vehicle.price_usd,
            body_type=vehicle.body_type or None,
            drive=vehicle.drive or None,
            condition=vehicle.condition or None,
            color=vehicle.color or None,
            cylinders=vehicle.cylinders,
            passengers=vehicle.passengers,
            consumption=vehicle.consumption or None,
            notes=vehicle.notes or None,
            added_at=vehicle.added_at,
        )
        self._session.add(model)
        await self._session.flush()
        return _to_domain(model)

    async def delete(self, vehicle_id: str, user_id: str) -> bool:
        stmt = select(UserGarageVehicleModel).where(
            UserGarageVehicleModel.id == vehicle_id,
            UserGarageVehicleModel.user_id == user_id,
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            return False
        await self._session.delete(model)
        await self._session.flush()
        return True

    async def count_by_user(self, user_id: str) -> int:
        stmt = select(func.count()).select_from(UserGarageVehicleModel).where(
            UserGarageVehicleModel.user_id == user_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar() or 0
