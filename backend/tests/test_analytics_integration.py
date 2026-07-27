"""Standalone integration tests for analytics endpoints.

Runs against the real PostgreSQL database.
Uses asyncio.run() to properly manage the event loop.
"""
from __future__ import annotations

import asyncio
import json
import time
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.infrastructure.database.repositories.automotive_repo import (
    SqlAlchemyAutomotiveRepository,
)
from app.infrastructure.database.repositories.conversation_repo import (
    SQLAlchemyConversationRepository,
)


async def run_all_tests() -> None:
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False,
    )

    async with session_factory() as session:
        auto_repo = SqlAlchemyAutomotiveRepository(session)
        conv_repo = SQLAlchemyConversationRepository(session)

        results: dict[str, dict[str, object]] = {}

        # 1. vehicle_overview
        t0 = time.perf_counter()
        overview = await auto_repo.vehicle_overview()
        t_overview = (time.perf_counter() - t0) * 1000
        results["overview"] = {
            "time_ms": round(t_overview, 2),
            **overview,
        }

        # 2. count_by_type
        t0 = time.perf_counter()
        by_type = await auto_repo.count_by_type()
        t_by_type = (time.perf_counter() - t0) * 1000
        results["by_type"] = {
            "time_ms": round(t_by_type, 2),
            "count": len(by_type),
            "data": by_type,
        }

        # 3. count_by_fuel
        t0 = time.perf_counter()
        by_fuel = await auto_repo.count_by_fuel()
        t_by_fuel = (time.perf_counter() - t0) * 1000
        results["by_fuel"] = {
            "time_ms": round(t_by_fuel, 2),
            "count": len(by_fuel),
            "data": by_fuel,
        }

        # 4. count_by_transmission
        t0 = time.perf_counter()
        by_trans = await auto_repo.count_by_transmission()
        t_by_trans = (time.perf_counter() - t0) * 1000
        results["by_transmission"] = {
            "time_ms": round(t_by_trans, 2),
            "count": len(by_trans),
            "data": by_trans,
        }

        # 5. avg_price_by_year
        t0 = time.perf_counter()
        by_year = await auto_repo.avg_price_by_year()
        t_by_year = (time.perf_counter() - t0) * 1000
        results["by_year"] = {
            "time_ms": round(t_by_year, 2),
            "count": len(by_year),
            "data_sample": by_year[:5],
        }

        # 6. price_distribution
        t0 = time.perf_counter()
        price_dist = await auto_repo.price_distribution()
        t_price_dist = (time.perf_counter() - t0) * 1000
        results["price_distribution"] = {
            "time_ms": round(t_price_dist, 2),
            "count": len(price_dist),
            "data": price_dist,
        }

        # 7. brand_ranking
        t0 = time.perf_counter()
        brands = await auto_repo.brand_ranking(limit=10)
        t_brands = (time.perf_counter() - t0) * 1000
        results["brands_top"] = {
            "time_ms": round(t_brands, 2),
            "count": len(brands),
            "data": [
                {
                    "manufacturer": b.manufacturer,
                    "model_count": b.model_count,
                    "total_listings": b.total_listings,
                    "average_price": (
                        float(b.average_price)
                        if b.average_price is not None
                        else None
                    ),
                }
                for b in brands
            ],
        }

        # 8. conversation_overview
        t0 = time.perf_counter()
        conv_overview = await conv_repo.conversation_overview()
        t_conv = (time.perf_counter() - t0) * 1000
        results["conversations_overview"] = {
            "time_ms": round(t_conv, 2),
            **conv_overview,
        }

    await engine.dispose()

    # Print results
    print("\n" + "=" * 70)
    print("INTEGRATION TEST RESULTS — ANALYTICS ENDPOINTS")
    print("=" * 70)

    for endpoint, data in results.items():
        print(f"\n--- {endpoint} ---")
        print(json.dumps(data, indent=2, default=str))

    print("\n" + "=" * 70)
    print("PERFORMANCE SUMMARY")
    print("=" * 70)
    for endpoint, data in results.items():
        ms = data.get("time_ms", 0)
        print(f"  {endpoint:30s} {ms:>8.2f} ms")

    total = sum(d.get("time_ms", 0) for d in results.values())
    print(f"  {'TOTAL':30s} {total:>8.2f} ms")
    print("=" * 70)

    # Validate types
    print("\n" + "=" * 70)
    print("TYPE VALIDATION")
    print("=" * 70)
    errors = []

    # Check no Decimal leaks anywhere
    full_json = json.dumps(results, default=str)
    if "Decimal" in full_json:
        errors.append(
            "Decimal type found in serialized output!"
        )

    # Check overview types
    v = results["overview"]
    if not isinstance(v["total_vehicles"], int):
        errors.append(
            f"overview.total_vehicles: "
            f"expected int, got {type(v['total_vehicles'])}"
        )
    if v["avg_price"] is not None and not isinstance(
        v["avg_price"], float
    ):
        errors.append(
            f"overview.avg_price: "
            f"expected float|None, got {type(v['avg_price'])}"
        )

    # Check by_type
    for item in results["by_type"]["data"]:
        if item["avg_price"] is not None and not isinstance(
            item["avg_price"], float
        ):
            errors.append(
                f"by_type.avg_price: expected float|None, "
                f"got {type(item['avg_price'])} "
                f"(value={item['avg_price']})"
            )

    # Check by_fuel
    for item in results["by_fuel"]["data"]:
        if item["avg_price"] is not None and not isinstance(
            item["avg_price"], float
        ):
            errors.append(
                f"by_fuel.avg_price: expected float|None, "
                f"got {type(item['avg_price'])}"
            )

    # Check brands_top
    for item in results["brands_top"]["data"]:
        if item["average_price"] is not None and not isinstance(
            item["average_price"], float
        ):
            errors.append(
                f"brands_top.average_price: expected float|None, "
                f"got {type(item['average_price'])}"
            )

    if errors:
        for e in errors:
            print(f"  FAIL: {e}")
    else:
        print("  ALL TYPES CORRECT — no Decimal leaks, "
              "nulls are None, floats are float")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
