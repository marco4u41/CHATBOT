"""Read-only audit of automotive tables in autoexpert_db.

Usage:
    cd backend
    python scripts/inspect_automotive_schema.py

This script:
- Connects to PostgreSQL using project config from .env
- Inspects schema, constraints, indexes for 3 automotive tables
- Shows up to 3 sample rows per table
- Prints row counts
- Does NOT modify any data or structure
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect as sa_inspect, text
from app.infrastructure.database.connection import engine
from app.config import settings

TARGET_TABLES = ["vehicles_master", "vehicle_market_stats", "brands"]
SAMPLE_LIMIT = 3
DIVIDER = "=" * 72


async def audit_table(conn, table_name: str) -> dict:
    info = {"name": table_name, "columns": [], "pk": [], "fk": [],
            "indexes": [], "samples": [], "row_count": 0, "error": None}
    try:
        columns = await conn.run_sync(lambda c: sa_inspect(c).get_columns(table_name))
        info["columns"] = [
            {
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": col.get("nullable", True),
                "default": str(col.get("default", "")) if col.get("default") else None,
            }
            for col in columns
        ]

        pk_info = await conn.run_sync(lambda c: sa_inspect(c).get_pk_constraint(table_name))
        info["pk"] = pk_info.get("constrained_columns", [])

        fk_info = await conn.run_sync(lambda c: sa_inspect(c).get_foreign_keys(table_name))
        info["fk"] = [
            {
                "constrained_columns": fk.get("constrained_columns", []),
                "referred_table": fk.get("referred_table", ""),
                "referred_columns": fk.get("referred_columns", []),
            }
            for fk in fk_info
        ]

        idx_info = await conn.run_sync(lambda c: sa_inspect(c).get_indexes(table_name))
        info["indexes"] = [
            {
                "name": idx.get("name", ""),
                "columns": idx.get("column_names", []),
                "unique": idx.get("unique", False),
            }
            for idx in idx_info
        ]

        count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        info["row_count"] = count_result.scalar()

        if info["row_count"] > 0:
            sample_result = await conn.execute(
                text(f"SELECT * FROM {table_name} LIMIT {SAMPLE_LIMIT}")
            )
            rows = sample_result.mappings().all()
            info["samples"] = [dict(row) for row in rows]
    except Exception as e:
        info["error"] = str(e)
    return info


def print_column_table(columns):
    if not columns:
        print("  (no columns)")
        return
    header = f"  {'Column':<35} {'Type':<30} {'Nullable':<10} {'Default'}"
    print(header)
    print("  " + "-" * (len(header) - 2))
    for col in columns:
        nullable = "YES" if col["nullable"] else "NO"
        default = col["default"] or "-"
        print(f"  {col['name']:<35} {col['type']:<30} {nullable:<10} {default}")


def print_sample_rows(samples, columns):
    if not samples:
        print("  (no data)")
        return
    col_names = [c["name"] for c in columns]
    max_label = max(len(c) for c in col_names) if col_names else 20
    for i, row in enumerate(samples, 1):
        print(f"\n  Row {i}:")
        for col_name in col_names:
            value = row.get(col_name, "N/A")
            value_str = str(value)
            if len(value_str) > 80:
                value_str = value_str[:77] + "..."
            print(f"    {col_name:<{max_label}} = {value_str}")


async def main():
    print(DIVIDER)
    print("  AUTOMOTIVE TABLES AUDIT - autoexpert_db")
    print(DIVIDER)

    host = settings.postgres_host or "localhost"
    port = settings.postgres_port
    user = settings.postgres_user or "postgres"
    db_name = settings.postgres_db or "autoexpert_db"
    print(f"\n  Connected as: {user}@{host}:{port}/{db_name}")
    print(f"  (password masked)\n")

    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                text("SELECT tablename FROM pg_catalog.pg_tables "
                     "WHERE schemaname = 'public' ORDER BY tablename")
            )
            all_tables = [row[0] for row in result.fetchall()]
            print(f"  All tables in 'public' schema: {all_tables}\n")

            for table_name in TARGET_TABLES:
                print(DIVIDER)
                print(f"  TABLE: {table_name}")
                print(DIVIDER)

                info = await audit_table(conn, table_name)

                if info["error"]:
                    print(f"\n  ERROR: {info['error']}\n")
                    continue

                print(f"\n  Row count: {info['row_count']:,}")
                print(f"  Primary key: {info['pk'] or '(none)'}")

                if info["fk"]:
                    print("  Foreign keys:")
                    for fk in info["fk"]:
                        cols = ", ".join(fk["constrained_columns"])
                        ref = f"{fk['referred_table']}({', '.join(fk['referred_columns'])})"
                        print(f"    {cols} -> {ref}")
                else:
                    print("  Foreign keys: (none)")

                if info["indexes"]:
                    print("  Indexes:")
                    for idx in info["indexes"]:
                        unique = " [UNIQUE]" if idx["unique"] else ""
                        print(f"    {idx['name']}: ({', '.join(idx['columns'])}){unique}")
                else:
                    print("  Indexes: (none)")

                print(f"\n  Columns ({len(info['columns'])}):")
                print_column_table(info["columns"])

                if info["samples"]:
                    print(f"\n  Sample data (up to {SAMPLE_LIMIT} rows):")
                    print_sample_rows(info["samples"], info["columns"])
                else:
                    print("\n  (table is empty)")

                print()

            print(DIVIDER)
            print("  SUMMARY")
            print(DIVIDER)
            for table_name in TARGET_TABLES:
                count_r = await conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                row_count = count_r.scalar()
                columns = await conn.run_sync(lambda c: sa_inspect(c).get_columns(table_name))
                col_names = [c["name"] for c in columns]
                pk = await conn.run_sync(lambda c: sa_inspect(c).get_pk_constraint(table_name))
                pk_cols = pk.get("constrained_columns", [])
                print(f"  {table_name}: {row_count:,} rows | {len(col_names)} columns | PK: {pk_cols}")

            print(f"\n  Audit complete. No data was modified.")
            print(DIVIDER)

    except Exception as e:
        print(f"\n  CONNECTION ERROR: {e}")
        print(f"  Make sure PostgreSQL is running on {host}:{port}")
        print(f"  and database '{db_name}' exists.\n")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
