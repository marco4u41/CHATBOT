from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.domain.agent.automotive_tool import AutomotiveAgentTool, VehicleDataBlock

if TYPE_CHECKING:
    from app.domain.interfaces.repository import AutomotiveRepository

logger = logging.getLogger(__name__)


def _fmt_price(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"${value:,.0f}"


def _fmt_odometer(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"{value:,.0f} mi"


class SqlAlchemyAutomotiveAgentTool(AutomotiveAgentTool):
    """Implementation of AutomotiveAgentTool backed by AutomotiveRepository."""

    def __init__(self, repo: AutomotiveRepository) -> None:
        self._repo = repo

    async def search_vehicles(
        self,
        manufacturer: str | None = None,
        model: str | None = None,
        year: int | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        fuel: str | None = None,
        vehicle_type: str | None = None,
        limit: int = 5,
    ) -> VehicleDataBlock | None:
        vehicles = await self._repo.search_vehicles(
            manufacturer=manufacturer,
            model=model,
            year=year,
            min_price=min_price,
            max_price=max_price,
            fuel=fuel,
            vehicle_type=vehicle_type,
            limit=limit,
        )
        if not vehicles:
            return None

        lines = ["[VEHICLE_SEARCH_RESULTS]"]
        lines.append(f"FUENTE: Datos confirmados en la base de datos")
        lines.append(f"Resultados: {len(vehicles)} vehículo(s) encontrado(s)")
        if manufacturer:
            lines.append(f"Filtro de marca aplicado: {manufacturer}")
        lines.append("")

        for i, v in enumerate(vehicles, 1):
            lines.append(f"--- Vehículo {i} ---")
            lines.append(f"Nombre: {v.vehicle_name}")
            lines.append(f"Marca: {v.manufacturer} | Modelo: {v.model} | Año: {v.year}")
            lines.append(f"Tipo: {v.vehicle_type or 'N/A'} | Combustible: {v.fuel or 'N/A'}")
            lines.append(f"Transmisión: {v.transmission or 'N/A'} | Drive: {v.drive or 'N/A'}")
            lines.append(f"Condiciones: {v.condition or 'N/A'}")
            lines.append(f"Listados: {v.listing_count or 'N/A'}")
            median = _fmt_price(v.price_median)
            mean = _fmt_price(v.price_mean)
            lines.append(f"Precio medio: {median} | Promedio: {mean}")
            lines.append(f"Precio rango: {_fmt_price(v.price_min)} - {_fmt_price(v.price_max)}")
            lines.append(f"Odómetro medio: {_fmt_odometer(v.odometer_mean)}")
            if v.price_range:
                lines.append(f"Rango de precio: {v.price_range}")
            lines.append("")

        return VehicleDataBlock(
            title=f"Resultados de búsqueda: {len(vehicles)} vehículo(s)",
            content="\n".join(lines),
        )

    async def get_vehicle_details(
        self,
        manufacturer: str,
        model: str,
        year: int | None = None,
    ) -> VehicleDataBlock | None:
        details = await self._repo.get_vehicle_details(manufacturer, model, year)
        if not details:
            return None

        lines = ["[VEHICLE_DETAILS]"]
        lines.append(f"FUENTE: Datos confirmados en la base de datos")
        lines.append(f"Marca: {manufacturer} | Modelo: {model}")
        if year:
            lines.append(f"Año filtrado: {year}")
        lines.append("")

        years_available = sorted({d.year for d in details}, reverse=True)
        lines.append(f"Años disponibles: {', '.join(str(y) for y in years_available)}")
        lines.append(f"Total de variantes: {len(details)}")
        lines.append("")

        for v in details:
            lines.append(f"--- {v.year} ---")
            lines.append(f"Nombre: {v.vehicle_name}")
            lines.append(f"Listados: {v.listing_count or 'N/A'}")
            mean = _fmt_price(v.price_mean)
            median = _fmt_price(v.price_median)
            lines.append(f"Precio medio: {mean} | Mediana: {median}")
            lines.append(f"Rango: {_fmt_price(v.price_min)} - {_fmt_price(v.price_max)}")
            lines.append(f"Odómetro medio: {_fmt_odometer(v.odometer_mean)}")
            fuel = v.fuel or "N/A"
            trans = v.transmission or "N/A"
            lines.append(f"Combustible: {fuel} | Transmisión: {trans}")
            lines.append(f"Cilindros: {v.cylinders or 'N/A'} | Drive: {v.drive or 'N/A'}")
            lines.append(f"Condición: {v.condition or 'N/A'} | Color: {v.paint_color or 'N/A'}")
            lines.append(f"Estados con listados: {v.states_count or 'N/A'}")
            if v.market_confidence:
                lines.append(f"Confianza de mercado: {v.market_confidence}")
            lines.append("")

        return VehicleDataBlock(
            title=f"Detalles de {manufacturer} {model}",
            content="\n".join(lines),
        )

    async def get_brand_info(
        self,
        manufacturer: str,
    ) -> VehicleDataBlock | None:
        brand = await self._repo.get_brand_stats(manufacturer)
        if brand is None:
            return None

        lines = ["[BRAND_INFO]"]
        lines.append(f"Marca: {brand.manufacturer}")
        lines.append(f"Modelos distintos: {brand.model_count or 'N/A'}")
        lines.append(f"Años distintos: {brand.year_count or 'N/A'}")
        lines.append(f"Total de listados: {brand.total_listings or 'N/A'}")
        lines.append(f"Precio promedio: {_fmt_price(brand.average_price)}")

        return VehicleDataBlock(
            title=f"Información de marca: {brand.manufacturer}",
            content="\n".join(lines),
        )

    async def get_model_info(
        self,
        manufacturer: str,
        model: str,
    ) -> VehicleDataBlock | None:
        stats = await self._repo.get_model_stats(manufacturer, model)
        if stats is None:
            return None

        lines = ["[MODEL_INFO]"]
        lines.append(f"Marca: {stats.manufacturer} | Modelo: {stats.model}")
        lines.append(f"Años disponibles: {stats.years_available or 'N/A'}")
        if stats.oldest_year and stats.newest_year:
            lines.append(f"Rango de años: {stats.oldest_year} - {stats.newest_year}")
        lines.append(f"Total de listados: {stats.total_listings or 'N/A'}")
        lines.append(f"Precio medio general: {_fmt_price(stats.overall_price_mean)}")
        lines.append(f"Mediana de precio: {_fmt_price(stats.overall_price_median)}")
        lines.append(f"Odómetro medio: {_fmt_odometer(stats.overall_odometer_mean)}")
        lines.append(f"Combustible: {stats.fuel or 'N/A'}")
        lines.append(f"Transmisión: {stats.transmission or 'N/A'}")
        lines.append(f"Drive: {stats.drive or 'N/A'}")
        lines.append(f"Tipo: {stats.vehicle_type or 'N/A'}")

        return VehicleDataBlock(
            title=f"Estadísticas de {stats.manufacturer} {stats.model}",
            content="\n".join(lines),
        )

    async def list_brands(
        self,
        limit: int = 20,
    ) -> VehicleDataBlock | None:
        brands = await self._repo.list_brands(limit=limit)
        if not brands:
            return None

        lines = ["[BRAND_LIST]"]
        lines.append(f"Marcas disponibles: {len(brands)}")
        lines.append("")

        for b in brands:
            lines.append(
                f"  {b.manufacturer}: "
                f"{b.model_count or '?'} modelos, "
                f"{b.total_listings or '?'} listados, "
                f"precio promedio {_fmt_price(b.average_price)}"
            )

        return VehicleDataBlock(
            title=f"Lista de marcas ({len(brands)})",
            content="\n".join(lines),
        )

    async def health_check(self) -> bool:
        return await self._repo.health_check()
