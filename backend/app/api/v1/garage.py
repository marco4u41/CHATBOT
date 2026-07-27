"""Garage endpoints — CRUD for user vehicle garage."""

from __future__ import annotations

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.garage import (
    GarageActionResponse,
    GarageListResponse,
    GarageVehicleCreateRequest,
    GarageVehicleCreateResponse,
    GarageVehicleResponse,
)
from app.api.v1.auth import get_current_user
from app.config import settings
from app.domain.interfaces.repository import GarageVehicleRepository
from app.domain.models.garage_vehicle import GarageVehicle
from app.domain.models.user import User
from app.infrastructure.database.connection import get_async_session
from app.infrastructure.database.repositories.garage_vehicle_repo import (
    SQLAlchemyGarageVehicleRepository,
)

logger = logging.getLogger(__name__)

router = APIRouter()

_GARAGE_MAX_ITEMS = 10


def _get_garage_repo(
    session: AsyncSession = Depends(get_async_session),
) -> GarageVehicleRepository:
    return SQLAlchemyGarageVehicleRepository(session)


def _vehicle_to_response(v: GarageVehicle) -> GarageVehicleResponse:
    return GarageVehicleResponse(
        id=v.id,
        brand=v.brand,
        model=v.model,
        year=v.year,
        engine=v.engine,
        transmission=v.transmission,
        fuel_type=v.fuel_type,
        mileage_km=v.mileage_km,
        price_usd=v.price_usd,
        body_type=v.body_type,
        drive=v.drive,
        condition=v.condition,
        color=v.color,
        cylinders=v.cylinders,
        passengers=v.passengers,
        consumption=v.consumption,
        notes=v.notes,
        added_at=v.added_at.isoformat(),
    )


@router.get("/users/me/garage", response_model=GarageListResponse)
async def list_garage(
    user: User = Depends(get_current_user),
    repo: GarageVehicleRepository = Depends(_get_garage_repo),
):
    vehicles = await repo.get_by_user(user.id)
    return GarageListResponse(
        success=True,
        data=[_vehicle_to_response(v) for v in vehicles],
    )


@router.post("/users/me/garage", response_model=GarageVehicleCreateResponse)
async def add_to_garage(
    request: GarageVehicleCreateRequest,
    user: User = Depends(get_current_user),
    repo: GarageVehicleRepository = Depends(_get_garage_repo),
):
    count = await repo.count_by_user(user.id)
    if count >= _GARAGE_MAX_ITEMS:
        raise HTTPException(
            status_code=400,
            detail=f"Garage lleno. Máximo {_GARAGE_MAX_ITEMS} vehículos.",
        )

    vehicle = GarageVehicle(
        id=secrets.token_hex(16),
        user_id=user.id,
        brand=request.brand,
        model=request.model,
        year=request.year,
        engine=request.engine,
        transmission=request.transmission,
        fuel_type=request.fuel_type,
        mileage_km=request.mileage_km,
        price_usd=request.price_usd,
        body_type=request.body_type,
        drive=request.drive,
        condition=request.condition,
        color=request.color,
        cylinders=request.cylinders,
        passengers=request.passengers,
        consumption=request.consumption,
        notes=request.notes,
    )

    created = await repo.add(vehicle)
    logger.info("Vehicle added to garage: %s %s %s by user %s", request.brand, request.model, request.year, user.id)
    return GarageVehicleCreateResponse(
        success=True,
        data=_vehicle_to_response(created),
    )


@router.delete("/users/me/garage/{vehicle_id}", response_model=GarageActionResponse)
async def remove_from_garage(
    vehicle_id: str,
    user: User = Depends(get_current_user),
    repo: GarageVehicleRepository = Depends(_get_garage_repo),
):
    deleted = await repo.delete(vehicle_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado en tu garage.")
    return GarageActionResponse(success=True)
