from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.api.schemas.analytics import (
    AnalyticsErrorResponse,
    AnalyticsOverviewResponse,
    BrandRankingItemResponse,
    BrandRankingResponse,
    ConversationOverviewResponse,
    VehicleFuelDistributionResponse,
    VehicleOverviewResponse,
    VehiclePriceDistributionResponse,
    VehicleTransmissionDistributionResponse,
    VehicleTypeDistributionResponse,
    VehicleYearStatsResponse,
)
from app.dependencies import get_automotive_repo, get_conversation_repo
from app.domain.interfaces.repository import (
    AutomotiveRepository,
    ConversationRepository,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analytics"])


def _error_503(detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={
            "success": False,
            "error": "Database unavailable",
            "detail": detail,
        },
    )


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------

@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="General analytics overview",
    description=(
        "Returns vehicle catalog overview and "
        "conversation statistics combined."
    ),
    responses={
        503: {
            "model": AnalyticsErrorResponse,
            "description": "Database unavailable",
        },
    },
)
async def analytics_overview(
    automotive_repo: AutomotiveRepository = Depends(
        get_automotive_repo,
    ),
    conversation_repo: ConversationRepository = Depends(
        get_conversation_repo,
    ),
) -> AnalyticsOverviewResponse | JSONResponse:
    try:
        v = await automotive_repo.vehicle_overview()
        c = await conversation_repo.conversation_overview()
    except Exception:
        logger.exception("Analytics overview failed")
        return _error_503("Could not compute analytics overview.")

    return AnalyticsOverviewResponse(
        vehicles=VehicleOverviewResponse(
            total_vehicles=v["total_vehicles"],
            avg_price=v["avg_price"],
            total_brands=v["total_brands"],
            total_models=v["total_models"],
        ),
        conversations=ConversationOverviewResponse(
            total_conversations=c["total_conversations"],
            total_messages=c["total_messages"],
            avg_messages_per_conversation=c["avg_messages_per_conversation"],
        ),
    )


