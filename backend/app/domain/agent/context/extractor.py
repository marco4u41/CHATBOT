from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.domain.agent.context.user_context import UserContext, VehicleInfo
from app.domain.models.message import Message

_AUTOMOTIVE_BRANDS: list[str] = [
    "toyota", "honda", "ford", "chevrolet", "chevy", "nissan", "hyundai",
    "kia", "mazda", "subaru", "volkswagen", "vw", "bmw", "mercedes",
    "mercedes-benz", "audi", "volvo", "jeep", "renault", "fiat",
    "peugeot", "citroën", "citroen", "suzuki", "mitsubishi", "dodge",
    "chrysler", "lexus", "acura", "infiniti", "alfa romeo", "tesla",
    "byd", "mg", "great wall", "changan", "geely", "roewe", "haval",
    "gac", "foton", "jac",
]

_USAGE_KEYWORDS: dict[str, list[str]] = {
    "urbano": ["ciudad", "urbano", "urbana", "tráfico", "trafico", "tránsito"],
    "ruta": ["ruta", "autopista", "carretera", "viaje", "viajar", " highway"],
    "familiar": ["familia", "familiar", "hijos", "niños", "ninos", "escolar"],
    "trabajo": ["trabajo", "laboral", "profesional", "oficina", "negocios"],
    "carga": ["carga", "mercancía", "mercancia", "transporte", "carga pesada"],
    "deportivo": ["deportivo", "deportiva", "velocidad", "potencia", "emoción"],
    "offroad": ["off-road", "off road", "terreno", "montaña", "montana",
                "campo", "rural", "camino"],
}

_PREFERENCE_KEYWORDS: dict[str, list[str]] = {
    "económico": ["económico", "economica", "economico", "ahorro", "barato",
                   "bajo consumo", "eficiente", "eficiencia", "bajo costo"],
    "seguro": ["seguro", "seguridad", "airbag", "frenos", "estabilidad",
               "asistencia", "calificación de seguridad"],
    "confort": ["confort", "comodidad", "cómodo", "comodo", "silencioso",
                "suave", "amplio"],
    "deportivo": ["deportivo", "deportiva", "potente", "rápido", "velocidad",
                  "prestaciones", "dinámico"],
    "confiable": ["confiable", "confianza", "duradero", "resistente",
                  "confiabilidad", "calidad"],
    "tecnología": ["tecnología", "tecnologia", "pantalla", "sensor",
                   "cámara", "asistente", "conectividad"],
    "diseño": ["diseño", "diseño", "estético", "elegante", "moderno",
               "atractivo", "bella"],
}

_BUDGET_PATTERNS: list[str] = [
    r"(?:presupuesto|inversión|inversion|gastar|dinero|costo|valor|precio)"
    r"\s*(?:de\s*)?(?:de\s+)?(?:un\s+)?"
    r"\$?\s*([\d,.]+)\s*(?:USD|dólares|dolares|usd)?",
    r"\$\s*([\d,.]+)\s*(?:USD|dólares|dolares|usd)?",
    r"([\d,.]+)\s*(?:USD|dólares|dolares|usd)\s*(?:de\s+)?(?:presupuesto)?",
    r"(?:me\s+)?alcanza(?:n)?\s+(?:para|con)\s+\$?\s*([\d,.]+)",
    r"(?:tengo|con)\s+\$?\s*([\d,.]+)\s*(?:USD|dólares|dolares|usd)?",
]

_DIAGNOSIS_SYMPTOM_KEYWORDS: list[str] = [
    "ruido", "ruidos", "vibración", "vibraciones", "fuga", "fugas",
    "humo", "olor", "caliente", "calentando", "sobrecalentamiento",
    "no arranca", "no enciende", "se apaga", "se detiene", "falla",
    "fallas", "testigo", "luz de", "check engine", "freno", "frenos",
    "frenar", "emergencia", "urgente",
]

