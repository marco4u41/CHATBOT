# Plan Técnico — Fase 5: Experiencia Conversacional Inteligente

> **Proyecto:** AutoExpert AI  
> **Fecha:** 2026-07-24  
> **Estado:** Plan completo — listo para implementación  
> **Versión del plan:** 1.0

---

## Tabla de contenidos

1. [Estado actual verificado](#1-estado-actual-verificado)
2. [Brechas críticas identificadas](#2-brechas-críticas-identificadas)
3. [Arquitectura objetivo Fase 5](#3-arquitectura-objetivo-fase-5)
4. [Subfase 5.1 — Memoria conversacional entre sesiones](#4-subfase-51--memoria-conversacional-entre-sesiones)
5. [Subfase 5.2 — Perfil de usuario propagado en endpoints directos](#5-subfase-52--perfil-de-usuario-propagado-en-endpoints-directos)
6. [Subfase 5.3 — Recomendaciones inteligentes con datos reales](#6-subfase-53--recomendaciones-inteligentes-con-datos-reales)
7. [Subfase 5.4 — Comparaciones inteligentes con datos reales](#7-subfase-54--comparaciones-inteligentes-con-datos-reales)
8. [Subfase 5.5 — Diagnósticos con datos reales del mercado](#8-subfase-55--diagnósticos-con-datos-reales-del-mercado)
9. [Subfase 5.6 — Preguntas de seguimiento inteligentes](#9-subfase-56--preguntas-de-seguimiento-inteligentes)
10. [Subfase 5.7 — Personalización y aprendizaje de preferencias](#10-subfase-57--personalización-y-aprendizaje-de-preferencias)
11. [Subfase 5.8 — Contexto dinámico completo (AutomotiveAgentTool)](#11-subfase-58--contexto-dinámico-completo-automotiveagenttool)
12. [Orden de implementación y dependencias](#12-orden-de-implementación-y-dependencias)
13. [Matriz de trazabilidad](#13-matriz-de-trazabilidad)
14. [Estrategia de testing](#14-estrategia-de-testing)
15. [Riesgos y mitigaciones](#15-riesgos-y-mitigaciones)
16. [Criterios de cierre de fase](#16-criterios-de-cierre-de-fase)

---

## 1. Estado actual verificado

### 1.1 Stack confirmado

| Componente | Versión | Estado |
|---|---|---|
| Python | 3.14.6 | Operativo |
| FastAPI | (asíncrono) | Operativo |
| SQLAlchemy async | (con SQLite fallback) | Operativo |
| OpenRouter LLM | `openrouter/free` (placeholder) | Operativo |
| PostgreSQL | 18.0 (producción) | Confirmado |
| SQLite | fallback (desarrollo) | 3 tablas app + 3 automotive |
| pytest | 185 colectados | **163 passed, 22 skipped** |
| Ruff | 0.15.21 | 20 errores (5 en app code) |
| Frontend | React + Zustand + TypeScript | Operativo |

### 1.2 Base de datos verificada

| Tabla | Registros | Observaciones |
|---|---|---|
| `vehicles_master` | 47,030 | Datos reales de listings |
| `vehicle_market_stats` | 20,036 | Estadísticas por modelo |
| `brands` | 40 | Marcas con stats agregadas |
| `conversations` | — | SQLite fallback |
| `messages` | — | SQLite fallback |
| `user_profiles` | — | SQLite fallback |

### 1.3 Componentes activos del agente

| Componente | Archivo | Estado | Observaciones |
|---|---|---|---|
| `AgentOrchestrator` | `domain/agent/orchestrator.py` | Activo | Flujo: classify → context → automotive → prompt → LLM |
| `ContextManager` | `domain/agent/context/manager.py` | Activo | Profile + extractor merge |
| `ContextExtractor` | `domain/agent/context/extractor.py` | Activo | Regex NLP, 41 marcas, 7 usos, 7 preferencias |
| `UserContext` | `domain/agent/context/user_context.py` | Activo | 11 campos, `VehicleInfo` inner class |
| `UserProfileManager` | `domain/agent/profile/manager.py` | Activo | `get_profile`, `update_profile`, `_has_changes` |
| `ProfileUpdater` | `domain/agent/profile/updater.py` | Activo | `existing-data-wins`, list union |
| `IntentClassifier` | `domain/agent/intent_classifier.py` | Activo | Rule-based, 3 intents ponderados |
| `CapabilityRegistry` | `domain/agent/registry.py` | Activo | 3 capabilities registradas |
| `AutomotiveAgentTool` | `domain/agent/automotive_tool.py` | Activo | 6 métodos abstractos |
| `SqlAlchemyAutomotiveAgentTool` | `infrastructure/agent/automotive_tool_impl.py` | Activo | Formatea VehicleDataBlock strings |

### 1.4 Use cases y sus rutas

| Use Case | Ruta API | Usa Orchestrator | Usa AutomotiveTool | USA Profile |
|---|---|---|---|---|
| `ChatUseCase` | `POST /api/chat` | **Sí** | **Sí** (vía orchestrator) | **Sí** (profile_id hardcoded "default") |
| `DiagnosisUseCase` | `POST /api/vehicles/diagnose` | **NO** | **NO** | **NO** |
| `RecommendationUseCase` | `POST /api/vehicles/recommend` | **NO** | **NO** | **NO** |
| `VehicleComparisonUseCase` | `POST /api/vehicles/compare` | **NO** | **NO** | **NO** |

### 1.5 Frontend activo

| Store/Componente | Archivo | Función |
|---|---|---|
| `chatStore` | `stores/chatStore.ts` | Envío de mensajes, streaming, filtros físicos |
| `conversationStore` | `stores/conversationStore.ts` | Lista de conversaciones, activar/borrar |
| `garageStore` | `stores/garageStore.ts` | Garaje virtual localStorage (persist) |
| `PhysicalPanel` | `components/chat/PhysicalPanel.tsx` | Filtros: budget, terrain, engine_type |
| `apiClient` | `api/client.ts` | HTTP GET/POST/DELETE + SSE streaming |

### 1.6 Prompt templates disponibles

| Template | Uso |
|---|---|
| `base.txt` | System prompt base del agente |
| `agent_context_block.txt` | Bloque de contexto del usuario |
| `agent_comparison_enhancement.txt` | Enhancement para comparaciones |
| `agent_diagnosis_enhancement.txt` | Enhancement para diagnósticos |
| `agent_recommendation_enhancement.txt` | Enhancement para recomendaciones |
| `diagnosis.txt` | Prompt directo de diagnóstico (use case) |
| `recommendation.txt` | Prompt directo de recomendación (use case) |
| `vehicle_comparison.txt` | Prompt directo de comparación (use case) |

---

## 2. Brechas críticas identificadas

### B1: Sin memoria entre conversaciones

**Ubicación:** `context/manager.py:50`, `context/extractor.py:81`

- `ContextExtractor.extract()` solo procesa los mensajes de la conversación actual
- No consulta conversaciones anteriores del usuario
- El profile persiste datos atómicos (brand, budget, etc.) pero NO histórico conversacional
- Si el usuario empieza una nueva conversación, pierde contexto conversacional previo

**Impacto:** El usuario debe repetir preferencias, historial de decisiones, contexto en cada conversación nueva.

### B2: Endpoints directos no usan orchestrator ni profile

**Ubicación:** `use_cases/diagnosis.py`, `use_cases/recommendation.py`, `use_cases/vehicle_comparison.py`

- Los 3 use cases directos crean su propio prompt con `render_prompt("base")`
- NO consultan `AutomotiveAgentTool` para datos reales del mercado
- NO usan `UserProfileManager` para contexto del usuario
- NO pasan `profile_id` ni contexto conversacional
- Son LLM calls "a ciegas" sin datos automotrices

**Impacto:** Las recomendaciones, comparaciones y diagnósticos vía endpoint directo son genéricos, sin datos reales de la DB.

### B3: AutomotiveAgentTool parcialmente utilizado

**Ubicación:** `orchestrator.py:154-204`

- `_fetch_automotive_data()` solo consulta vehículos y marcas mencionados
- NO usa `search_vehicles()` con filtros de presupuesto/terreno
- NO usa `list_brands()` para exploración
- NO adapta queries según el intent detectado
- Los bloques de datos son estáticos (máx 2 vehículos, 3 marcas)

**Impacto:** El agente tiene acceso a 47,030 registros pero solo consulta datos puntuales, desperdiciando el potencial de la DB.

### B4: Sin preguntas de seguimiento inteligentes

**Ubicación:** Capabilities solo proveen `get_system_prompt_enhancement()` y `get_context_enrichment()`

- No hay lógica para detectar información faltante en el contexto
- No hay generación automática de preguntas de clarificación
- El LLM decide por sí solo si preguntar o no, sin estructura

**Impacto:** El agente a veces responde sin información suficiente, o pregunta de forma genérica.

### B5: Sin personalización de respuestas

**Ubicación:** `profile/manager.py` solo guarda datos atómicos

- No se registra qué marcas rechazó el usuario
- No se guarda historial de recomendaciones mostradas
- No se adapta el tono según el nivel de conocimiento del usuario
- No se priorizan vehículos según preferencias previas

**Impacto:** Cada interacción empieza desde cero, sin aprender del usuario.

### B6: Contexto dinámico limitado

**Ubicación:** `orchestrator.py:87-89`

- `_fetch_automotive_data()` no considera el intent para adaptar queries
- No usa filtros de precio basados en el presupuesto del usuario
- No adapta resultados según el tipo de consulta (compra vs diagnóstico vs comparación)

**Impacto:** Los datos inyectados al prompt son los mismos independientemente de la consulta.

---

## 3. Arquitectura objetivo Fase 5

### 3.1 Flujo unificado post-Fase 5

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  chatStore → apiClient.streamChat() → POST /api/chat       │
│  apiClient.post() → POST /api/vehicles/recommend            │
│  apiClient.post() → POST /api/vehicles/compare              │
│  apiClient.post() → POST /api/vehicles/diagnose             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTER (FastAPI)                      │
│  POST /api/chat → ChatUseCase                              │
│  POST /api/vehicles/recommend → RecommendationUseCase      │
│  POST /api/vehicles/compare → VehicleComparisonUseCase      │
│  POST /api/vehicles/diagnose → DiagnosisUseCase             │
└──────────┬──────────────┬──────────────────┬────────────────┘
           │              │                  │
           ▼              ▼                  ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│  ChatUseCase     │ │ DirectUseCases  │ │ ConversationHistory  │
│  (con orchestr.) │ │ (con orchestr.) │ │      Service         │
└────────┬─────────┘ └───────┬─────────┘ └──────────┬──────────┘
         │                   │                      │
         ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  AgentOrchestrator (CENTRAL)                 │
│                                                             │
│  1. classify_intent(message, filters)                      │
│  2. ContextManager.build_context(history, profile)         │
│  │    ├── UserProfileManager.get_profile()                 │
│  │    ├── ContextExtractor.extract()                       │
│  │    ├── ProfileUpdater.merge()                           │
│  │    └── ConversationHistoryService.get_summary() ← NUEVO │
│  3. _fetch_automotive_data(intent, context) ← MEJORADO     │
│  │    ├── search_vehicles(filters) ← NUEVO                 │
│  │    ├── get_vehicle_details()                            │
│  │    ├── get_brand_info()                                 │
│  │    └── get_model_info()                                 │
│  4. CapabilityRegistry.build_system_prompt()               │
│  5. ContextEnrichmentBuilder.build() ← NUEVO               │
│  │    ├── detect_missing_info() ← NUEVO                    │
│  │    └── generate_followup_questions() ← NUEVO            │
│  6. LLM streaming                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              AutomotiveAgentTool (6 métodos)                │
│  search_vehicles() ← USO COMPLETO                          │
│  get_vehicle_details()                                     │
│  get_brand_info()                                          │
│  get_model_info()                                          │
│  list_brands() ← USO COMPLETO                              │
│  health_check()                                            │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Principios arquitectónicos Fase 5

1. **Un solo camino:** Todos los endpoints pasan por `AgentOrchestrator`
2. **Profile siempre presente:** Todo use case recibe `profile_id`
3. **Datos reales siempre:** Todo endpoint consulta `AutomotiveAgentTool`
4. **Conversación persistente:** Historial cross-conversación disponible
5. **Sin breaking changes:** 163 tests existentes no se rompen
6. **Ruff debt no increase:** Nuevos archivos pasan Ruff limpio

---

## 4. Subfase 5.1 — Memoria conversacional entre sesiones

### 4.1 Objetivo

Implementar un servicio de historial conversacional que permita al agente acceder a resúmenes de conversaciones anteriores del usuario, proporcionando continuidad entre sesiones.

### 4.2 Justificación

Actualmente `ContextExtractor.extract()` solo procesa los mensajes de la conversación actual (`context/extractor.py:91`). Si el usuario empieza una nueva conversación, todo el contexto previo (preferencias discutidas, decisiones tomadas, marcas evaluadas) se pierde. Esto obliga al usuario a repetir información constantemente.

### 4.3 Archivos a modificar

| Archivo | Cambio | Líneas affected |
|---|---|---|
| `domain/agent/context/manager.py` | Agregar `ConversationHistoryService` como dependency, llamar `get_summary()` en `build_context()` | L50-56, nuevo parámetro constructor |
| `use_cases/chat.py` | Pasar historial cross-conversación al orchestrator | L46-55 |
| `dependencies.py` | Inyectar `ConversationHistoryService` en `ContextManager` | Nuevo provider |

### 4.4 Archivos nuevos

| Archivo | Propósito |
|---|---|
| `domain/agent/context/history_service.py` | Servicio que consulta conversaciones anteriores y genera resúmenes |
| `tests/test_conversation_history.py` | Tests unitarios del servicio de historial |

### 4.5 Detalle de implementación

#### 4.5.1 `ConversationHistoryService`

```python
# domain/agent/context/history_service.py

class ConversationHistoryService:
    """Provides cross-conversation memory for the agent."""

    def __init__(
        self,
        conversation_repo: ConversationRepository,
        message_repo: MessageRepository,
    ) -> None: ...

    async def get_recent_summaries(
        self,
        profile_id: str,
        limit: int = 5,
    ) -> list[ConversationSummary]:
        """Get summaries of the last N conversations for this profile."""
        ...

    async def get_key_decisions(
        self,
        profile_id: str,
        limit: int = 10,
    ) -> list[str]:
        """Extract key decisions/preferences from past conversations."""
        ...
```

**Nota:** Como `Conversation` y `Message` no tienen `profile_id` directo, se usará un mapeo basado en el contenido (vehículos mencionados, presupuesto) para filtrar conversaciones relevantes. Alternativamente, se puede agregar un campo `profile_id` a `ConversationModel` en una migración menor.

#### 4.5.2 Cambios en `ContextManager.build_context()`

```python
# Flujo actual:
# 1. get_profile(profile_id)
# 2. extractor.extract(messages)
# 3. merge(profile, extracted)
# 4. render context_block

# Flujo nuevo:
# 1. get_profile(profile_id)
# 2. history_service.get_recent_summaries(profile_id)  ← NUEVO
# 3. extractor.extract(messages)
# 4. merge(profile, extracted)
# 5. render context_block + conversation_summaries  ← NUEVO
```

#### 4.5.3 Nuevo template `agent_conversation_history.txt`

```jinja2
HISTORIAL DE CONVERSACIONES ANTERIORES:
{% for summary in summaries %}
- Conversación {{ loop.index }} ({{ summary.date }}):
  {{ summary.content }}
{% endfor %}
{% if key_decisions %}
DECISIONES CLAVE PREVIAS:
{% for decision in key_decisions %}
- {{ decision }}
{% endfor %}
{% endif %}
```

### 4.6 Cambios en dominio

| Modelo | Cambio |
|---|---|
| `ConversationModel` | **Opcional:** agregar campo `profile_id: str` para filtrado rápido |
| `Conversation` (dataclass) | **Opcional:** agregar campo `profile_id: str | None` |

### 4.7 Testing strategy

- **Unit:** Mock `ConversationRepository` y `MessageRepository`, verificar que `get_recent_summaries()` retorna resúmenes formateados
- **Integration:** Crear 3 conversaciones de prueba, verificar que `build_context()` incluye las 2 más recientes
- **Regression:** Verificar que `orchestrate()` sigue funcionando con `profile_id=None`

### 4.8 Criterios de aceptación

- [ ] `ConversationHistoryService.get_recent_summaries()` retorna máx. 5 resúmenes
- [ ] `ContextManager.build_context()` incluye resúmenes en el context_block
- [ ] El agente puede referenciar conversaciones previas en respuestas
- [ ] 163 tests existentes siguen pasando
- [ ] Tests nuevos pasan con coverage ≥ 80%
- [ ] Ruff limpio en nuevos archivos

### 4.9 Dependencias

- **Pre-requisito:** Ninguna (primera subfase)
- **Bloquea:** 5.7 (personalización necesita historial)

### 4.10 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Performance al consultar historial | Media | Bajo | Cache en memoria con TTL, limitar a 5 conversaciones |
| Conversaciones sin profile_id | Alta | Medio | Fallback: buscar por contenido similar |

---

## 5. Subfase 5.2 — Perfil de usuario propagado en endpoints directos

### 5.1 Objetivo

Modificar los 3 use cases directos (diagnóstico, recomendación, comparación) para que usen `AgentOrchestrator` en lugar de hacer LLM calls directos, aprovechando el perfil del usuario y AutomotiveAgentTool.

### 5.2 Justificación

`DiagnosisUseCase`, `RecommendationUseCase` y `VehicleComparisonUseCase` hacen `self._llm.chat()` directamente (`diagnosis.py:30`, `recommendation.py:28`, `vehicle_comparison.py:27`) sin:
- Consultar el perfil del usuario
- Usar AutomotiveAgentTool para datos reales
- Aplicar el sistema de capabilities del registry
- Recibir contexto de la conversación

Esto genera respuestas genéricas sin datos del mercado ni contexto del usuario.

### 5.3 Archivos a modificar

| Archivo | Cambio |
|---|---|
| `use_cases/diagnosis.py` | Recibir `AgentOrchestrator` en constructor, usar `orchestrate()` |
| `use_cases/recommendation.py` | Recibir `AgentOrchestrator` en constructor, usar `orchestrate()` |
| `use_cases/vehicle_comparison.py` | Recibir `AgentOrchestrator` en constructor, usar `orchestrate()` |
| `dependencies.py` | Actualizar providers para inyectar orchestrator en los 3 use cases |
| `api/v1/router.py` | Pasar `profile_id` en las llamadas (query param o header) |
| `api/schemas/vehicle.py` | Agregar campo `profile_id: Optional[str]` a los 3 request schemas |

### 5.4 Detalle de implementación

#### 5.4.1 Patrón común para los 3 use cases

```python
# ANTES (diagnosis.py):
class DiagnosisUseCase:
    def __init__(self, llm: LLMProvider) -> None:
        self._llm = llm

    async def diagnose(self, vehicle, symptoms, category=None):
        system_prompt = render_prompt("base")
        user_prompt = render_prompt("diagnosis", vehicle=vehicle.__dict__, ...)
        message = Message(content=user_prompt, role=MessageRole.USER, conversation_id="")
        return await self._llm.chat([message], system_prompt)

# DESPUÉS:
class DiagnosisUseCase:
    def __init__(self, orchestrator: AgentOrchestrator) -> None:
        self._orchestrator = orchestrator

    async def diagnose(self, vehicle, symptoms, category=None, profile_id=None):
        # Construir mensaje que active intent de diagnóstico
        message = f"Tengo un problema con mi {vehicle.brand} {vehicle.model}: {', '.join(symptoms)}"
        history = [Message(content=message, role=MessageRole.USER, conversation_id="")]

        result = await self._orchestrator.orchestrate(
            message, history, profile_id=profile_id,
        )

        # El system_prompt ya tiene diagnosis enhancement + automotive data
        response = ""
        async for chunk in self._orchestrator.llm.stream_chat(history, result.system_prompt):
            response += chunk
        return response
```

#### 5.4.2 Schemas actualizados

```python
# api/schemas/vehicle.py
class DiagnosisRequest(BaseModel):
    vehicle: VehicleInput
    symptoms: list[str]
    category: Optional[str] = None
    profile_id: Optional[str] = Field(None, description="User profile ID")

class RecommendationRequest(BaseModel):
    budget_usd: float
    usage: str
    priorities: Optional[list[str]] = None
    profile_id: Optional[str] = Field(None, description="User profile ID")

class VehicleComparisonRequest(BaseModel):
    vehicles: list[VehicleInput]
    focus: str = "all"
    profile_id: Optional[str] = Field(None, description="User profile ID")
```

### 5.5 Testing strategy

- **Unit:** Mock orchestrator, verificar que los 3 use cases lo invocan correctamente
- **Integration:** Llamada real con orchestrator mock, verificar que el system_prompt contiene datos automotrices
- **Regression:** Verificar que los endpoints directos siguen funcionando con profile_id=None

### 5.6 Criterios de aceptación

- [ ] Los 3 use cases usan `AgentOrchestrator` en lugar de `LLMProvider` directo
- [ ] `profile_id` es aceptado y propagado en los 3 endpoints
- [ ] Las respuestas incluyen datos automotrices reales de la DB
- [ ] 163 tests existentes siguen pasando
- [ ] Tests nuevos para los 3 use cases modificados

### 5.7 Dependencias

- **Pre-requisito:** 5.1 (historial conversacional)
- **Bloquea:** 5.3, 5.4, 5.5 (todos dependen de orchestrator unificado)

### 5.8 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Breaking changes en endpoints existentes | Media | Alto | Mantener compat: profile_id opcional, fallback a "default" |
| Latencia al pasar por orchestrator | Baja | Medio | Cache de profile, optimizar queries |

---

## 6. Subfase 5.3 — Recomendaciones inteligentes con datos reales

### 6.1 Objetivo

Que el endpoint `POST /api/vehicles/recommend` proporcione recomendaciones fundamentadas en datos reales de la DB (47,030 vehículos) usando `AutomotiveAgentTool.search_vehicles()` con filtros inteligentes.

### 6.2 Justificación

Actualmente `RecommendationUseCase.recommend()` (`recommendation.py:10-29`) solo llama al LLM con un prompt genérico de "recomendar auto para X presupuesto y uso". No consulta la DB para encontrar vehículos que realmente existan en el mercado.

### 6.3 Archivos a modificar

| Archivo | Cambio |
|---|---|
| `use_cases/recommendation.py` | Usar orchestrator + automotive_tool con filtros basados en presupuesto/uso |
| `domain/agent/capabilities/recommendation.py` | Agregar lógica de filtrado inteligente en `get_context_enrichment()` |

### 6.4 Detalle de implementación

#### 6.4.1 Flujo de recomendación mejorado

```
1. Recepción: budget_usd, usage, priorities, profile_id
2. Buscar vehículos con filtros:
   - max_price = budget_usd * 1.15 (15% margen)
   - vehicle_type según usage (urbano→sedan/hatch, ruta→suv, etc.)
   - fuel_type según preferencia del perfil
3. Obtener detalles de top 5 resultados
4. Inyectar datos al prompt como "[RECOMMENDATION_DATA]"
5. LLM genera recomendación fundamentada
```

#### 6.4.2 Mapping usage → vehicle_type

```python
_USAGE_VEHICLE_TYPE_MAP = {
    "urbano": ["sedan", "hatchback", "crossover"],
    "ruta": ["sedan", "suv"],
    "familiar": ["suv", "minivan", "station_wagon"],
    "trabajo": ["truck", "van"],
    "carga": ["truck", "van"],
    "deportivo": ["coupe", "convertible"],
    "offroad": ["suv", "truck"],
}
```

#### 6.4.3 Datos inyectados al prompt

```
[RECOMMENDATION_DATA]
Vehículos encontrados para presupuesto de $25,000 USD:
--- Vehículo 1 ---
Nombre: Toyota Corolla 2023
Marca: Toyota | Modelo: Corolla | Año: 2023
Precio medio: $22,500 | Rango: $19,000 - $26,000
Odómetro medio: 15,000 mi
Combustible: gasolina | Transmisión: automática
...
```

### 6.5 Testing strategy

- **Unit:** Verificar mapping usage → vehicle_type
- **Integration:** Llamar con budget=25000, usage="urbano", verificar que los datos inyectados contienen vehículos Within budget
- **Edge cases:** Budget muy bajo (< $5000), muy alto (> $200,000), sin resultados

### 6.6 Criterios de aceptación

- [ ] `POST /api/vehicles/recommend` con budget=25000 retorna recomendaciones con datos reales
- [ ] Los vehículos inyectados están Within del rango de precio
- [ ] El mapping usage → vehicle_type funciona para los 7 tipos de uso
- [ ] Si no hay resultados, el agente indica "no se encontraron vehículos en ese rango"
- [ ] 163 tests existentes siguen pasando

### 6.7 Dependencias

- **Pre-requisito:** 5.2 (endpoints directos usan orchestrator)
- **Bloquea:** Ninguna

### 6.8 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Demasiados resultados | Media | Bajo | Limitar a 5, paginación interna |
| Mapeo usage → type incorrecto | Baja | Medio | Validar con datos reales, fallback a "all types" |

---

## 7. Subfase 5.4 — Comparaciones inteligentes con datos reales

### 7.1 Objetivo

Que el endpoint `POST /api/vehicles/compare` proporcione comparaciones fundamentadas en datos reales de la DB, consultando detalles específicos de cada vehículo.

### 7.2 Justificación

`VehicleComparisonUseCase.compare()` (`vehicle_comparison.py:10-28`) solo envía los datos que el usuario provee al LLM. No consulta la DB para enriquecer la comparación con precios reales, estadísticas de mercado, o especificaciones faltantes.

### 7.3 Archivos a modificar

| Archivo | Cambio |
|---|---|
| `use_cases/vehicle_comparison.py` | Usar orchestrator + automotive_tool |
| `domain/agent/capabilities/comparison.py` | Enriquecer contexto con datos de DB para cada vehículo |

### 7.4 Detalle de implementación

#### 7.4.1 Flujo de comparación mejorado

```
1. Recepción: vehicles[], focus
2. Para cada vehículo:
   a. search_vehicles(manufacturer, model) → datos de mercado
   b. get_vehicle_details(manufacturer, model) → detalles por año
3. Concatenar bloques: [COMPARISON_DATA_VEHICLE_1] + [COMPARISON_DATA_VEHICLE_2]
4. Inyectar en prompt
5. LLM genera comparación con datos reales
```

#### 7.4.2 Datos inyectados

```
[COMPARISON_DATA_VEHICLE_1]
Toyota Corolla:
- Precio medio mercado: $21,500
- Rango: $18,000 - $25,000
- Años disponibles: 2020-2024
- Odómetro medio: 25,000 mi
- Combustible más común: gasolina
- Transmisión más común: CVT

[COMPARISON_DATA_VEHICLE_2]
Honda Civic:
- Precio medio mercado: $23,000
- Rango: $19,500 - $27,000
- Años disponibles: 2019-2024
- Odómetro medio: 22,000 mi
- Combustible más común: gasolina
- Transmisión más común: automática
```

### 7.5 Testing strategy

- **Unit:** Mock automotive_tool, verificar que se consultan ambos vehículos
- **Integration:** Comparar Toyota Corolla vs Honda Civic, verificar que los datos de ambos aparecen en el prompt
- **Edge case:** Vehículo no encontrado en DB, verificar fallback graceful

### 7.6 Criterios de aceptación

- [ ] Cada vehículo en la comparación tiene datos de mercado inyectados
- [ ] Si un vehículo no está en la DB, se indica explícitamente
- [ ] El focus (all/engine/safety/confort/economy) afecta qué datos se priorizan
- [ ] 163 tests existentes siguen pasando

### 7.7 Dependencias

- **Pre-requisito:** 5.2 (endpoints directos usan orchestrator)
- **Bloquea:** Ninguna

### 7.8 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Muchos vehículos en comparación (>5) | Baja | Bajo | Limitar a 4 vehículos máximo |
| Prompt muy largo con datos de muchos vehículos | Media | Medio | Truncar datos, priorizar campos relevantes al focus |

---

## 8. Subfase 5.5 — Diagnósticos con datos reales del mercado

### 8.1 Objetivo

Que el endpoint `POST /api/vehicles/diagnose` proporcione diagnósticos enriquecidos con datos específicos del vehículo (año, frecuencia de problemas, especificaciones del modelo).

### 8.2 Justificación

`DiagnosisUseCase.diagnose()` (`diagnosis.py:11-30`) solo envía los síntomas y los datos que el usuario provee al LLM. No consulta la DB para obtener especificaciones reales del vehículo, que podrían ser relevantes para el diagnóstico (ej: año del vehículo, kilometraje típico, problemas conocidos del modelo).

### 8.3 Archivos a modificar

| Archivo | Cambio |
|---|---|
| `use_cases/diagnosis.py` | Usar orchestrator + automotive_tool |

### 8.4 Detalle de implementación

#### 8.4.1 Flujo de diagnóstico mejorado

```
1. Recepción: vehicle, symptoms, category, profile_id
2. Consultar automotive_data:
   a. get_vehicle_details(brand, model, year) → specs del vehículo
   b. get_model_info(brand, model) → estadísticas del modelo
3. Inyectar datos: [DIAGNOSIS_VEHICLE_DATA]
4. LLM genera diagnóstico con contexto del vehículo real
```

#### 8.4.2 Datos inyectados

```
[DIAGNOSIS_VEHICLE_DATA]
Información del vehículo reportado:
Marca: Toyota | Modelo: Corolla | Año: 2021
Combustible: gasolina | Transmisión: CVT
Cilindros: 4 | Drive: FWD
Odómetro promedio en listings: 35,000 mi
Rango de precios del modelo: $18,000 - $24,000
```

### 8.5 Testing strategy

- **Unit:** Mock automotive_tool, verificar que se llama con los datos correctos del vehículo
- **Integration:** Diagnosticar "ruido en frenos" en Toyota Corolla 2021, verificar que los datos del vehículo aparecen en el prompt

### 8.6 Criterios de aceptación

- [ ] El diagnóstico incluye especificaciones reales del vehículo desde la DB
- [ ] Si el vehículo no está en la DB, el diagnóstico funciona sin esos datos
- [ ] Los síntomas se mantienen como input del usuario
- [ ] 163 tests existentes siguen pasando

### 8.7 Dependencias

- **Pre-requisito:** 5.2 (endpoints directos usan orchestrator)
- **Bloquea:** Ninguna

### 8.8 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Vehículo del usuario no está en la DB | Media | Bajo | Fallback:诊断o sin datos de DB |
| Datos del vehículo incompletos | Media | Bajo | Usar solo campos disponibles |

---

## 9. Subfase 5.6 — Preguntas de seguimiento inteligentes

### 9.1 Objetivo

Implementar un mecanismo para que el agente detecte información faltante en el contexto del usuario y genere preguntas de seguimiento estructuradas y relevantes.

### 9.2 Justificación

Actualmente cada capability provee `get_system_prompt_enhancement()` y `get_context_enrichment()` pero no hay lógica para:
- Detectar qué información falta para una buena respuesta
- Generar preguntas específicas y contextualizadas
- Priorizar qué información es más importante obtener

El LLM decide por sí solo si preguntar, pero sin estructura ni priorización.

### 9.3 Archivos a modificar

| Archivo | Cambio |
|---|---|
| `domain/agent/capability.py` | Agregar método `get_required_fields()` a `Capability` |
| `domain/agent/capabilities/comparison.py` | Implementar `get_required_fields()` |
| `domain/agent/capabilities/recommendation.py` | Implementar `get_required_fields()` |
| `domain/agent/capabilities/diagnosis.py` | Implementar `get_required_fields()` |
| `domain/agent/registry.py` | Agregar método `detect_missing_info()` |
| `domain/agent/orchestrator.py` | Integrar `detect_missing_info()` en el flujo |

### 9.4 Archivos nuevos

| Archivo | Propósito |
|---|---|
| `domain/agent/followup.py` | Lógica de detección de información faltante |
| `tests/test_followup.py` | Tests unitarios |

### 9.5 Detalle de implementación

#### 9.5.1 Campos requeridos por intent

```python
# domain/agent/followup.py

REQUIRED_FIELDS_BY_INTENT: dict[Intent, list[FollowupField]] = {
    Intent.RECOMMENDATION: [
        FollowupField("budget", "¿Cuál es tu presupuesto?", priority=1),
        FollowupField("usage", "¿Para qué lo usarás principalmente?", priority=2),
        FollowupField("terrain", "¿Qué tipo de terreno manejas?", priority=3),
    ],
    Intent.COMPARISON: [
        FollowupField("vehicles", "¿Qué vehículos deseas comparar?", priority=1),
    ],
    Intent.DIAGNOSIS: [
        FollowupField("vehicle", "¿Qué vehículo tienes?", priority=1),
        FollowupField("symptoms", "Describe los síntomas con detalle", priority=2),
    ],
}
```

#### 9.5.2 Método `get_required_fields()` en Capability

```python
class Capability(ABC):
    def get_required_fields(self, context: CapabilityContext) -> list[FollowupField]:
        """Fields required for this capability to work optimally."""
        return []

class RecommendationCapability(Capability):
    def get_required_fields(self, context: CapabilityContext) -> list[FollowupField]:
        fields = []
        if context.budget is None:
            fields.append(FollowupField("budget", "...", priority=1))
        if not context.automotive_data:
            fields.append(FollowupField("usage", "...", priority=2))
        return fields
```

#### 9.5.3 Integración en orchestrator

```python
# En orchestrator.py, después de build_context():
missing = self._registry.detect_missing_info(classification.intent, capability_context)
if missing:
    # Agregar al system_prompt instrucciones para preguntar
    followup_block = self._format_followup_instructions(missing)
    prompt_parts.append(followup_block)
```

### 9.6 Testing strategy

- **Unit:** Verificar que cada capability retorna los campos correctos según el contexto
- **Integration:** Simular contexto sin presupuesto para RECOMMENDATION, verificar que se agrega instrucción de follow-up
- **Edge:** Contexto completo, verificar que NO se agregan follow-ups innecesarios

### 9.7 Criterios de aceptación

- [ ] Cada capability declara sus campos requeridos
- [ ] El orchestrator detecta información faltante y agrega instrucciones al prompt
- [ ] Las preguntas de seguimiento son específicas y relevantes al intent
- [ ] Si el contexto está completo, no se generan follow-ups innecesarios
- [ ] 163 tests existentes siguen pasando

### 9.8 Dependencias

- **Pre-requisito:** 5.2 (endpoints directos usan orchestrator)
- **Bloquea:** 5.7 (personalización usa campos detectados)

### 9.9 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| LLM ignora instrucciones de follow-up | Media | Balo | Usar formato estructurado, ejemplos en prompt |
| Preguntas demasiado frecuentes | Media | Medio | Umbral mínimo: solo preguntar si faltan campos de prioridad ≥ 2 |

---

## 10. Subfase 5.7 — Personalización y aprendizaje de preferencias

### 10.1 Objetivo

Expandir el perfil de usuario para capturar preferencias implícitas (marcas rechazadas, recomendaciones aceptadas, tono preferido) y usarlas para personalizar respuestas futuras.

### 10.2 Justificación

`UserProfileManager` (`profile/manager.py`) solo guarda datos atómicos (brand, budget, usage, preferences). No registra:
- Qué marcas rechazó el usuario
- Qué recomendaciones aceptó o rechazó
- Su nivel de conocimiento automotriz
- Su tono preferido (técnico vs casual)

### 10.3 Archivos a modificar

| Archivo | Cambio |
|---|---|
| `domain/models/user_profile.py` | Agregar campos de personalización |
| `infrastructure/database/models.py` | Agregar columnas a `UserProfileModel` |
| `domain/agent/profile/updater.py` | Actualizar merge con nuevos campos |
| `domain/agent/profile/manager.py` | Agregar métodos de tracking |
| `domain/agent/context/manager.py` | Usar nuevos campos en context_block |

### 10.4 Archivos nuevos

| Archivo | Propósito |
|---|---|
| `domain/agent/personalization.py` | Servicio de aprendizaje de preferencias |
| `tests/test_personalization.py` | Tests |

### 10.5 Detalle de implementación

#### 10.5.1 Nuevos campos en UserProfile

```python
# domain/models/user_profile.py
@dataclass
class UserProfile:
    # ... campos existentes ...

    # Nuevos campos Fase 5.7
    rejected_brands: list[str] = field(default_factory=list)
    accepted_recommendations: list[str] = field(default_factory=list)
    knowledge_level: str | None = None  # "beginner", "intermediate", "expert"
    preferred_tone: str | None = None    # "technical", "casual", "formal"
    interaction_count: int = 0
    last_interaction: datetime | None = None
```

#### 10.5.2 Mapeo knowledge_level → tono

```python
_KNOWLEDGE_TONE_MAP = {
    "beginner": "Explica en términos simples, evita jerga técnica",
    "intermediate": "Usa términos técnicos con explicaciones breves",
    "expert": "Usa terminología técnica completa, asume conocimiento previo",
}
```

#### 10.5.3 Tracking de interacciones

```python
class PersonalizationService:
    async def track_rejection(self, profile_id: str, brand: str) -> None:
        """Register that user rejected a brand recommendation."""
        ...

    async def track_acceptance(self, profile_id: str, recommendation: str) -> None:
        """Register that user accepted a recommendation."""
        ...

    async def infer_knowledge_level(self, profile_id: str) -> str:
        """Infer knowledge level from interaction patterns."""
        ...
```

### 10.6 Testing strategy

- **Unit:** Verificar merge de campos nuevos, tracking de rechazos/aceptaciones
- **Integration:** Simular 5 interacciones, verificar que knowledge_level se infiere correctamente
- **Regression:** Verificar que el profile existente sigue funcionando

### 10.7 Criterios de aceptación

- [ ] `UserProfile` tiene los 6 nuevos campos
- [ ] `UserProfileModel` tiene las columnas correspondientes
- [ ] `PersonalizationService` trackea rechazos y aceptaciones
- [ ] El tono de las respuestas se adapta al knowledge_level
- [ ] 163 tests existentes siguen pasando
- [ ] Migración de DB no rompe datos existentes

### 10.8 Dependencias

- **Pre-requisito:** 5.1 (historial conversacional), 5.2 (orchestrator unificado)
- **Bloquea:** Ninguna

### 10.9 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Migración de DB rompe datos existentes | Media | Alto | Usar `alter_column` con default, no recrear tabla |
| Inferencia de knowledge_level incorrecta | Media | Medio | Default a "intermediate", actualizar manualmente |

---

## 11. Subfase 5.8 — Contexto dinámico completo (AutomotiveAgentTool)

### 11.1 Objetivo

Maximizar el uso de `AutomotiveAgentTool` adaptando las queries según el intent, presupuesto, y contexto del usuario, en lugar de solo consultar vehículos y marcas mencionados.

### 11.2 Justificación

`AgentOrchestrator._fetch_automotive_data()` (`orchestrator.py:154-204`) actualmente:
- Solo consulta vehículos y marcas mencionados en el mensaje
- No usa `search_vehicles()` con filtros inteligentes
- No adapta queries según el intent (compra ≠ diagnóstico ≠ comparación)
- No usa `list_brands()` para exploración
- desperdicia el acceso a 47,030 registros

### 11.3 Archivos a modificar

| Archivo | Cambio |
|---|---|
| `domain/agent/orchestrator.py` | Reescribir `_fetch_automotive_data()` con lógica por intent |
| `domain/agent/capability.py` | Agregar `get_automotive_queries()` a `Capability` |
| `domain/agent/capabilities/*.py` | Implementar queries específicas por capability |

### 11.4 Detalle de implementación

#### 11.4.1 Nuevo flujo de `_fetch_automotive_data()`

```python
async def _fetch_automotive_data(
    self, message: str, user_context: UserContext, intent: Intent,
) -> str:
    if self._automotive_tool is None:
        return ""

    blocks: list[str] = []

    # 1. Datos de vehículos mencionados (actual)
    for vehicle in user_context.vehicles[:2]:
        # ... lógica actual ...

    # 2. Datos de marcas mencionadas (actual)
    for brand_name in user_context.mentioned_brands[:3]:
        # ... lógica actual ...

    # 3. Búsqueda inteligente según intent (NUEVO)
    if intent == Intent.RECOMMENDATION and user_context.budget:
        search_result = await self._automotive_tool.search_vehicles(
            max_price=user_context.budget * 1.15,
            limit=5,
        )
        if search_result:
            blocks.append(search_result.content)

    elif intent == Intent.COMPARISON:
        # Ya se maneja en capabilities comparison
        pass

    elif intent == Intent.DIAGNOSIS:
        # Datos del modelo para contexto de diagnóstico
        for vehicle in user_context.vehicles[:1]:
            if vehicle.brand and vehicle.model:
                model_info = await self._automotive_tool.get_model_info(
                    vehicle.brand, vehicle.model,
                )
                if model_info:
                    blocks.append(model_info.content)

    return "\n\n".join(blocks)
```

#### 11.4.2 Método `get_automotive_queries()` en Capability

```python
class Capability(ABC):
    def get_automotive_queries(
        self, context: CapabilityContext,
    ) -> list[AutomotiveQuery]:
        """Queries to execute for this capability."""
        return []

@dataclass
class AutomotiveQuery:
    method: str  # "search_vehicles", "get_vehicle_details", etc.
    params: dict
    priority: int = 1
```

### 11.5 Testing strategy

- **Unit:** Verificar que cada capability retorna queries correctas
- **Integration:** Simular intent RECOMMENDATION con budget=25000, verificar que search_vehicles se llama con max_price=28750
- **Edge:** Intent GENERAL, verificar que no se hacen queries adicionales

### 11.6 Criterios de aceptación

- [ ] `_fetch_automotive_data()` usa search_vehicles() para RECOMMENDATION
- [ ] `_fetch_automotive_data()` usa get_model_info() para DIAGNOSIS
- [ ] Las queries se adaptan según el intent detectado
- [ ] El presupuesto del usuario se usa como filtro de precio
- [ ] 163 tests existentes siguen pasando
- [ ] Ruff limpio en archivos modificados

### 11.7 Dependencias

- **Pre-requisito:** 5.2 (orchestrator unificado)
- **Bloquea:** Ninguna

### 11.8 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Queries lentas con muchos resultados | Media | Medio | Limitar results, indexar columnas de filtro |
| Datos irrelevantes inyectados | Baja | Bajo | Filtrar por relevancia al intent |

---

## 12. Orden de implementación y dependencias

### 12.1 Grafo de dependencias

```
5.1 (Memoria conversacional)
 │
 ├──→ 5.2 (Perfil en endpoints directos)
 │     │
 │     ├──→ 5.3 (Recomendaciones inteligentes)
 │     │
 │     ├──→ 5.4 (Comparaciones inteligentes)
 │     │
 │     ├──→ 5.5 (Diagnósticos con datos reales)
 │     │
 │     ├──→ 5.6 (Preguntas de seguimiento)
 │     │
 │     ├──→ 5.8 (Contexto dinámico AutomotiveAgentTool)
 │     │
 │     └──→ 5.7 (Personalización y aprendizaje)
 │
 └──→ 5.7 (Personalización y aprendizaje)
```

### 12.2 Orden recomendado

| Paso | Subfase | Dependencias | Esfuerzo estimado |
|---|---|---|---|
| 1 | **5.1** — Memoria conversacional | Ninguna | 2-3 horas |
| 2 | **5.2** — Perfil en endpoints directos | 5.1 | 3-4 horas |
| 3 | **5.8** — Contexto dinámico AutomotiveAgentTool | 5.2 | 2-3 horas |
| 4 | **5.3** — Recomendaciones inteligentes | 5.2, 5.8 | 2-3 horas |
| 5 | **5.4** — Comparaciones inteligentes | 5.2, 5.8 | 2-3 horas |
| 6 | **5.5** — Diagnósticos con datos reales | 5.2, 5.8 | 1-2 horas |
| 7 | **5.6** — Preguntas de seguimiento | 5.2 | 2-3 horas |
| 8 | **5.7** — Personalización y aprendizaje | 5.1, 5.2 | 3-4 horas |

**Total estimado:** 17-25 horas de desarrollo

### 12.3 Justificación del orden

1. **5.1 primero:** Es la base para todo lo demás (memoria cross-conversación)
2. **5.2 segundo:** Unifica los endpoints bajo el orchestrator, habilitando todo lo demás
3. **5.8 tercero:** Maximiza AutomotiveAgentTool antes de crear features que lo usen
4. **5.3-5.5 en paralelo:** Son independientes entre sí, todos usan 5.2+5.8
5. **5.6 después de 5.2:** Necesita orchestrator unificado para detectar info faltante
6. **5.7 al final:** Es el más complejo y depende de 5.1+5.2

---

## 13. Matriz de trazabilidad

### 13.1 Objetivos oficiales → Subfases

| Objetivo Fase 5 | Subfase(s) |
|---|---|
| Memoria conversacional | 5.1 |
| Perfil persistente propagado | 5.2 |
| Recomendaciones inteligentes | 5.3, 5.8 |
| Comparaciones inteligentes | 5.4, 5.8 |
| Preguntas de seguimiento | 5.6 |
| Personalización | 5.7 |
| Contexto dinámico | 5.8 |
| Uso completo de AutomotiveAgentTool | 5.3, 5.4, 5.5, 5.8 |

### 13.2 Subfase → Archivos modificados

| Subfase | Archivos modificados | Archivos nuevos |
|---|---|---|
| 5.1 | `context/manager.py`, `use_cases/chat.py`, `dependencies.py` | `context/history_service.py`, `templates/agent_conversation_history.txt`, `tests/test_conversation_history.py` |
| 5.2 | `use_cases/diagnosis.py`, `use_cases/recommendation.py`, `use_cases/vehicle_comparison.py`, `dependencies.py`, `api/v1/router.py`, `api/schemas/vehicle.py` | — |
| 5.3 | `use_cases/recommendation.py`, `capabilities/recommendation.py` | — |
| 5.4 | `use_cases/vehicle_comparison.py`, `capabilities/comparison.py` | — |
| 5.5 | `use_cases/diagnosis.py` | — |
| 5.6 | `capability.py`, `capabilities/*.py`, `registry.py`, `orchestrator.py` | `followup.py`, `tests/test_followup.py` |
| 5.7 | `user_profile.py`, `models.py`, `updater.py`, `manager.py`, `context/manager.py` | `personalization.py`, `tests/test_personalization.py`, migración SQL |
| 5.8 | `orchestrator.py`, `capability.py`, `capabilities/*.py` | — |

### 13.3 Subfase → Tests afectados/nuevos

| Subfase | Tests existentes afectados | Tests nuevos |
|---|---|---|
| 5.1 | `test_orchestrator_automotive.py` (posible cambio de firma) | `test_conversation_history.py` |
| 5.2 | `test_capabilities_automotive.py` (posible cambio de firma) | Tests de integración para 3 use cases |
| 5.3-5.5 | Ninguno | Tests por cada use case modificado |
| 5.6 | Ninguno | `test_followup.py` |
| 5.7 | Tests de profile (si existen) | `test_personalization.py` |
| 5.8 | `test_orchestrator_automotive.py` | Tests de queries por intent |

---

## 14. Estrategia de testing

### 14.1 Niveles de testing

| Nivel | Cobertura | Herramienta |
|---|---|---|
| Unit | Funciones aisladas, mocks | pytest + pytest-asyncio |
| Integration | Use cases + repos (SQLite) | pytest + SQLite in-memory |
| Regression | Todos los tests existentes | `pytest backend/tests/ -v` |
| Lint | Calidad de código | `ruff check backend/app/` |

### 14.2 Comandos de verificación

```bash
# Todos los tests
cd backend && python -m pytest tests/ -v

# Tests específicos de una subfase
python -m pytest tests/test_conversation_history.py -v
python -m pytest tests/test_followup.py -v
python -m pytest tests/test_personalization.py -v

# Lint
ruff check app/

# Verificar que no aumentó el debt
ruff check app/ | grep -c "E\|W\|F"
```

### 14.3 Criterios de testing por subfase

| Subfase | Tests nuevos mínimo | Coverage mínimo | Tests existentes |
|---|---|---|---|
| 5.1 | 5 | 80% | 163 passed |
| 5.2 | 3 (1 por use case) | 80% | 163 passed |
| 5.3 | 3 | 80% | 163 passed |
| 5.4 | 3 | 80% | 163 passed |
| 5.5 | 2 | 80% | 163 passed |
| 5.6 | 5 | 80% | 163 passed |
| 5.7 | 5 | 80% | 163 passed |
| 5.8 | 4 | 80% | 163 passed |

### 14.4 Anti-regresión

- Antes de cada subfase: ejecutar `pytest tests/ -v` y confirmar 163 passed
- Después de cada subfase: ejecutar `pytest tests/ -v` y confirmar que no bajó de 163
- Si algún test existente falla: FIX PRIMERO, no continuar con la subfase
- `ruff check` debe mantener ≤ 5 errores en app code (deuda existente)

---

## 15. Riesgos y mitigaciones

### 15.1 Riesgos globales

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Breaking changes rompen 163 tests | Media | Crítico | Ejecutar tests después de CADA cambio, no al final |
| R2 | Latencia excesiva al consultar DB | Media | Alto | Cache de profile, limitar queries, índices en DB |
| R3 | Prompt overflow (demasiados datos) | Media | Medio | Limitar bloques a 500 tokens cada uno, truncar |
| R4 | Migración de DB rompe datos | Baja | Alto | Usar ALTER TABLE con defaults, testear en SQLite primero |
| R5 | Ruff debt increase | Media | Bajo | Verificar lint en cada PR, no merge con errores nuevos |
| R6 | LLM no respeta instrucciones de follow-up | Media | Medio | Usar XML tags estructurados, few-shot examples |
| R7 | Complejidad excesiva del orchestrator | Media | Medio | Separar en helper methods, mantener单一 responsabilidad |

### 15.2 Riesgos por subfase

| Subfase | Riesgo principal | Mitigación |
|---|---|---|
| 5.1 | Performance al consultar historial | Cache, limit=5, async |
| 5.2 | Breaking changes en endpoints | Profile_id opcional, default fallback |
| 5.3 | Resultados irrelevantes | Filtros estrictos, limit=5 |
| 5.4 | Prompt overflow | Truncar datos por vehicle |
| 5.5 | Diagnóstico sin datos de DB | Fallback graceful |
| 5.6 | Follow-ups innecesarios | Umbral de prioridad |
| 5.7 | Migración de DB | ALTER TABLE seguro |
| 5.8 | Queries lentas | Índices, cache, limit |

---

## 16. Criterios de cierre de fase

### 16.1 Requisitos obligatorios

- [ ] Todos los 8 objetivos oficiales de Fase 5 implementados
- [ ] 163 tests existentes siguen pasando (0 regressions)
- [ ] Tests nuevos ≥ 30 (acumulado de todas las subfases)
- [ ] Ruff debt no increase: ≤ 5 errores en app code
- [ ] `POST /api/chat` usa memoria conversacional cross-sesión
- [ ] `POST /api/vehicles/recommend` retorna datos reales de 47K vehículos
- [ ] `POST /api/vehicles/compare` incluye datos de mercado por vehículo
- [ ] `POST /api/vehicles/diagnose` incluye specs del vehículo desde DB
- [ ] AutomotiveAgentTool usa search_vehicles() con filtros inteligentes
- [ ] Perfil de usuario se propaga en todos los endpoints
- [ ] Preguntas de seguimiento generadas cuando falta info clave
- [ ] Personalización: knowledge_level y preferred_tone funcionando

### 16.2 Requisitos de calidad

- [ ] Todos los archivos nuevos pasan Ruff sin errores
- [ ] Cobertura de tests ≥ 80% en archivos nuevos
- [ ] Docstrings en todas las clases y métodos públicos nuevos
- [ ] Type hints completos en todo código nuevo
- [ ] Sin imports circulares
- [ ] Sin secrets o keys en código

### 16.3 Requisitos de documentación

- [ ] `DOCUMENTACION_TECNICA.md` actualizado con Fase 5 completada
- [ ] README.md actualizado si cambian instrucciones de setup
- [ ] Changelog actualizado con features de Fase 5

### 16.4 Requisitos de deploy

- [ ] Migración de DB ejecutada sin errores
- [ ] App inicia sin errores con DB existente
- [ ] Docker build exitoso
- [ ] Health check pass

---

## Resumen ejecutivo

La Fase 5 transforma AutoExpert AI de un chatbot con contexto limitado a un asistente conversacional inteligente con:

1. **Memoria:** Recuerda conversaciones anteriores
2. **Perfil propagado:** Todos los endpoints conocen al usuario
3. **Datos reales:** Recomendaciones, comparaciones y diagnósticos basados en 47,030 vehículos
4. **Seguimiento:** Pregunta lo que falta, no responde a ciegas
5. **Personalización:** Aprende del usuario y adapta respuestas
6. **Contexto dinámico:** AutomotiveAgentTool se usa al máximo

**Orden de implementación:** 5.1 → 5.2 → 5.8 → 5.3/5.4/5.5 → 5.6 → 5.7  
**Esfuerzo estimado:** 17-25 horas  
**Riesgo principal:** Breaking changes (mitigado con tests continuos)
