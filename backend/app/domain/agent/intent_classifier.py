import re
import unicodedata
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
            r"tengo\s+(un|una)\s+(problema|falla|ruido|olor|fuga|vibracion)",
            r"mi\s+(auto|carro|vehiculo|coche|moto)\s+(tiene|hace|presenta)",
            r"(esta|esta)\s+(calentando|humo|vibrando|ruidoso|fallando)",
            r"(no|no\s+)(arranca|enciende|frena|funciona|prende)",
            r"se\s+(enciende|apaga|calienta|vibra)\s+(el|la)\s+(testigo|luz)",
            r"(que|que)\s+(puede\s+ser|pasa|le\s+pasa|tengo)",
            r"necesito\s+(un\s+)?(diagnostico|mecanico|taller)",
            r"(ayuda|socorro|emergencia|urgente).*(auto|carro|vehiculo|motor|freno)",
            r"check\s*engine",
            r"luz\s+de\s+(check|motor|temperatura|aceite|bateria)",
            r"\bhace\s+(un|el)\s+(ruido|ruidos|olores?)\b",
            r"\bvibra\b",
            r"\bse\s+apaga\b",
            r"\bse\s+calienta\b",
            r"\bno\s+arranca\b",
            r"\bno\s+frena\b",
            r"\bse\s+enciende\b",
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

def _strip_accents(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


_AUTOMOTIVE_DOMAIN_KEYWORDS: set[str] = {
    _strip_accents(kw) for kw in {
        "auto", "autos", "carro", "carros", "vehiculo", "vehiculos",
        "coche", "coches", "camioneta", "camionetas", "motocicleta",
        "moto", "motos", "furgoneta", "rueda", "ruedas",
        "toyota", "honda", "ford", "chevrolet", "chevy", "nissan",
        "mazda", "hyundai", "kia", "suzuki", "subaru", "mitsubishi",
        "audi", "bmw", "mercedes", "benz", "volkswagen", "vw",
        "lexus", "acura", "infiniti", "porsche", "ferrari",
        "fiat", "peugeot", "renault", "opel", "volvo", "seat",
        "skoda", "dacia", "geely", "changan", "byd",
        "great wall", "foton", "jac",
        "mecanica", "mecanico", "mecanicos",
        "motor", "motores", "carroceria",
        "transmision", "caja", "embrague",
        "suspension", "amortiguador", "amortiguadores",
        "freno", "frenos", "pastillas", "discos",
        "direccion", "volante",
        "bateria", "alternador", "arranque",
        "radiador", "termostato", "bombas",
        "filtro", "filtros", "aceite",
        "llantas", "llanta", "neumaticos", "gomas",
        "clutch", "diferencial", "eje",
        "escape", "tubo", "catalizador", "mofle",
        "combustible", "gasolina", "diesel", "electrico",
        "hibrido", "etanol", "gnv", "glp",
        "gas natural", "lng",
        "sedan", "suv", "hatchback", "coupe",
        "pickup", "familiar", "wagon", "van", "crossover",
        "berlina", "deportivo",
        "fwd", "rwd", "awd", "4x4", "traccion",
        "odometro", "millaje",
        "kilometros", "km", "millas",
        "concesionario", "concesionaria", "agencia",
        "seminuevo", "semiusado", "usado", "nuevo",
        "test drive", "prueba de manejo",
        "seguro", "seguros", "poliza",
        "financiamiento", "credito", "cuota", "leasing",
        "avaluo", "tasacion",
        "revisiones", "mantenimiento", "service", "servicio",
        "afinamiento", "cambio de aceite", "alineacion",
        "balanceo", "rotacion de llantas",
        "scanner", "escaner", "diagnostico automotriz", "diagnosticar",
        "ecu", "obd", "obd2", "codigo de falla",
        "check engine", "testigo", "luz de advertencia",
        "carpass", "carfax", "historial", "title",
        "gps", "tracker", "rastreador vehicular",
        "luces", "faros", "headlight", "led",
        "aire acondicionado", "a/c", "clima",
        "airbag", "cinturon", "seguridad",
        "isofix", "abs", "control de estabilidad",
        "sensor", "sensores", "camara",
        "pantalla", "infotainment", "apple carplay", "android auto",
        "autonomia", "rango",
        "emisiones", "contaminacion",
        "inspeccion", "vistabueno",
        "matricula", "placa", "placas",
        "transito", "multa", "multas",
        "valla", "grua", "remolque",
        "carga", "tonelada", "payload",
        "off road", "off-road", "todo terreno", "4wd",
        "trailer", "semi", "camion",
        "vehiculo electrico", "ev", "bev", "phev",
        "recarga", "carga rapida", "supercharger",
        "mecanica automotriz", "ingenieria automotriz",
    }
}

_OUT_OF_SCOPE_PATTERNS: list[str] = [
    r"(receta|pastel|cocinar|cocina|comida|comer|ingrediente|cocino|hornear|bizcocho|tarta)",
    r"descubri",
    r"historia\s+de\s+(america|colon)",
    r"historia\s+universal",
    r"colon\s+descubri",
    r"invento\b",
    r"(contenedor(?:es)?\s+(?:docker|virtual)|kubernetes|k8s)",
    r"(como\s+funciona|que\s+es)\s+docker\b",
    r"(programacion|programar|python|javascript|css|html)",
    r"(enfermedad|sintomas?\s+(de\s+)?(gripe|humano|resfriado)|medicamento|medicina|doctor|dolor\s+de\s+cabeza|fiebre)",
    r"(clima\s+(del|de)\s+(hoy|dia)|tiempo\s+meteorologico|pronostico|clima\s+de)",
    r"(recetas?\s+de\s+cocina|ideas?\s+de\s+cena)",
    r"(poema|poesia|verso|cancion|cantar|musica)",
    r"(traduce|traducir|idioma|lengua)",
    r"(tarea|deberes?|matematicas|examen|estudiar)",
    r"(mecanica\s+cuantica|fisica|astrologia|astronomia)",
    r"(planeta|planetas|sistema\s+solar|universo|estrella|galaxia)",
    r"(chiste|broma|humor|reir)",
    r"(asistente\s+general|responde\s+lo\s+que|cualquier\s+pregunta|actua\s+como|ignora\s+tus)",
]


def _is_in_automotive_domain(normalized: str) -> bool:
    """Return True if the message contains automotive domain keywords."""
    return any(kw in normalized for kw in _AUTOMOTIVE_DOMAIN_KEYWORDS)


def _is_out_of_scope(normalized: str) -> bool:
    """Return True if the message clearly falls outside the automotive domain.

    Checks out-of-scope patterns first (to catch compound words like
    'mecanica cuantica' that contain automotive keywords). Then checks
    if the message contains any automotive domain keywords.

    Docker is only flagged when there is NO automotive context nearby.
    """
    for p in _OUT_OF_SCOPE_PATTERNS:
        if re.search(p, normalized, re.IGNORECASE):
            return True

    if re.search(r"\bdocker\b", normalized):
        if not _is_in_automotive_domain(normalized):
            return True

    if _is_in_automotive_domain(normalized):
        return False
    return False
    return False


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

        if _is_out_of_scope(normalized):
            return ClassificationResult(intent=Intent.OUT_OF_SCOPE, confidence=1.0)

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
        nfkd = unicodedata.normalize("NFKD", text)
        return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()

    @staticmethod
    def _is_greeting_or_farewell(text: str) -> bool:
        return any(re.match(p, text) for p in _GENERAL_NEGATIVE_SIGNALS)