_BRAND_PREFERENCE_PATTERNS: list[str] = [
    r"(?:me\s+(?:gusta|gustan|encanta|encantan))\s+(?:la?s?\s+)?",
    r"(?:mi\s+(?:marca|marcas)\s+(?:favorita|favoritas|preferida|preferidas)\s+(?:es|son)\s+)",
    r"(?:(?:siempre|solo|sólo|me\s+quedo)\s+(?:compro|compra|comprar|con)\s+(?:la?s?\s+)?)",
    r"(?:prefiero?\s+(?:la?s?\s+)?)",
    r"(?:(?:elijo|eligiere?|escojo|escogiere?)\s+(?:la?s?\s+)?)",
    r"(?:tengo\s+(?:preferencia|predilección|debilidad)\s+por\s+(?:la?s?\s+)?)",
]

_NO_BRAND_PREFERENCE_PATTERNS: list[str] = [
    r"\b(?:de\s+)?cualquier\s+marca\b",
    r"\bsin\s+preferencia\s+(?:de|por)\s+marca\b",
    r"\bno\s+(?:tengo|hay)\s+preferencia\s+(?:de|por)\s+marca\b",
    r"\b(?:la\s+)?marca\s+(?:me\s+)?da\s+igual\b",
]

_BODY_TYPE_KEYWORDS: dict[str, list[str]] = {
    "suv": ["suv", "crossover"],
    "sedan": ["sedan", "sedán", "berlina"],
    "hatchback": ["hatchback"],
    "truck": ["pickup", "pick-up", "camioneta de carga"],
    "coupe": ["coupe", "coupé"],
    "van": ["van", "minivan"],
    "wagon": ["wagon", "familiar"],
}

_FUEL_KEYWORDS: dict[str, list[str]] = {
    "gas": ["gasolina", "gasoline", "nafta"],
    "diesel": ["diésel", "diesel"],
    "electric": ["eléctrico", "electrico", "electric", "ev"],
    "hybrid": ["híbrido", "hibrido", "hybrid"],
}


@dataclass
class _ExtractionState:
    brands_found: list[str] = field(default_factory=list)
    vehicles: list[VehicleInfo] = field(default_factory=list)
    budget: float | None = None
    usage: str = ""
    preferences: list[str] = field(default_factory=list)
    has_issue: bool = False
    symptoms: list[str] = field(default_factory=list)
    preferred_brands: list[str] = field(default_factory=list)
    body_type: str | None = None
    fuel_preference: str | None = None
    manufacturer_cleared: bool = False


