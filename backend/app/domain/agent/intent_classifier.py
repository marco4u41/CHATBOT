import re
from dataclasses import dataclass, field

from app.domain.agent.intent import Intent


@dataclass(frozen=True)
class IntentSignal:
    intent: Intent
    patterns: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    weight: float = 1.0


_INTENT_SIGNALS: list[IntentSignal] = [
    IntentSignal(
        intent=Intent.COMPARISON,
        keywords=[
            "comparar",
            "comparación",
            "comparativo",
            "diferencia",
            "diferencias",
            "versus",
            "vs",
            "mejor",
            "cuál es mejor",
            "cuál es más",
            "qué es mejor",
            "qué es más",
            "elegir entre",
            "elige entre",
            "elije entre",
        ],
        patterns=[
            r"compar[ae]",
            r"(cu[aá]l|cual)\s+(es\s+)?(mejor|peor|más|menor|superior|inferior)",
            r"(mejor|peor)\s+(opción|elección|alternativa)\s+(para|entre|de)",
            r"vs\.?\s+",
            r"contraste?\b",
            r"diferencia[s]?\s+entre",
            r"qué\s+(es\s+)?(mejor|más)\s+",
        ],
    ),
    IntentSignal(
        intent=Intent.DIAGNOSIS,
        keywords=[
            "diagnóstico",
            "diagnosticar",
            "diagnostico",
            "problema",
            "problemas",
            "falla",
            "fallas",
            "avería",
            "averias",
            "ruido",
            "ruidos",
            "vibración",
            "vibraciones",
            "fuga",
            "fugas",
            "caliente",
            "calentando",
            "sobrecalentamiento",
            "humo",
            "olor",
            "olor a",
            "no arranca",
            "no enciende",
            "se apaga",
            "se detiene",
            "emergencia",
            "urgente",
            "mecánico",
            "mecánica",
            "taller",
            "reparación",
            "reparar",
            "arreglar",
            "marcha",
            "freno",
            "frenos",
            "frenar",
            "motor",
            "transmisión",
            "caja",
            "embrague",
            "suspensión",
            "dirección",
            "eléctrico",
            "eléctrica",
            "batería",
            "bateria",
            "testigo",
            "luz de",
            "check engine",
            "warning",
        ],
        patterns=[
            r"tengo\s+(un|una)\s+(problema|falla|ruido|olor|fuga|vibración)",
            r"mi\s+(auto|carro|vehículo|coche|moto)\s+(tiene|hace|presenta)",
            r"(está|esta)\s+(calentando|humo|vibrando|ruidoso|fallando)",
            r"(no|no\s+)(arranca|enciende|frena|funciona|prende)",
            r"se\s+(enciende|apaga|calienta|vibra)\s+(el|la)\s+(testigo|luz)",
            r"(qué|que)\s+(puede\s+ser|pasa|le\s+pasa|tengo)",
            r"necesito\s+(un\s+)?(diagnóstico|mecánico|taller)",
            r"(ayuda|socorro|emergencia|urgente).*(auto|carro|vehículo|motor|freno)",
            r"check\s*engine",
            r"luz\s+de\s+(check|motor|temperatura|aceite|batería)",
        ],
        weight=1.2,
    ),
    IntentSignal(
        intent=Intent.RECOMMENDATION,
        keywords=[
            "recomendar",
            "recomendación",
            "recomendaciones",
            "sugerir",
            "sugerencia",
            "consejo",
            "consejos",
            "presupuesto",
            "cuánto",
            "cuanto",
            "inversión",
            "invertir",
            "comprar",
            "compra",
            "adquirir",
            "adquisición",
            "auto nuevo",
            "auto usado",
            "carro nuevo",
            "carro usado",
            "vehículo nuevo",
            "vehículo usado",
            "cuál comprar",
            "que auto comprar",
            "que carro comprar",
            "qué auto compro",
            "qué carro compro",
            "necesito un auto",
            "necesito un carro",
            "quiero un auto",
            "quiero un carro",
            "busco un auto",
            "busco un carro",
            "buscar auto",
            "buscar carro",
            "me alcanza",
            "alcanza para",
            "me da para",
            "uso urbano",
            "uso rural",
            "familiar",
            "deportivo",
            "suv",
            "pickup",
            "camioneta",
            "hatchback",
            "sedan",
            "sedán",
            "crossover",
        ],
        patterns=[
            r"(qué|que|cu[aá]l|cual)\s+(auto|carro|vehículo|coche)\s+(compro|comprar|compra|elijo|eligir|elegir)",
            r"(comprar|adquirir)\s+(un|una|el|la|unos)\s+(auto|carro|vehículo|coche)",
            r"(necesito|quiero|busco)\s+(un|una|el|lo)\s+(auto|carro|vehículo|coche)",
            r"(presupuesto|inversión|gastar|dinero|pago|costo)\s+de\s+\$?\s*\d+",
            r"\$\s*\d[\d,.]*\s*(USD|dólares|dolares)?\s*(para|de|presupuesto)?",
            r"(me\s+)?alcanza\s+(para|con|con\s+)",
            r"cu[aá]l?\s+es\s+(el\s+)?(mejor|óptimo|ideal)\s+(auto|carro|vehículo|opción)",
            r"(recom[ií]enda|sugiere|aconseja|sugi[eé]re)",
            r"(auto|carro|vehículo)\s+(para|ideal|perfecto|óptimo)\s+(uso|ciudad|ruta|familia|trabajo)",
            r"(cu[aá]nto|cuanto)\s+(cuesta|vale|gasto|costo|invierto)",
        ],
    ),
]

