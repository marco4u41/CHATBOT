from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.api.schemas.automotive import (
    AutomotiveErrorResponse,
    AutomotiveHealthResponse,
    BrandDetailResponse,
    BrandListResponse,
    BrandResponse,
    ModelStatsResponse,
    VehicleDetailsResponse,
    VehicleMarketStatsResponse,
    VehicleResponse,
    VehicleSearchResponse,
)
from app.dependencies import get_automotive_repo
from app.domain.interfaces.repository import AutomotiveRepository
from app.domain.models.automotive import BrandSummary, VehicleMarketSummary, VehicleSummary

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Automotive Data"])

_CURRENT_YEAR = datetime.now().year


def _vehicle_to_response(v: VehicleSummary) -> VehicleResponse:
    return VehicleResponse(
        vehicle_id=v.vehicle_id,
        vehicle_name=v.vehicle_name,
        manufacturer=v.manufacturer,
        model=v.model,
        year=v.year,
        listing_count=v.listing_count,
        price_mean=v.price_mean,
        price_median=v.price_median,
        price_min=v.price_min,
        price_max=v.price_max,
        odometer_mean=v.odometer_mean,
        odometer_median=v.odometer_median,
        fuel=v.fuel,
        transmission=v.transmission,
        condition=v.condition,
        cylinders=v.cylinders,
        drive=v.drive,
        vehicle_type=v.vehicle_type,
        size=v.size,
        paint_color=v.paint_color,
        states_count=v.states_count,
        first_posting_date=v.first_posting_date,
        last_posting_date=v.last_posting_date,
        price_range=v.price_range,
        market_confidence=v.market_confidence,
    )


def _brand_to_response(b: BrandSummary) -> BrandResponse:
    return BrandResponse(
        brand_id=b.brand_id,
        manufacturer=b.manufacturer,
        model_count=b.model_count,
        year_count=b.year_count,
        total_listings=b.total_listings,
        average_price=b.average_price,
    )


def _market_stats_to_response(s: VehicleMarketSummary) -> VehicleMarketStatsResponse:
    return VehicleMarketStatsResponse(
        id=s.id,
        manufacturer=s.manufacturer,
        model=s.model,
        years_available=s.years_available,
        oldest_year=s.oldest_year,
        newest_year=s.newest_year,
        total_listings=s.total_listings,
        overall_price_mean=s.overall_price_mean,
        overall_price_median=s.overall_price_median,
        overall_odometer_mean=s.overall_odometer_mean,
        fuel=s.fuel,
        transmission=s.transmission,
        drive=s.drive,
        vehicle_type=s.vehicle_type,
    )


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get(
    "/health",
    response_model=AutomotiveHealthResponse,
    summary="Automotive database health check",
    description=(
        "Verifies connectivity to the automotive dataset in autoexpert_db. "
        "Prices are historical statistics, not real-time market listings."
    ),
    responses={
        503: {"model": AutomotiveErrorResponse, "description": "Database unavailable"},
    },
)
async def health(
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> AutomotiveHealthResponse | JSONResponse:
    try:
        available = await repo.health_check()
        return AutomotiveHealthResponse(
            success=True,
            database="autoexpert_db",
            automotive_data_available=available,
        )
    except Exception:
        logger.exception("Automotive health check failed")
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Database unavailable",
                "detail": "Could not connect to the automotive database.",
            },
        )


# ---------------------------------------------------------------------------
# Search vehicles
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/search",
    response_model=VehicleSearchResponse,
    summary="Search vehicles by filters",
    description=(
        "Search across the vehicles_master table. Results are aggregated "
        "statistics from historical listings, not real-time ads. "
        "All parameters are optional; omitting all returns a default page."
    ),
    responses={
        422: {"model": AutomotiveErrorResponse, "description": "Validation error"},
        503: {"model": AutomotiveErrorResponse, "description": "Database unavailable"},
    },
)
async def search_vehicles(
    manufacturer: str | None = Query(
        None, max_length=100, description="Manufacturer name (e.g. Toyota, Acura)",
    ),
    model: str | None = Query(
        None, max_length=100, description="Model name, partial match supported",
    ),
    year: int | None = Query(
        None, ge=1886, le=_CURRENT_YEAR + 1,
        description="Vehicle year",
    ),
    min_price: float | None = Query(
        None, ge=0, description="Minimum price in USD",
    ),
    max_price: float | None = Query(
        None, ge=0, description="Maximum price in USD",
    ),
    fuel: str | None = Query(
        None, max_length=50, description="Fuel type (e.g. gasoline, diesel, electric)",
    ),
    transmission: str | None = Query(
        None, max_length=50, description="Transmission type",
    ),
    vehicle_type: str | None = Query(
        None, max_length=50, description="Vehicle type (e.g. sedan, SUV, truck)",
    ),
    limit: int = Query(10, ge=1, le=50, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> VehicleSearchResponse | JSONResponse:
    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": "Validation error",
                "detail": (
                    f"min_price ({min_price}) cannot be greater than "
                    f"max_price ({max_price})."
                ),
            },
        )

    try:
        vehicles = await repo.search_vehicles(
            manufacturer=manufacturer,
            model=model,
            year=year,
            min_price=min_price,
            max_price=max_price,
            fuel=fuel,
            transmission=transmission,
            vehicle_type=vehicle_type,
            limit=limit,
            offset=offset,
        )
    except Exception:
        logger.exception("Vehicle search failed")
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Database unavailable",
                "detail": "Could not query vehicle data.",
            },
        )

    logger.info(
        "Vehicle search: mfg=%s model=%s year=%s results=%d",
        manufacturer or "*",
        model or "*",
        year or "*",
        len(vehicles),
    )

    return VehicleSearchResponse(
        count=len(vehicles),
        limit=limit,
        offset=offset,
        data=[_vehicle_to_response(v) for v in vehicles],
    )


