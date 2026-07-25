"""Manual validation script for automotive API endpoints.

Starts the server and makes HTTP requests. Requires uvicorn and httpx.
Run: python scripts/validate_automotive_api.py
"""
from __future__ import annotations

import subprocess
import sys
import time

import httpx

BASE = "http://127.0.0.1:8000"
TIMEOUT = 10.0


def check(label: str, resp: httpx.Response) -> dict:
    print(f"[{resp.status_code}] {label}")
    body = resp.json()
    return body


def main() -> None:
    # Start server in background
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(3)

    try:
        with httpx.Client(base_url=BASE, timeout=TIMEOUT) as client:
            print("=" * 60)
            print("MANUAL VALIDATION - Automotive API Endpoints")
            print("=" * 60)

            # 1. Health
            r = client.get("/api/automotive/health")
            body = check("GET /api/automotive/health", r)
            print(f"  database={body['database']}, available={body['automotive_data_available']}")
            print()

            # 2. Search without filters
            r = client.get("/api/automotive/vehicles/search", params={"limit": 3})
            body = check("GET /api/automotive/vehicles/search (no filters)", r)
            print(f"  count={body['count']}, data_len={len(body['data'])}")
            print()

            # 3. Search with manufacturer+model
            r = client.get(
                "/api/automotive/vehicles/search",
                params={"manufacturer": "Acura", "model": "3.0cl", "limit": 10},
            )
            body = check("GET /api/automotive/vehicles/search?manufacturer=Acura&model=3.0cl", r)
            print(f"  count={body['count']}")
            if body["data"]:
                v = body["data"][0]
                print(f"  first: {v['vehicle_name']} year={v['year']} price_mean={v['price_mean']}")
            print()

            # 4. Vehicle details
            r = client.get(
                "/api/automotive/vehicles/details",
                params={"manufacturer": "Acura", "model": "3.0cl"},
            )
            body = check("GET /api/automotive/vehicles/details?manufacturer=Acura&model=3.0cl", r)
            years = sorted({v["year"] for v in body["data"]})
            print(f"  count={body['count']}, years={years}")
            print()

            # 5. Model stats
            r = client.get(
                "/api/automotive/models/stats",
                params={"manufacturer": "Acura", "model": "3.0cl"},
            )
            body = check("GET /api/automotive/models/stats?manufacturer=Acura&model=3.0cl", r)
            if r.status_code == 200:
                d = body["data"]
                print(f"  {d['manufacturer']} {d['model']}: {d['total_listings']} listings, avg=${d['overall_price_mean']:,.0f}")
            print()

            # 6. Brand detail
            r = client.get("/api/automotive/brands/Acura")
            body = check("GET /api/automotive/brands/Acura", r)
            if r.status_code == 200:
                d = body["data"]
                print(f"  {d['manufacturer']}: {d['model_count']} models, {d['total_listings']} listings, avg=${d['average_price']:,.0f}")
            print()

            # 7. Brand list
            r = client.get("/api/automotive/brands", params={"limit": 5})
            body = check("GET /api/automotive/brands?limit=5", r)
            print(f"  count={body['count']}")
            for b in body["data"]:
                print(f"    {b['manufacturer']}: {b['model_count']} models, {b['total_listings']} listings")
            print()

            # 8. Error handling
            print("--- Error handling ---")
            r = client.get("/api/automotive/brands/NonexistentBrand999")
            check("GET /api/automotive/brands/NonexistentBrand999 (404)", r)

            r = client.get(
                "/api/automotive/vehicles/search",
                params={"min_price": 50000, "max_price": 10000},
            )
            check("GET /api/automotive/vehicles/search?min_price=50000&max_price=10000 (422)", r)

            r = client.get("/api/automotive/vehicles/search", params={"limit": 0})
            check("GET /api/automotive/vehicles/search?limit=0 (422)", r)

            r = client.get("/api/automotive/vehicles/search", params={"offset": -1})
            check("GET /api/automotive/vehicles/search?offset=-1 (422)", r)

            r = client.get(
                "/api/automotive/vehicles/details",
                params={"manufacturer": "Zzzz", "model": "Nonexistent"},
            )
            check("GET /api/automotive/vehicles/details?manufacturer=Zzzz&model=Nonexistent (404)", r)

            print()
            print("=" * 60)
            print("VALIDATION COMPLETE")
            print("=" * 60)

    finally:
        proc.terminate()
        proc.wait(timeout=5)


if __name__ == "__main__":
    main()