_GENERAL_NEGATIVE_SIGNALS = [
    r"^(hola|buenos?\s+d[ií]as?|buenas?\s+tardes?|buenas?\s+noches?|hey|saludos?)\s*[!.]?\s*$",
    r"^(gracias|agradezco|muchas\s+gracias)\s*[!.]?\s*$",
    r"^(adiós|adios|nos\s+vemos|hasta\s+luego|bye)\s*[!.]?\s*$",
    r"^(ok|vale|de\s+acuerdo|entendido|perfecto|genial|bien)\s*[!.]?\s*$",
]


@dataclass
class ClassificationResult:
    intent: Intent
    confidence: float
    matched_keywords: list[str] = field(default_factory=list)


class IntentClassifier:
    """Rule-based intent classifier. No LLM call required."""

    def classify(
        self,
        message: str,
        *,
        budget: float | None = None,
        terrain: str | None = None,
        engine_type: str | None = None,
    ) -> ClassificationResult:
        normalized = self._normalize(message)

        if self._is_greeting_or_farewell(normalized):
            return ClassificationResult(intent=Intent.GENERAL, confidence=1.0)

        scores: dict[Intent, float] = {}
        matched: dict[Intent, list[str]] = {}

        for signal in _INTENT_SIGNALS:
            intent_score = 0.0
            intent_matches: list[str] = []

            for keyword in signal.keywords:
                if keyword in normalized:
                    intent_score += 1.0
                    intent_matches.append(keyword)

            for pattern in signal.patterns:
                if re.search(pattern, normalized, re.IGNORECASE):
                    intent_score += 1.5
                    intent_matches.append(f"regex:{pattern[:30]}")

            intent_score *= signal.weight
            scores[signal.intent] = scores.get(signal.intent, 0.0) + intent_score
            matched[signal.intent] = matched.get(signal.intent, []) + intent_matches

        if budget is not None and scores.get(Intent.RECOMMENDATION, 0) > 0:
            scores[Intent.RECOMMENDATION] += 2.0
        if terrain is not None or engine_type is not None:
            scores[Intent.RECOMMENDATION] = scores.get(Intent.RECOMMENDATION, 0) + 0.5

        if not scores or all(v == 0 for v in scores.values()):
            return ClassificationResult(intent=Intent.GENERAL, confidence=1.0)

        best_intent = max(scores, key=lambda k: scores[k])
        best_score = scores[best_intent]
        total = sum(scores.values())
        confidence = best_score / total if total > 0 else 0.0

        return ClassificationResult(
            intent=best_intent,
            confidence=round(min(confidence, 1.0), 3),
            matched_keywords=matched.get(best_intent, []),
        )

    @staticmethod
    def _normalize(text: str) -> str:
        return text.lower().strip()

    @staticmethod
    def _is_greeting_or_farewell(text: str) -> bool:
        return any(re.match(p, text) for p in _GENERAL_NEGATIVE_SIGNALS)