# ---------------------------------------------------------------------------
# Vehicles by Type
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/by-type",
    response_model=VehicleTypeDistributionResponse,
    summary="Vehicle distribution by type",
    description=(
        "Returns count and average price grouped by vehicle type."
    ),
    responses={
        503: {
            "model": AnalyticsErrorResponse,
            "description": "Database unavailable",
        },
    },
)
async def vehicles_by_type(
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> VehicleTypeDistributionResponse | JSONResponse:
    try:
        data = await repo.count_by_type()
    except Exception:
        logger.exception("vehicles_by_type failed")
        return _error_503("Could not query vehicle types.")
    return VehicleTypeDistributionResponse(
        count=len(data),
        data=data,
    )


# ---------------------------------------------------------------------------
# Vehicles by Fuel
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/by-fuel",
    response_model=VehicleFuelDistributionResponse,
    summary="Vehicle distribution by fuel type",
    description=(
        "Returns count and average price grouped by fuel type."
    ),
    responses={
        503: {
            "model": AnalyticsErrorResponse,
            "description": "Database unavailable",
        },
    },
)
async def vehicles_by_fuel(
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> VehicleFuelDistributionResponse | JSONResponse:
    try:
        data = await repo.count_by_fuel()
    except Exception:
        logger.exception("vehicles_by_fuel failed")
        return _error_503("Could not query fuel distribution.")
    return VehicleFuelDistributionResponse(
        count=len(data),
        data=data,
    )


# ---------------------------------------------------------------------------
# Vehicles by Transmission
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/by-transmission",
    response_model=VehicleTransmissionDistributionResponse,
    summary="Vehicle distribution by transmission",
    description="Returns count grouped by transmission type.",
    responses={
        503: {
            "model": AnalyticsErrorResponse,
            "description": "Database unavailable",
        },
    },
)
async def vehicles_by_transmission(
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> VehicleTransmissionDistributionResponse | JSONResponse:
    try:
        data = await repo.count_by_transmission()
    except Exception:
        logger.exception("vehicles_by_transmission failed")
        return _error_503(
            "Could not query transmission distribution.",
        )
    return VehicleTransmissionDistributionResponse(
        count=len(data),
        data=data,
    )


# ---------------------------------------------------------------------------
# Vehicles by Year
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/by-year",
    response_model=VehicleYearStatsResponse,
    summary="Vehicle stats by year",
    description=(
        "Returns count and average price grouped by "
        "manufacturing year."
    ),
    responses={
        503: {
            "model": AnalyticsErrorResponse,
            "description": "Database unavailable",
        },
    },
)
async def vehicles_by_year(
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> VehicleYearStatsResponse | JSONResponse:
    try:
        data = await repo.avg_price_by_year()
    except Exception:
        logger.exception("vehicles_by_year failed")
        return _error_503("Could not query year stats.")
    return VehicleYearStatsResponse(
        count=len(data),
        data=data,
    )


# ---------------------------------------------------------------------------
# Price Distribution
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/price-distribution",
    response_model=VehiclePriceDistributionResponse,
    summary="Vehicle price distribution",
    description=(
        "Returns count of vehicles in predefined price ranges."
    ),
    responses={
        503: {
            "model": AnalyticsErrorResponse,
            "description": "Database unavailable",
        },
    },
)
async def vehicles_price_distribution(
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> VehiclePriceDistributionResponse | JSONResponse:
    try:
        data = await repo.price_distribution()
    except Exception:
        logger.exception("vehicles_price_distribution failed")
        return _error_503(
            "Could not query price distribution.",
        )
    return VehiclePriceDistributionResponse(
        count=len(data),
        data=data,
    )


# ---------------------------------------------------------------------------
# Top Brands
# ---------------------------------------------------------------------------

@router.get(
    "/brands/top",
    response_model=BrandRankingResponse,
    summary="Top brands by listing count",
    description=(
        "Returns top brands ranked by total listings. "
        "Limit between 1 and 50, default 10."
    ),
    responses={
        503: {
            "model": AnalyticsErrorResponse,
            "description": "Database unavailable",
        },
    },
)
async def brands_top(
    limit: int = Query(
        10,
        ge=1,
        le=50,
        description="Number of top brands to return",
    ),
    repo: AutomotiveRepository = Depends(
        get_automotive_repo,
    ),
) -> BrandRankingResponse | JSONResponse:
    try:
        data = await repo.brand_ranking(limit=limit)
    except Exception:
        logger.exception("brands_top failed")
        return _error_503("Could not query brand ranking.")
    return BrandRankingResponse(
        count=len(data),
        limit=limit,
        data=[
            BrandRankingItemResponse(
                brand_id=b.brand_id,
                manufacturer=b.manufacturer,
                model_count=b.model_count,
                year_count=b.year_count,
                total_listings=b.total_listings,
                average_price=b.average_price,
            )
            for b in data
        ],
    )


# ---------------------------------------------------------------------------
# Conversations Overview
# ---------------------------------------------------------------------------

@router.get(
    "/conversations/overview",
    response_model=ConversationOverviewResponse,
    summary="Conversation statistics",
    description=(
        "Returns total conversations, total messages, "
        "and average messages per conversation."
    ),
    responses={
        503: {
            "model": AnalyticsErrorResponse,
            "description": "Database unavailable",
        },
    },
)
async def conversations_overview(
    repo: ConversationRepository = Depends(
        get_conversation_repo,
    ),
) -> ConversationOverviewResponse | JSONResponse:
    try:
        overview = await repo.conversation_overview()
    except Exception:
        logger.exception("conversations_overview failed")
        return _error_503(
            "Could not query conversation stats.",
        )
    return ConversationOverviewResponse(
        total_conversations=overview["total_conversations"],
        total_messages=overview["total_messages"],
        avg_messages_per_conversation=overview["avg_messages_per_conversation"],
    )