# ---------------------------------------------------------------------------
# Vehicle details
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/details",
    response_model=VehicleDetailsResponse,
    summary="Get vehicle details by manufacturer and model",
    description=(
        "Returns all year variants for a specific manufacturer + model pair. "
        "Optionally filter by a specific year."
    ),
    responses={
        404: {"model": AutomotiveErrorResponse, "description": "Vehicle not found"},
        422: {"model": AutomotiveErrorResponse, "description": "Validation error"},
        503: {"model": AutomotiveErrorResponse, "description": "Database unavailable"},
    },
)
async def get_vehicle_details(
    manufacturer: str = Query(
        ..., min_length=1, max_length=100, description="Manufacturer name",
    ),
    model: str = Query(
        ..., min_length=1, max_length=100, description="Model name",
    ),
    year: int | None = Query(
        None, ge=1886, le=_CURRENT_YEAR + 1, description="Filter by specific year",
    ),
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> VehicleDetailsResponse | JSONResponse:
    try:
        details = await repo.get_vehicle_details(manufacturer, model, year)
    except Exception:
        logger.exception("Vehicle details query failed")
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Database unavailable",
                "detail": "Could not query vehicle details.",
            },
        )

    if not details:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": "Not found",
                "detail": (
                    f"No vehicles found for {manufacturer} {model}"
                    f"{f' year {year}' if year else ''}."
                ),
            },
        )

    return VehicleDetailsResponse(
        manufacturer=manufacturer,
        model=model,
        year=year,
        count=len(details),
        data=[_vehicle_to_response(v) for v in details],
    )


# ---------------------------------------------------------------------------
# Model market stats
# ---------------------------------------------------------------------------

@router.get(
    "/models/stats",
    response_model=ModelStatsResponse,
    summary="Get market statistics for a model",
    description=(
        "Aggregated market statistics from vehicle_market_stats for a "
        "specific manufacturer + model. Includes pricing, years, and "
        "drivetrain information."
    ),
    responses={
        404: {"model": AutomotiveErrorResponse, "description": "Model not found"},
        503: {"model": AutomotiveErrorResponse, "description": "Database unavailable"},
    },
)
async def get_model_stats(
    manufacturer: str = Query(
        ..., min_length=1, max_length=100, description="Manufacturer name",
    ),
    model: str = Query(
        ..., min_length=1, max_length=100, description="Model name",
    ),
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> ModelStatsResponse | JSONResponse:
    try:
        stats = await repo.get_model_stats(manufacturer, model)
    except Exception:
        logger.exception("Model stats query failed")
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Database unavailable",
                "detail": "Could not query model statistics.",
            },
        )

    if stats is None:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": "Not found",
                "detail": f"No market stats found for {manufacturer} {model}.",
            },
        )

    return ModelStatsResponse(data=_market_stats_to_response(stats))


# ---------------------------------------------------------------------------
# Brand detail
# ---------------------------------------------------------------------------

@router.get(
    "/brands/{manufacturer}",
    response_model=BrandDetailResponse,
    summary="Get brand statistics",
    description=(
        "Returns aggregate statistics for a specific manufacturer from the "
        "brands table, including model count, total listings, and average price."
    ),
    responses={
        404: {"model": AutomotiveErrorResponse, "description": "Brand not found"},
        503: {"model": AutomotiveErrorResponse, "description": "Database unavailable"},
    },
)
async def get_brand(
    manufacturer: str,
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> BrandDetailResponse | JSONResponse:
    try:
        brand = await repo.get_brand_stats(manufacturer)
    except Exception:
        logger.exception("Brand stats query failed for %s", manufacturer)
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Database unavailable",
                "detail": "Could not query brand statistics.",
            },
        )

    if brand is None:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": "Not found",
                "detail": f"Brand '{manufacturer}' not found.",
            },
        )

    return BrandDetailResponse(data=_brand_to_response(brand))


# ---------------------------------------------------------------------------
# Brand list
# ---------------------------------------------------------------------------

@router.get(
    "/brands",
    response_model=BrandListResponse,
    summary="List all brands",
    description=(
        "Returns a paginated list of brands with aggregate statistics. "
        "The count field represents the number of brands returned in "
        "the current page."
    ),
    responses={
        503: {"model": AutomotiveErrorResponse, "description": "Database unavailable"},
    },
)
async def list_brands(
    limit: int = Query(50, ge=1, le=100, description="Max results per page"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    repo: AutomotiveRepository = Depends(get_automotive_repo),
) -> BrandListResponse | JSONResponse:
    try:
        brands = await repo.list_brands(limit=limit, offset=offset)
    except Exception:
        logger.exception("Brand list query failed")
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Database unavailable",
                "detail": "Could not query brand list.",
            },
        )

    return BrandListResponse(
        count=len(brands),
        limit=limit,
        offset=offset,
        data=[_brand_to_response(b) for b in brands],
    )