class ContextExtractor:
    """Extracts structured user context from conversation messages
    using regex patterns. Zero LLM calls."""

    def extract(
        self,
        messages: list[Message],
        *,
        budget: float | None = None,
        terrain: str | None = None,
        engine_type: str | None = None,
    ) -> UserContext:
        state = _ExtractionState()

        for msg in messages:
            if msg.role.value != "user":
                continue
            text = msg.content.lower().strip()
            clears_manufacturer = self._clears_manufacturer(text)
            if clears_manufacturer:
                state.brands_found.clear()
                state.preferred_brands.clear()
                state.vehicles.clear()
                state.manufacturer_cleared = True
            self._extract_brands(text, state)
            self._extract_vehicles(text, state)
            self._extract_budget(text, state)
            self._extract_usage(text, state)
            self._extract_body_type(text, state)
            self._extract_fuel(text, state)
            self._extract_preferences(text, state)
            self._extract_diagnosis(text, state)
            if not clears_manufacturer:
                self._extract_preferred_brands(text, state)

        return UserContext(
            vehicles=state.vehicles,
            mentioned_brands=state.brands_found,
            budget=budget if budget is not None else state.budget,
            terrain=terrain,
            engine_type=engine_type,
            usage=state.usage,
            preferences=state.preferences,
            has_diagnosed_issue=state.has_issue,
            diagnosis_symptoms=state.symptoms,
            preferred_brands=state.preferred_brands,
            fuel_preference=state.fuel_preference,
            body_type=state.body_type,
            manufacturer_cleared=state.manufacturer_cleared,
        )

    def _extract_brands(self, text: str, state: _ExtractionState) -> None:
        found = [
            brand for brand in _AUTOMOTIVE_BRANDS
            if re.search(rf"(?<!\w){re.escape(brand)}(?!\w)", text)
        ]
        if found:
            state.brands_found = found
            state.manufacturer_cleared = False

    def _extract_vehicles(self, text: str, state: _ExtractionState) -> None:
        for brand in _AUTOMOTIVE_BRANDS:
            if brand not in text:
                continue
            pattern = (
                rf"{re.escape(brand)}\s+"
                r"([\w\s\-]+?)"
                r"(?:\s+(\d{4}))?"
                r"(?:\s|$|,|\.|!|\?)"
            )
            match = re.search(pattern, text, re.IGNORECASE)
            if not match:
                continue
            model = match.group(1).strip()
            year_str = match.group(2)
            if not model or len(model) < 2:
                continue
            model = model.title()
            year = int(year_str) if year_str else None
            if not any(
                v.brand.lower() == brand and v.model.lower() == model.lower()
                for v in state.vehicles
            ):
                state.vehicles.append(
                    VehicleInfo(brand=brand.title(), model=model, year=year)
                )

    def _extract_budget(self, text: str, state: _ExtractionState) -> None:
        for pattern in _BUDGET_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                raw = match.group(1).replace(",", "").replace(".", "")
                try:
                    value = float(raw)
                    if 500 <= value <= 500_000:
                        state.budget = value
                        return
                except ValueError:
                    continue

    def _extract_usage(self, text: str, state: _ExtractionState) -> None:
        for usage, keywords in _USAGE_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                state.usage = usage
                return

    def _extract_body_type(self, text: str, state: _ExtractionState) -> None:
        for body_type, keywords in _BODY_TYPE_KEYWORDS.items():
            if any(re.search(rf"(?<!\w){re.escape(keyword)}(?!\w)", text) for keyword in keywords):
                state.body_type = body_type
                return

    def _extract_fuel(self, text: str, state: _ExtractionState) -> None:
        for fuel, keywords in _FUEL_KEYWORDS.items():
            if any(re.search(rf"(?<!\w){re.escape(keyword)}(?!\w)", text) for keyword in keywords):
                state.fuel_preference = fuel
                return

    @staticmethod
    def _clears_manufacturer(text: str) -> bool:
        return any(
            re.search(pattern, text, re.IGNORECASE)
            for pattern in _NO_BRAND_PREFERENCE_PATTERNS
        )

    def _extract_preferences(self, text: str, state: _ExtractionState) -> None:
        for pref, keywords in _PREFERENCE_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                if pref not in state.preferences:
                    state.preferences.append(pref)

    def _extract_diagnosis(self, text: str, state: _ExtractionState) -> None:
        symptom_hits = [
            kw for kw in _DIAGNOSIS_SYMPTOM_KEYWORDS if kw in text
        ]
        if symptom_hits:
            state.has_issue = True
            state.symptoms.extend(symptom_hits)

    def _extract_preferred_brands(
        self, text: str, state: _ExtractionState,
    ) -> None:
        """Detect explicit brand preference signals.

        Looks for phrases like "me gusta Toyota", "mi marca favorita es Honda",
        "siempre compro Ford", etc.  Only brands already in the known list
        are recognized.
        """
        for pattern in _BRAND_PREFERENCE_PATTERNS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                remainder = text[match.end():]
                for brand in _AUTOMOTIVE_BRANDS:
                    if remainder.startswith(brand):
                        if brand not in state.preferred_brands:
                            state.preferred_brands.append(brand)
                        break
