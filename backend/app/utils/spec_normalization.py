"""Centralized Spanish translation mappings for vehicle specifications."""

from __future__ import annotations

FUEL_MAP: dict[str, str] = {
    "gas": "Gasolina",
    "gasoline": "Gasolina",
    "petrol": "Gasolina",
    "diesel": "Diésel",
    "electric": "Eléctrico",
    "hybrid": "Híbrido",
    "plug-in hybrid": "Híbrido enchufable",
    "plug-in": "Híbrido enchufable",
    "ethanol": "Etanol",
    "e85": "Etanol E85",
    "cng": "Gas natural (CNG)",
    "lpg": "Gas licuado (LPG)",
    "hydrogen": "Hidrógeno",
}

TRANSMISSION_MAP: dict[str, str] = {
    "automatic": "Automática",
    "manual": "Manual",
    "other": "Otra",
    "cvt": "CVT",
    "dual-clutch": "Doble embrague",
    "dct": "Doble embrague",
    "amt": "Automatizada",
    "tiptronic": "Tiptronic",
}

DRIVE_MAP: dict[str, str] = {
    "fwd": "Delantera",
    "rwd": "Trasera",
    "awd": "Integral",
    "4wd": "4x4",
    "4x4": "4x4",
    "ffd": "Delantera",
}

BODY_MAP: dict[str, str] = {
    "sedan": "Sedán",
    "suv": "SUV",
    "hatchback": "Hatchback",
    "coupe": "Coupé",
    "convertible": "Convertible",
    "pickup": "Camioneta pickup",
    "wagon": "Familiar",
    "van": "Furgoneta",
    "minivan": "Minivan",
    "truck": "Camión",
    "sport utility": "SUV",
    "sport utility vehicle": "SUV",
    "passenger car": "Automóvil",
    "2dr": "Coupé",
    "4dr": "Sedán",
    "crew cab": "Camioneta cabina doble",
    "extended cab": "Camioneta cabina extendida",
}

CONDITION_MAP: dict[str, str] = {
    "new": "Nuevo",
    "used": "Usado",
    "excellent": "Excelente",
    "good": "Bueno",
    "fair": "Regular",
    "poor": "Deficiente",
    "certified": "Certificado",
}

COLOR_MAP: dict[str, str] = {
    "black": "Negro",
    "white": "Blanco",
    "silver": "Plata",
    "gray": "Gris",
    "grey": "Gris",
    "red": "Rojo",
    "blue": "Azul",
    "green": "Verde",
    "yellow": "Amarillo",
    "orange": "Naranja",
    "brown": "Marrón",
    "beige": "Beige",
    "gold": "Dorado",
    "purple": "Morado",
    "navy": "Azul marino",
    "charcoal": "Carbón",
    "crimson": "Carmesí",
    "teal": "Verde azulado",
    "burgundy": "Burdeos",
    "pink": "Rosa",
}

_MAPS: dict[str, dict[str, str]] = {
    "fuel": FUEL_MAP,
    "transmission": TRANSMISSION_MAP,
    "drive": DRIVE_MAP,
    "body": BODY_MAP,
    "condition": CONDITION_MAP,
    "color": COLOR_MAP,
}


def translate_spec(value: str | None, category: str) -> str:
    """Translate a specification value to Spanish."""
    if not value:
        return "No disponible"
    normalized = value.strip().lower()
    spec_map = _MAPS.get(category, {})
    translated = spec_map.get(normalized)
    if translated:
        return translated
    return value.strip().capitalize()


def format_price_usd(value: float | None) -> str:
    """Format a price value as USD currency."""
    if value is None:
        return "No disponible"
    return f"USD {value:,.0f}"


def format_mileage(value: float | None) -> str:
    """Format mileage with km unit."""
    if value is None:
        return "No disponible"
    return f"{value:,.0f} km"
