# AutoExpert AI — Documentación Técnica Completa

> **Estado del documento:** Fase 5 completada (Experiencia Conversacional Inteligente)
> **Fecha de generación:** Julio 2026
> **Versión de la aplicación:** 0.3.0
> **Objetivo:** Permitir que una IA o desarrollador continúe el desarrollo sin necesidad de historial previo.

---

## Índice

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Arquitectura Actual](#2-arquitectura-actual)
3. [Componentes Implementados](#3-componentes-implementados)
4. [Base de Datos](#4-base-de-datos)
5. [Funcionalidades Implementadas](#5-funcionalidades-implementadas)
6. [Flujo Completo de una Conversación](#6-flujo-completo-de-una-conversación)
7. [Estado de Pruebas](#7-estado-de-pruebas)
8. [Decisiones Técnicas Importantes](#8-decisiones-técnicas-importantes)
9. [Deuda Técnica Actual](#9-deuda-técnica-actual)
10. [Estado del Proyecto](#10-estado-del-proyecto)
11. [Roadmap Restante](#11-roadmap-restante)
12. [Recomendaciones para Continuar](#12-recomendaciones-para-continuar)
13. [Auditoría de consistencia](#auditoría-de-consistencia)

---

## 1. Visión General del Proyecto

### 1.1 Objetivo del Sistema

AutoExpert AI es un **chatbot conversacional especializado en el sector automotriz** diseñado para el mercado latinoamericano. El sistema responde preguntas sobre vehículos utilizando un LLM (Large Language Model) aumentado con una base de datos estructurada de datos automotrices reales (precios, especificaciones, estadísticas de mercado).

El chatbot cubre tres dominios principales:
- **Comparación de vehículos** — Análisis comparativo entre 2 o más autos.
- **Diagnóstico mecánico** — Orientación sobre fallas, causas probables y acciones recomendadas.
- **Recomendaciones de compra** — Sugerencias personalizadas según presupuesto, uso y preferencias.

### 1.2 Stack Tecnológico

| Capa | Tecnología | Versión (requerida) | Versión (runtime real) |
|------|-----------|---------------------|----------------------|
| **Backend** | Python | >= 3.13 | 3.14.6 |
| **Framework Web** | FastAPI | >= 0.115.0 | — |
| **ORM / DB Async** | SQLAlchemy (asyncio) | >= 2.0.36 | — |
| **Driver PostgreSQL** | asyncpg | >= 0.30.0 | — |
| **Migraciones** | Alembic | >= 1.14.0 | — |
| **Configuración** | pydantic-settings | >= 2.6.0 | — |
| **HTTP Client** | httpx | >= 0.28.0 | — |
| **Plantillas** | Jinja2 | >= 3.1.4 | — |
| **LLM Provider** | OpenRouter API | — | — |
| **Modelo LLM** | OpenRouter (configurable) | — | `openrouter/free` (en .env) |
| **Linting** | Ruff | >= 0.8.0 | 0.15.21 |
| **Type Checking** | Mypy (strict) | >= 1.13.0 | — |
| **Testing** | pytest + pytest-asyncio | >= 8.3.0 | 9.1.1 |
| **Frontend** | React 18 + TypeScript | — |
| **Framework CSS** | Tailwind CSS 3.4 | — |
| **State Management** | Zustand 5 | — |
| **Build Tool** | Vite 6 | — |
| **Base de Datos** | PostgreSQL 18.0 (native) | — | Docker Compose define postgres:16-alpine, real instance is 18.0 |
| **Contenedores** | Docker Compose | — |

### 1.3 Arquitectura General

El sistema sigue una arquitectura de **Clean Architecture / Hexagonal** desplegada con **Docker Compose** en 3 servicios:

```
┌───────────────────────────────────────────────────────────────────┐
│                     Docker Compose (3 servicios)                   │
│                                                                   │
│  ┌────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │ PostgreSQL │◄───│   Backend (API)    │◄───│ Frontend (SPA)  │  │
│  │   :5432    │    │  FastAPI :8000     │    │  Vite :5173     │  │
│  │ (18.0*)    │    │                    │    │                 │  │
│  └────────────┘    └────────────────────┘    └─────────────────┘  │
│                          │                                        │
│                     OpenRouter LLM                                │
│                  (modelo configurable vía .env)                    │
└───────────────────────────────────────────────────────────────────┘

* Docker Compose define image postgres:16-alpine, pero la instancia
  real reporta PostgreSQL 18.0 (instalación nativa en Windows).
```

---

## 2. Arquitectura Actual

### 2.1 Backend

El backend está organizado en capas siguiendo Clean Architecture:

```
backend/app/
├── main.py                          # Entry point, Application Factory
├── config.py                        # Settings (pydantic-settings)
├── dependencies.py                  # Dependency Injection (FastAPI DI)
│
├── api/                             # Capa de presentación (HTTP)
│   ├── v1/
│   │   ├── router.py               # Rutas principales (chat, conversaciones)
│   │   └── automotive.py           # Rutas de datos automotrices
│   └── schemas/                    # DTOs Pydantic para request/response
│       ├── chat.py
│       ├── conversation.py
│       ├── vehicle.py
│       └── automotive.py
│
├── domain/                          # Capa de dominio (sin dependencias de framework)
│   ├── models/                     # Modelos de datos (dataclasses puras)
│   │   ├── vehicle.py
│   │   ├── message.py
│   │   ├── conversation.py
│   │   ├── user_profile.py
│   │   ├── diagnosis.py
│   │   └── automotive.py
│   ├── interfaces/                 # Interfaces abstractas (puertos)
│   │   ├── repository.py
│   │   └── llm_provider.py
│   ├── agent/                      # Lógica del agente inteligente
│   │   ├── orchestrator.py
│   │   ├── intent_classifier.py
│   │   ├── intent.py
│   │   ├── registry.py
│   │   ├── capability.py
│   │   ├── followup.py              # FollowupField (Fase 5.3)
│   │   ├── automotive_tool.py
│   │   ├── capabilities/           # Capacidades por intención
│   │   │   ├── comparison.py
│   │   │   ├── diagnosis.py
│   │   │   └── recommendation.py
│   │   ├── context/                # Gestión de contexto
│   │   │   ├── extractor.py
│   │   │   ├── manager.py
│   │   │   └── user_context.py
│   │   ├── profile/                # Perfil de usuario
│   │   │   ├── manager.py
│   │   │   └── updater.py
│   │   ├── memory.py               # ConversationMemoryService (Fase 5.7)
│   └── exceptions.py               # Excepciones del dominio
│
├── infrastructure/                  # Capa de infraestructura
│   ├── database/
│   │   ├── connection.py           # Engine async, session factory
│   │   ├── models.py              # Modelos ORM (SQLAlchemy)
│   │   ├── mappers.py             # ORM → DTO mappers
│   │   └── repositories/          # Implementaciones de repositorios
│   │       ├── automotive_repo.py
│   │       ├── conversation_repo.py
│   │       └── user_profile_repo.py
│   ├── llm/
│   │   └── openrouter.py          # Cliente OpenRouter con retry/SSE
│   └── agent/
│       └── automotive_tool_impl.py # Adaptador repo → VehicleDataBlock
│
├── use_cases/                       # Casos de uso (orquestación de lógica)
│   ├── chat.py
│   ├── conversations.py
│   ├── recommendation.py
│   ├── diagnosis.py
│   └── vehicle_comparison.py
│
├── prompts/                         # Sistema de plantillas de prompts
│   ├── loader.py                   # Jinja2 loader con filtro format_number
│   └── templates/                  # 8 plantillas .txt
│       ├── base.txt
│       ├── recommendation.txt
│       ├── diagnosis.txt
│       ├── vehicle_comparison.txt
│       ├── agent_recommendation_enhancement.txt
│       ├── agent_diagnosis_enhancement.txt
│       ├── agent_comparison_enhancement.txt
│       └── agent_context_block.txt
│
├── scripts/                         # Scripts auxiliares
│   ├── inspect_automotive_schema.py
│   └── validate_automotive_api.py
│
└── tests/                           # Suite de pruebas (311 tests, 289 passed)
    └── 14 archivos de test
```

### 2.2 Frontend

SPA de React 18 con estética glassmorphism premium, diseño oscuro con acentos dorados y neón:

```
frontend/src/
├── main.tsx                         # Entry point (React 18 createRoot)
├── App.tsx                          # Layout de 3 paneles + orbes ambientales
├── globals.css                      # Tailwind + 20 clases de componentes glass
│
├── api/
│   ├── client.ts                   # Cliente HTTP/SSE (fetch + ReadableStream)
│   └── conversations.ts            # Wrapper de endpoints de conversación
│
├── stores/                          # Estado global (Zustand)
│   ├── chatStore.ts                # Mensajes, streaming, filtros físicos
│   ├── conversationStore.ts        # Lista de conversaciones
│   └── garageStore.ts              # Garaje virtual (persistencia localStorage)
│
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx          # Ventana principal con auto-scroll
│   │   ├── MessageInput.tsx        # Input con auto-resize y contador
│   │   ├── MessageBubble.tsx       # Burbujas usuario/asistente + markdown
│   │   ├── StreamingIndicator.tsx  # Indicador de escritura (dots pulsantes)
│   │   └── PhysicalPanel.tsx       # Panel de filtros físicos (presupuesto/terreno/motor)
│   ├── vehicle/
│   │   ├── CarCard.tsx             # Tarjeta 3D con radar chart SVG
│   │   ├── VehicleForm.tsx         # Formulario de comparación (2-5 autos)
│   │   ├── DiagnosisForm.tsx       # Formulario de diagnóstico
│   │   └── ComparisonResult.tsx    # Resultado de comparación en markdown
│   ├── sidebar/
│   │   ├── Sidebar.tsx             # Barra lateral izquierda (conversaciones)
│   │   └── GarageSidebar.tsx       # Panel derecho (garaje virtual + comparar)
│   └── ui/
│       ├── Button.tsx              # 7 variantes (primary, neon, gold, etc.)
│       ├── Card.tsx                # Card/CardHeader/CardContent
│       ├── Input.tsx               # Input con label y error
│       └── Skeleton.tsx            # Placeholder de carga con shimmer
│
├── types/
│   ├── chat.ts                     # Message, Conversation, ChatRequest, etc.
│   └── vehicle.ts                  # Vehicle, GarageVehicle, VehicleScores, etc.
│
├── utils/
│   ├── cn.ts                       # clsx + tailwind-merge
│   └── carBlockParser.ts           # Parser de bloques [CAR]...[/CAR]
│
└── config/
    └── constants.ts                # Constantes (marcas, categorías, límites)
```

### 2.3 Base de Datos

Una sola instancia PostgreSQL 18.0 con el nombre `autoexpert_db` que contiene 6 tablas (3 de la aplicación, 3 de datos automotrices pre-cargados). Ver sección 4 para detalles completos.

### 2.4 Clean Architecture

La separación en capas es estricta:

```
┌─────────────────────────────────────────────────┐
│  API Layer (FastAPI Routers + Pydantic Schemas) │  ← HTTP request/response
├─────────────────────────────────────────────────┤
│  Use Cases (orquestación de lógica de negocio)  │  ← Casos de uso concretos
├─────────────────────────────────────────────────┤
│  Domain Layer (modelos, interfaces, agente)     │  ← Sin dependencias de framework
├─────────────────────────────────────────────────┤
│  Infrastructure (SQLAlchemy, OpenRouter, etc.)  │  ← Implementación concreta
└─────────────────────────────────────────────────┘
```

**Reglas de dependencia:**
- Domain **nunca** importa de Infrastructure, API o Use Cases.
- Infrastructure implementa interfaces definidas en Domain.
- Use Cases dependen de Domain (interfaces) y son inyectados por FastAPI DI.
- API depende de Use Cases y Domain (schemas Pydantic).

### 2.5 Flujo Completo del Agente

```
Mensaje del usuario (texto en español)
         │
         ▼
┌─────────────────────┐
│   IntentClassifier  │  ← Clasificación por reglas (regex + keywords)
│  (4 intenciones)     │     general | comparison | diagnosis | recommendation
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   ContextManager    │  ← Extrae contexto del mensaje + carga perfil de DB
│   ├─ Extractor      │     (marcas, vehículos, presupuesto, uso, síntomas)
│   ├─ ProfileManager │     Fusiona con perfil persistente (existing-data-wins)
│   └─ MemoryService  │     Carga resúmenes de conversaciones anteriores
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│  CapabilityRegistry      │  ← detect_missing_info(): detecta campos faltantes
│  └─ Follow-up Detection  │     Genera instrucciones de seguimiento si falta info
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  AutomotiveAgentTool     │  ← Consulta PostgreSQL para datos reales
│  └─ Intent-Aware Query  │     Adapta queries según intención (Fase 5.2)
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  CapabilityRegistry      │  ← Selecciona capabilities según intención
│  └─ Capability.build()   │     Mejora el system prompt con reglas
│     + Follow-up Block    │     anti-alucinación y datos automotrices
└────────┬─────────────────┘     + instrucciones de seguimiento
         │
         ▼
┌──────────────────────────┐
│  Prompt Assembly         │  ← Prompt base + contexto + resúmenes + mejoras
│  (Jinja2 templates)      │     + datos automotrices + follow-up
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  OpenRouter LLM          │  ← Streaming token por token vía SSE
│  (Modelo configurable)   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Frontend SSE Stream     │  ← Parseo de bloques [CAR] → CarCards
│  + CarCard Rendering     │     con radar charts SVG interactivos
└──────────────────────────┘
```

### 2.6 Componentes Principales y Cómo Interactúan

| Componente | Rol | Dependencias |
|------------|-----|-------------|
| `AgentOrchestrator` | Orquestador central del agente | LLMProvider, CapabilityRegistry, ContextManager, IntentClassifier, AutomotiveAgentTool |
| `IntentClassifier` | Clasifica la intención del usuario (4 tipos) | Ninguna (auto-contenido) |
| `ContextManager` | Construye el contexto completo del usuario | ContextExtractor, UserProfileManager, ConversationRepository, ConversationMemoryService |
| `ContextExtractor` | Extrae datos del texto (regex NLP en español) | Ninguno |
| `UserProfileManager` | Gestiona perfil persistente en DB | UserProfileRepository, ProfileUpdater |
| `ProfileUpdater` | Fusiona perfiles (existing-data-wins) | Ninguno |
| `ConversationMemoryService` | Genera resúmenes de conversaciones previas | ContextExtractor |
| `AutomotiveAgentTool` | Consulta DB y formatea datos para el prompt | AutomotiveRepository |
| `AutomotiveRepository` | Acceso a datos automotrices en PostgreSQL | SQLAlchemy AsyncSession |
| `CapabilityRegistry` | Registra y selecciona capabilities por intención | Capability (interface) |
| `Capability` (3 impl.) | Enriquece el system prompt según intención | Ninguno |
| `ChatUseCase` | Caso de uso de chat con streaming | AgentOrchestrator, ConversationRepo, MessageRepo |
| `OpenRouterProvider` | Cliente HTTP/SSE para OpenRouter API | httpx, Settings |

**Cadena de inyección de dependencias (dependencies.py):**

```
Settings
  → OpenRouterProvider(llm)
  → SQLAlchemyConversationRepository(session)
  → SQLAlchemyMessageRepository(session)
  → SQLAlchemyUserProfileRepository(session)
  → SqlAlchemyAutomotiveRepository(session)
  → IntentClassifier()
  → ContextExtractor()
  → ProfileUpdater()
  → UserProfileManager(repo, updater)
  → ConversationMemoryService(context_extractor)
  → ContextManager(extractor, profile_manager, conversation_repo, memory_service)
  → SqlAlchemyAutomotiveAgentTool(automotive_repo)
  → CapabilityRegistry([Comparison, Diagnosis, Recommendation])
  → AgentOrchestrator(llm, registry, context_manager, classifier, automotive_tool)
  → ChatUseCase(orchestrator, conversation_repo, message_repo)
  → ConversationUseCase(conversation_repo, message_repo)
```

---

## 3. Componentes Implementados

### 3.1 AgentOrchestrator

**Archivo:** `backend/app/domain/agent/orchestrator.py`

Orquestador central que coordina todo el pipeline del agente. Recibe un mensaje, clasifica la intención, construye el contexto, consulta datos automotrices de forma intent-aware y ensambla el system prompt completo con instrucciones de seguimiento.

**Métodos principales:**
- `classify_intent(message, budget, terrain, engine_type)` → `ClassificationResult`
- `orchestrate(message, history, budget, terrain, engine_type, profile_id, focus, usage)` → `OrchestrationResult`
- `_fetch_automotive_data(intent, user_context)` → `str` (bloques de datos formateados, adaptados según intención)
- `_fetch_recommendation_data(user_context)` → `str` (búsqueda por presupuesto, uso y tipo)
- `_fetch_comparison_data(user_context)` → `str` (details×2 + model_info×2 con dedup)
- `_fetch_diagnosis_data(user_context)` → `str` (details + model_info del vehículo)
- `_map_usage_to_vehicle_type(usage)` → `str` (urbano→sedan, familiar→suv, trabajo→truck, etc.)
- `_format_followup_instructions(missing_fields)` → `str` (bloque CRÍTICO/IMPORTANTE/COMPLEMENTARIO)

**Parámetros de orchestrate():**
- `message` — Texto del usuario
- `history` — Lista de mensajes previos
- `budget` — Presupuesto en USD (opcional)
- `terrain` — Tipo de terreno (opcional)
- `engine_type` — Tipo de motor (opcional)
- `profile_id` — ID del perfil (opcional, default None)
- `focus` — Enfoque de comparación (default "all")
- `usage` — Tipo de uso (opcional)

**Estado:** Completamente funcional. Integra clasificación, contexto, memoria, datos automotrices intent-aware, capabilities e instrucciones de seguimiento en un solo flujo.

### 3.2 IntentClassifier

**Archivo:** `backend/app/domain/agent/intent_classifier.py`

Clasificador basado en reglas (sin llamadas a LLM). Utiliza pesos, keywords y expresiones regulares en español.

**Intenciones soportadas:**
| Intención | Keywords de ejemplo | Pesos |
|-----------|-------------------|-------|
| `GENERAL` | saludos, despedidas, agradecimientos | 1.0 (default) |
| `COMPARISON` | comparar, diferencia, mejor | 1.0 |
| `DIAGNOSIS` | falla, problema, ruido, vibracion | 1.2 (boosted) |
| `RECOMMENDATION` | recomendar, comprar, presupuesto, auto ideal | 1.0 (+2.0 si hay budget) |

**Boosts contextuales:**
- Si se proporciona `budget` → RECOMMENDATION +2.0
- Si se proporciona `terrain` o `engine_type` → RECOMMENDATION +0.5

**Estado:** Completamente funcional. No requiere llamadas externas, respuesta instantánea.

### 3.3 CapabilityRegistry

**Archivo:** `backend/app/domain/agent/registry.py`

Registro de capacidades extensible. Cada `Capability` se asocia a una o más intenciones y provee mejoras al system prompt. Incluye detección de información faltante para generar preguntas de seguimiento.

**Capabilities registradas:**
1. `ComparisonCapability` → intención COMPARISON
2. `DiagnosisCapability` → intención DIAGNOSIS
3. `RecommendationCapability` → intención RECOMMENDATION

**Métodos:**
- `register(capability)` — Agrega una capability
- `get_capabilities_for_intent(intent)` — Filtra por intención
- `build_system_prompt(intent, context)` — Concatena mejoras de todas las capabilities aplicables
- `build_context_enrichment(intent, context)` — Concatena enriquecimientos de contexto
- `detect_missing_info(intent, context)` — Detecta campos requeridos faltantes y retorna lista de `FollowupField` ordenada por prioridad

**Campos requeridos por capability (Fase 5.3):**
- RECOMMENDATION: budget (prioridad 1), usage (prioridad 2), terrain (prioridad 3)
- COMPARISON: vehicles (prioridad 1)
- DIAGNOSIS: vehicle (prioridad 1), symptoms (prioridad 2)

**Estado:** Completamente funcional. Extensible para nuevas capabilities. Detecta información faltante para preguntas de seguimiento.

### 3.4 Capabilities

#### ComparisonCapability
**Archivo:** `backend/app/domain/agent/capabilities/comparison.py`
- Renderiza `agent_comparison_enhancement.txt`
- **Focus guidance (Fase 5.5):** Guía específica según enfoque: performance (potencia, tracción), economy (consumo, eficiencia), safety (airbags, frenos), value (depreciación, costo/beneficio), comfort (espacio, equipamiento)
- Si hay `automotive_data` en el contexto, agrega reglas anti-alucinación con los datos reales y solicita cita datos específicos
- Context enrichment: pide tabla comparativa, análisis por categorías (motor, seguridad, confort, economía, confiabilidad), pros/contras, recomendación final

#### DiagnosisCapability
**Archivo:** `backend/app/domain/agent/capabilities/diagnosis.py`
- Renderiza `agent_diagnosis_enhancement.txt`
- Si hay `automotive_data` en el contexto, inyecta datos específicos del vehículo con reglas anti-alucinación (no inventar datos no proporcionados)
- Context enrichment: solicita diagnóstico estructurado con causas probables, acciones recomendadas y nivel de urgencia
- Siempre recomienda consultar a un mecánico certificado
- Referencia dinámica a información del vehículo, síntomas descritos y datos disponibles

#### RecommendationCapability
**Archivo:** `backend/app/domain/agent/capabilities/recommendation.py`
- Renderiza `agent_recommendation_enhancement.txt`
- **Usage guidance (Fase 5.4):** Guía específica según uso: urbano→sedan/hatchback, familiar→SUV/minivan, trabajo→truck/van, carga→truck/van, deportivo→coupé/convertible, offroad→SUV/truck 4x4, ruta→sedan/SUV
- Si hay `automotive_data`, los datos de DB se consideran "fuente principal" y se agregan reglas anti-alucinación
- Context enrichment: adapta recomendación a presupuesto, terreno, tipo de motor, uso, tamaño familiar
- Solicita 3-5 recomendaciones con bloques `[CAR]` estructurados

**Estado:** Las 3 capabilities están completamente funcionales con guías específicas por usage y focus.

### 3.5 ContextManager

**Archivo:** `backend/app/domain/agent/context/manager.py`

Coordina la extracción de contexto del mensaje actual con el perfil persistente del usuario y la memoria de conversaciones anteriores.

**Constructor:** `ContextManager(extractor, profile_manager, conversation_repo, memory_service)`

**Flujo:**
1. Carga perfil de DB (si profile_manager existe)
2. Extrae nuevos datos del historial de mensajes
3. Convierte contexto extraído a perfil
4. Fusiona con perfil existente (existing-data-wins)
5. Convierte perfil fusionado de vuelta a UserContext
6. Carga resúmenes de conversaciones anteriores (excluyendo la actual)
7. Renderiza bloque de contexto para el prompt (con resúmenes previos)

**Métodos adicionales:**
- `update_conversation_summary(conversation_id, messages)` — Genera y persiste resumen de la conversación usando ConversationMemoryService

**Estado:** Completamente funcional. Integra extractor, perfil, memoria cross-conversación y rendering de prompt.

### 3.6 UserProfileManager

**Archivos:** `backend/app/domain/agent/profile/manager.py` y `updater.py`

Gestiona el perfil persistente del usuario con estrategia de fusión "existing-data-wins":
- Los campos existentes nunca se sobreescriben con None
- Las listas (preferences, mentioned_brands) se fusionan por unión deduplicada
- Solo guarda si hay cambios reales (comparación de 12 campos)

**Campos del perfil:**
- Vehículo principal (brand, model, year, engine)
- Presupuesto, terreno, tipo de motor, uso
- Preferencia de combustible, tamaño familiar
- Preferencias (lista), marcas mencionadas (lista), marcas favoritas (lista)

**Estado:** Completamente funcional. Persiste en PostgreSQL.

### 3.7 AutomotiveRepository

**Archivo:** `backend/app/infrastructure/database/repositories/automotive_repo.py`

Repositorio concreto para acceso a las tablas de datos automotrices (pre-existentes, no gestionadas por la app).

**Métodos:**
- `search_vehicles(manufacturer, model, year, min/max_price, fuel, transmission, vehicle_type, limit, offset)` → `list[VehicleSummary]`
- `get_vehicle_details(manufacturer, model, year)` → `list[VehicleSummary]`
- `get_model_stats(manufacturer, model)` → `VehicleMarketSummary | None`
- `get_brand_stats(manufacturer)` → `BrandSummary | None`
- `list_brands(limit, offset)` → `list[BrandSummary]`
- `health_check()` → `bool`

**Características:**
- Case-insensitive en búsquedas de manufacturer
- Límites clamped (limit: 1-50, offset: >= 0)
- Manejo de errores con logging y retorno seguro (vacío en vez de excepción)
- Ordered by relevance (listing_count, year, manufacturer)

**Estado:** Completamente funcional. 47,030 vehículos, 20,036 stats de mercado, 40 marcas indexadas.

### 3.8 AutomotiveAgentTool

**Archivo:** `backend/app/infrastructure/agent/automotive_tool_impl.py`

Adaptador que formatea los resultados del repositorio en bloques `VehicleDataBlock` optimizados para inyección en prompts de LLM.

**Bloques formateados:**
| Método | Bloque | Contenido |
|--------|--------|-----------|
| `search_vehicles` | `[VEHICLE_SEARCH_RESULTS]` | Lista de vehículos con precio, millas, specs |
| `get_vehicle_details` | `[VEHICLE_DETAILS]` | Detalle por año, especificaciones |
| `get_brand_info` | `[BRAND_INFO]` | Estadísticas de la marca |
| `get_model_info` | `[MODEL_INFO]` | Estadísticas del modelo |
| `list_brands` | `[BRAND_LIST]` | Listado de marcas disponibles |

**Formato de precios:** `$X,XXX` o `N/A`
**Formato de odómetro:** `X,XXX mi` o `N/A`

**Estado:** Completamente funcional. Transforma datos de DB a formato amigable para LLM.

### 3.9 OpenRouter (LLM Provider)

**Archivo:** `backend/app/infrastructure/llm/openrouter.py`

Cliente para la API de OpenRouter con soporte completo de streaming SSE.

**Características:**
- **Retry con backoff:** Hasta 3 reintentos en HTTP 429 (rate limit), respeta `retry-after` header (máx 30s)
- **Streaming SSE:** Parseo línea por línea de `data: {json}`, extracción de `choices[0].delta.content`
- **Timeout:** 120 segundos por request
- **Headers:** Authorization Bearer, Content-Type, HTTP-Referer, X-Title
- **Modos:** `stream_chat()` (AsyncIterator) y `chat()` (respuesta completa)
- **Errores:** `LLMProviderError` para fallos generales, `LLMRateLimitError` con `retry_after`

**Estado:** Completamente funcional. Modelo configurable vía `.env` (default: DeepSeek Chat V3).

### 3.10 Streaming SSE

**Backend:** FastAPI `StreamingResponse` con media type `text/event-stream` en `POST /api/chat`. Cada chunk es un `ChatStreamChunk` JSON serializado con `data: ` prefix.

**Frontend:** `apiClient.streamChat()` lee el body como `ReadableStream`, parsea líneas SSE manualmente con buffer para chunks incompletos. Soporta abort vía `AbortController`. El `chatStore` acumula tokens en `streamingContent` y crea el mensaje final al recibir `done: true`.

**Estado:** Completamente funcional. Incluye manejo de errores, cancelación y reconexión.

### 3.11 Repositorios

| Repositorio | Tabla(s) | Métodos |
|-------------|----------|---------|
| `SQLAlchemyConversationRepository` | `conversations` | create, update, get_by_id, get_all, get_recent, delete |
| `SQLAlchemyMessageRepository` | `messages` | create, get_by_conversation, get_last_n |
| `SQLAlchemyUserProfileRepository` | `user_profiles` | get_by_id, get_or_create, update |
| `SqlAlchemyAutomotiveRepository` | `vehicles_master`, `vehicle_market_stats`, `brands` | search_vehicles, get_vehicle_details, get_model_stats, get_brand_stats, list_brands, health_check |

**Estado:** Todos completamente funcionales. Los primeros 3 gestionan datos de la app; el 4to accede a datos pre-cargados.

### 3.12 API REST

#### Rutas Principales (`/api`)

| Método | Ruta | Función | Descripción |
|--------|------|---------|-------------|
| `POST` | `/api/chat` | `chat()` | Envía mensaje y recibe respuesta streaming (SSE) |
| `GET` | `/api/conversations` | `list_conversations()` | Lista todas las conversaciones |
| `GET` | `/api/conversations/{id}/messages` | `get_conversation_messages()` | Obtiene mensajes de una conversación |
| `DELETE` | `/api/conversations/{id}` | `delete_conversation()` | Elimina una conversación |
| `POST` | `/api/vehicles/compare` | `compare_vehicles()` | Comparación directa de vehículos |
| `POST` | `/api/vehicles/diagnose` | `diagnose_vehicle()` | Diagnóstico directo |
| `POST` | `/api/vehicles/recommend` | `get_recommendation()` | Recomendación directa |

#### Rutas Automotrices (`/api/automotive`)

| Método | Ruta | Función | Descripción |
|--------|------|---------|-------------|
| `GET` | `/api/automotive/health` | `health()` | Estado de la DB automotriz |
| `GET` | `/api/automotive/vehicles/search` | `search_vehicles()` | Búsqueda con filtros |
| `GET` | `/api/automotive/vehicles/details` | `get_vehicle_details()` | Detalles de un vehículo específico |
| `GET` | `/api/automotive/models/stats` | `get_model_stats()` | Estadísticas de un modelo |
| `GET` | `/api/automotive/brands/{manufacturer}` | `get_brand()` | Info de una marca |
| `GET` | `/api/automotive/brands` | `list_brands()` | Listado de marcas |

**Estado:** Todas las rutas completamente funcionales. Validación de parámetros con Pydantic.

### 3.13 PostgreSQL

Motor de base de datos principal. Se ejecuta como servicio Docker (postgres:16-alpine) con volumen persistente `postgres_data`. Configuración vía variables de entorno (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`). Incluye healthcheck con `pg_isready`.

**Fallback:** Si no se configura PostgreSQL, el sistema cae automáticamente a SQLite (`backend/database/chatbot.db`) vía `aiosqlite`.

**Estado:** Completamente funcional. Tablas auto-creadas en startup.

### 3.14 Modelos ORM

**Archivo:** `backend/app/infrastructure/database/models.py`

| Modelo ORM | Tabla | Propósito |
|------------|-------|-----------|
| `ConversationModel` | `conversations` | Sesiones de chat |
| `MessageModel` | `messages` | Mensajes individuales con relación a conversación |
| `UserProfileModel` | `user_profiles` | Perfil persistente del usuario |
| `VehicleMasterModel` | `vehicles_master` | Catálogo de vehículos (pre-existente) |
| `VehicleMarketStatsModel` | `vehicle_market_stats` | Estadísticas de mercado (pre-existente) |
| `BrandModel` | `brands` | Catálogo de marcas (pre-existente) |

**Detalle de campos:** Ver sección 4 (Base de Datos) para campos exactos de cada tabla.

### 3.15 DTOs (Data Transfer Objects)

**Dominio (dataclasses puras):**
- `Vehicle` (frozen) — brand, model, year, engine, transmission, fuel_type, mileage_km, price_usd
- `Message` (frozen) — content, role, conversation_id, id, created_at
- `Conversation` — title, id, created_at, updated_at, message_count
- `UserProfile` — 13 campos de preferencias del usuario (incluye preferred_brands desde Fase 5.8)
- `DiagnosisResult` (frozen) — diagnosis, possible_causes, recommended_actions, severity
- `VehicleSummary` (frozen) — 26 campos del catálogo de vehículos
- `VehicleMarketSummary` (frozen) — 14 campos de estadísticas de mercado
- `BrandSummary` (frozen) — 6 campos de la marca
- `VehicleDataBlock` (frozen) — title, content (para inyección en prompts)
- `UserContext` — vehicles, mentioned_brands, preferred_brands, budget, terrain, engine_type, usage, preferences, symptoms, etc.

**API (Pydantic):**
- `ChatRequest` — message (1-2000 chars), conversation_id?, budget?, terrain?, engine_type?
- `ChatStreamChunk` — content, done, conversation_id
- `ConversationResponse`, `MessageResponse`
- `VehicleComparisonRequest` — vehicles (2-5), focus, profile_id?
- `DiagnosisRequest` — vehicle, symptoms (1-10), category?, profile_id?
- `RecommendationRequest` — budget_usd, usage, priorities?, profile_id?
- `LLMResponse` — response (texto completo)
- `VehicleResponse`, `VehicleMarketStatsResponse`, `BrandResponse` (para API REST automotriz)
- `VehicleSearchResponse`, `VehicleDetailsResponse`, `ModelStatsResponse`, `BrandDetailResponse`, `BrandListResponse`
- `AutomotiveHealthResponse`, `AutomotiveErrorResponse`

### 3.16 Mappers

**Archivo:** `backend/app/infrastructure/database/mappers.py`

Funciones de mapeo ORM → DTO del dominio:
- `_decimal_to_float(value)` — Convierte `Decimal` a `float`, preserva None
- `_normalize_str(value)` — Normaliza strings: elimina whitespace, convierte "NA", "N/A", "null", "None" a None
- `map_vehicle_master(orm)` → `VehicleSummary`
- `map_vehicle_market_stats(orm)` → `VehicleMarketSummary`
- `map_brand(orm)` → `BrandSummary`

Los DTOs de dominio son **frozen** (inmutables), lo que garantiza que los mappers no mutan los objetos ORM originales.

---

## 4. Base de Datos

### 4.1 Configuración

- **Nombre:** `autoexpert_db`
- **Motor:** PostgreSQL 18.0 (Windows nativo; Docker Compose define `postgres:16-alpine` pero la instancia real reporta 18.0)
- **Conexión async:** `postgresql+asyncpg://`
- **Conexión sync (Alembic):** `postgresql://`
- **Auto-creación:** Las tablas de la app se crean automáticamente en startup con `Base.metadata.create_all()`
- **Fallback SQLite:** Activo si no hay PostgreSQL configurado. Crea `backend/database/chatbot.db` con **únicamente 3 tablas** (`conversations`, `messages`, `user_profiles`). Las tablas automotrices (`vehicles_master`, `vehicle_market_stats`, `brands`) **NO existen en SQLite** — queries al AutomotiveRepository fallarían silenciosamente (retorna listas vacías)

### 4.2 Tablas de la Aplicación (gestionadas por la app)

#### `conversations`
Almacena sesiones de chat.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `String(32)` | PK | UUID hex sin guiones |
| `title` | `String(200)` | NOT NULL | Título automático (primeros 80 chars del 1er mensaje) |
| `summary` | `Text` | Nullable | Resumen generado de la conversación (Fase 5.7) |
| `created_at` | `DateTime(tz=True)` | — | Timestamp de creación |
| `updated_at` | `DateTime(tz=True)` | — | Se actualiza con `onupdate` |

**Relaciones:** 1:N con `messages` (cascade delete).

#### `messages`
Almacena cada mensaje de cada conversación.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `String(32)` | PK | UUID hex |
| `content` | `Text` | NOT NULL | Contenido del mensaje |
| `role` | `String(20)` | NOT NULL | "user", "assistant" o "system" |
| `conversation_id` | `String(32)` | FK → conversations.id, ON DELETE CASCADE | Conversación padre |
| `created_at` | `DateTime(tz=True)` | — | Timestamp |

#### `user_profiles`
Perfil persistente del usuario (actualmente solo un perfil "default").

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `String(32)` | PK | Default: "default" |
| `primary_vehicle_brand` | `String(50)` | Nullable | Marca del vehículo principal |
| `primary_vehicle_model` | `String(100)` | Nullable | Modelo del vehículo principal |
| `primary_vehicle_year` | `Integer` | Nullable | Año del vehículo principal |
| `primary_vehicle_engine` | `String(50)` | Nullable | Motor del vehículo principal |
| `budget_usd` | `Float` | Nullable | Presupuesto en USD |
| `terrain` | `String(20)` | Nullable | city/highway/offroad/mixed |
| `engine_type` | `String(20)` | Nullable | gasoline/diesel/electric/hybrid |
| `usage` | `String(50)` | Nullable | urbano/ruta/familiar/trabajo/etc. |
| `fuel_preference` | `String(30)` | Nullable | Preferencia de combustible |
| `family_size` | `Integer` | Nullable | Tamaño familiar |
| `preferences` | `Text` | Nullable | JSON-encoded list[str] |
| `mentioned_brands` | `Text` | Nullable | JSON-encoded list[str] |
| `preferred_brands` | `Text` | Nullable | JSON-encoded list[str] — marcas preferidas explícitamente (Fase 5.8) |
| `created_at` | `DateTime(tz=True)` | — | Timestamp |
| `updated_at` | `DateTime(tz=True)` | — | Timestamp |

### 4.3 Tablas Automotrices (pre-cargadas, no gestionadas por la app)

#### `vehicles_master`
Catálogo de vehículos con datos de listings reales. **47,030 registros.**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `vehicle_id` | `Integer` (PK) | ID único |
| `vehicle_name` | `String(255)` | Nombre compuesto |
| `manufacturer` | `String(100)` | Marca |
| `model` | `String(200)` | Modelo |
| `year` | `Integer` | Año |
| `listing_count` | `Integer` | Cantidad de listados |
| `price_mean`, `price_median`, `price_min`, `price_max` | `Numeric(12,2)` | Estadísticas de precio |
| `odometer_mean`, `odometer_median` | `Numeric(12,2)` | Estadísticas de odómetro |
| `fuel_mode` | `String(50)` | Tipo de combustible predominante |
| `transmission_mode` | `String(50)` | Transmisión predominante |
| `condition_mode` | `String(50)` | Condición predominante |
| `cylinders_mode` | `String(50)` | Cilindros predominantes |
| `drive_mode` | `String(50)` | Tracción predominante |
| `type_mode` | `String(50)` | Tipo de vehículo |
| `size_mode` | `String(50)` | Tamaño |
| `paint_color_mode` | `String(50)` | Color predominante |
| `states_count` | `Integer` | Cantidad de estados con listados |
| `first_posting_date`, `last_posting_date` | `DateTime` | Rango de fechas de listados |
| `price_range` | `String(50)` | Rango de precio categorizado |
| `market_confidence` | `String(50)` | Nivel de confianza del mercado |

#### `vehicle_market_stats`
Estadísticas de mercado agrupadas por modelo. **20,036 registros.**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `Integer` (PK) | ID autoincrement |
| `manufacturer`, `model` | `String` | Marca y modelo |
| `years_available`, `oldest_year`, `newest_year` | `Integer` | Rango de años |
| `total_listings` | `Integer` | Total de listados |
| `overall_price_mean`, `overall_price_median` | `Numeric(12,2)` | Precios globales |
| `overall_odometer_mean` | `Numeric(12,2)` | Odómetro global |
| `fuel_mode`, `transmission_mode`, `drive_mode`, `type_mode` | `String(50)` | Modas |

#### `brands`
Estadísticas agregadas por marca. **40 registros.**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `brand_id` | `Integer` (PK) | ID único |
| `manufacturer` | `String(100)` | Nombre de la marca |
| `model_count` | `Integer` | Cantidad de modelos |
| `year_count` | `Integer` | Cantidad de años |
| `total_listings` | `Integer` | Total de listados |
| `average_price` | `Numeric(12,2)` | Precio promedio |

### 4.4 Relaciones

```
conversations ──(1:N)──► messages
      │
      │ (separada, misma DB)
      │
user_profiles    vehicles_master    vehicle_market_stats    brands
(sin FK)         (sin FK)           (sin FK)                (sin FK)
```

Las tablas de la app (`conversations`, `messages`, `user_profiles`) y las tablas automotrices (`vehicles_master`, `vehicle_market_stats`, `brands`) coexisten en la misma base de datos pero **no tienen relaciones FK entre sí**. El AutomotiveRepository accede a las tablas automotrices como solo-lectura.

---

## 5. Funcionalidades Implementadas

### 5.1 Chat Conversacional

- Streaming de respuesta token por token (SSE)
- Historial de conversaciones persistente en PostgreSQL
- Auto-titulación de conversaciones (primeros 80 caracteres)
- Carga de historial al seleccionar conversación previa
- Eliminación de conversaciones
- Límite de 20 mensajes de historial enviados al LLM
- Mensajes de hasta 2,000 caracteres

### 5.2 Memoria Conversacional

- Historial de mensajes almacenado y recuperado de PostgreSQL
- Últimos 20 mensajes enviados como contexto al LLM
- Extracción de contexto de todo el historial de la conversación (no solo el último mensaje)
- Preservación de marcas mencionadas, vehículos, presupuesto, uso y preferencias a lo largo de la conversación
- **Memoria cross-conversación (Fase 5.7):** ConversationMemoryService genera resúmenes compactos de conversaciones previas usando ContextExtractor (sin LLM). Se inyectan como contexto en `agent_context_block.txt` para recall de preferencias históricas.

### 5.3 Perfil Persistente

- Perfil de usuario guardado en `user_profiles` con ID fijo "default"
- Fusión "existing-data-wins": los datos existentes nunca se sobreescriben con None
- Fusión de listas por unión deduplicada
- Perfil actualizado automáticamente con cada interacción
- Campos: vehículo principal, presupuesto, terreno, motor, uso, combustible, familia, preferencias, marcas mencionadas, marcas favoritas (Fase 5.8)

### 5.4 Diagnósticos

- Formulario dedicado con campos: marca, modelo, año, categoría (opcional), síntomas (1-10)
- Prompt especializado con reglas: análisis estructurado, causas por probabilidad, nivel de urgencia, recomendación de mecánico certificado
- Endpoint directo `POST /api/vehicles/diagnose`
- También funciona vía chat cuando el IntentClassifier detecta intención DIAGNOSIS

### 5.5 Recomendaciones

- Formulario con presupuesto USD, uso y prioridades
- Prompt especializado: 3-5 recomendaciones con justificación, tabla comparativa, tips de compra, estimación de costo anual
- Bloques `[CAR]` estructurados para rendering visual en frontend
- Adaptación al Panel Físico (terreno, tipo de motor)
- Preguntas al usuario si falta información crítica (presupuesto)
- Endpoint directo `POST /api/vehicles/recommend`
- Funciona vía chat con intención RECOMMENDATION

### 5.6 Comparaciones

- Formulario dinámico para 2-5 vehículos con campos: marca, modelo, año, motor
- Focus configurable: performance, economy, safety, value, all
- Prompt especializado: tabla comparativa, análisis por categorías (motor, seguridad, confort, economía, confiabilidad), pros/contras, recomendación final
- Endpoint directo `POST /api/vehicles/compare`
- Comparación desde el Garaje Virtual (selección de vehículos guardados)

### 5.7 Garaje Virtual

- Panel lateral derecho con slide-in animation
- Almacenamiento persistente en `localStorage` (clave `autobot-garage`)
- Capacidad máxima: 10 vehículos
- Duplicados prevenidos (misma brand+model+year)
- Agregado de vehículos desde tarjetas `[CAR]` en respuestas del chat
- Eliminación individual y limpieza completa
- Botón "Comparar en Consola" que invoca el endpoint de comparación
- Badges con specs: motor, combustible, precio

### 5.8 Contexto Dinámico

- **ContextExtractor:** Extracción basada en regex de:
  - 41 marcas automotrices reconocidas
  - Vehículos (marca + modelo + año) con regex `{brand}\s+([\w\s\-]+?)\s+(\d{4})?`
  - Presupuesto en USD (5 patrones de regex, rango $500-$500,000)
  - Uso (urbano, ruta, familiar, trabajo, carga, deportivo, offroad)
  - Preferencias (económico, seguro, confort, deportivo, confiable, tecnología, diseño)
  - Síntomas de diagnóstico (20 keywords: ruido, vibración, humo, etc.)
  - **Marcas favoritas (Fase 5.8):** 6 patrones de preferencia explícita ("me gusta", "mi marca favorita", "siempre compro", "prefiero", "elijo", "tengo preferencia por"). Solo marcas reconocidas por `_AUTOMOTIVE_BRANDS`.
- **Panel Físico:** Filtros manuales (presupuesto, terreno, tipo de motor) que se inyectan silenciosamente en el mensaje
- **Prompt de contexto:** Template Jinja2 que renderiza condicionalmente todos los campos del perfil, incluyendo marcas favoritas y resúmenes de conversaciones anteriores

### 5.9 Integración con Datos Automotrices

- **AutomotiveRepository** consulta tablas pre-cargadas (47,030 vehículos, 20,036 stats, 40 marcas)
- **AutomotiveAgentTool** formatea datos en bloques `[VEHICLE_SEARCH_RESULTS]`, `[VEHICLE_DETAILS]`, `[BRAND_INFO]`, `[MODEL_INFO]`, `[BRAND_LIST]`
- **AutomotiveAgentTool** invocado automáticamente por el Orchestrator cuando detecta vehículos o marcas mencionados en el mensaje
- Datos inyectados en el system prompt con reglas anti-alucinación
- Límite de 2 vehículos y 3 marcas por request para evitar prompts excesivamente largos
- Bloques duplicados evitados (si un vehículo ya fue consultado por modelo, no se consulta de nuevo por marca)
- API REST dedicada para acceso directo a datos automotrices

### 5.10 Endpoints Disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check del backend |
| `POST` | `/api/chat` | Chat streaming (SSE) |
| `GET` | `/api/conversations` | Listar conversaciones |
| `GET` | `/api/conversations/{id}/messages` | Mensajes de una conversación |
| `DELETE` | `/api/conversations/{id}` | Eliminar conversación |
| `POST` | `/api/vehicles/compare` | Comparación directa |
| `POST` | `/api/vehicles/diagnose` | Diagnóstico directo |
| `POST` | `/api/vehicles/recommend` | Recomendación directa |
| `GET` | `/api/automotive/health` | Health check de DB automotriz |
| `GET` | `/api/automotive/vehicles/search` | Búsqueda de vehículos con filtros |
| `GET` | `/api/automotive/vehicles/details` | Detalles de un vehículo |
| `GET` | `/api/automotive/models/stats` | Estadísticas de un modelo |
| `GET` | `/api/automotive/brands/{manufacturer}` | Info de una marca |
| `GET` | `/api/automotive/brands` | Listado de marcas |

---

## 6. Flujo Completo de una Conversación

### Paso 1: El usuario envía un mensaje

El usuario escribe en el `MessageInput` y presiona Enter. El `chatStore.sendMessage()` construye el payload:
```json
{
  "message": "Necesito un auto SUV familiar por $25,000",
  "conversation_id": null | "abc123",
  "budget": 25000,
  "terrain": "city",
  "engine_type": "gasoline"
}
```
Si el Panel Físico tiene filtros activos, se inyectan silenciosamente al texto del mensaje como `[Filtros activos del panel: Presupuesto: $25,000 USD | Terreno: Urbano]`.

### Paso 2: FastAPI recibe la petición

`POST /api/chat` → `ChatUseCase.stream_response()`:
1. Valida que el mensaje no esté vacío
2. Crea o recupera la conversación (si no hay `conversation_id`, crea una nueva)
3. Guarda el mensaje del usuario en la tabla `messages`
4. Recupera los últimos 20 mensajes como historial

### Paso 3: Se detecta información faltante (Fase 5.3)

`CapabilityRegistry.detect_missing_info(RECOMMENDATION, context)`:
1. Compara campos requeridos por RECOMMENDATION contra el contexto actual
2. Detecta que falta `usage` (prioridad 2) y `terrain` (prioridad 3)
3. Retorna lista de `FollowupField` ordenada por prioridad

### Paso 4: El Orchestrator clasifica la intención

`AgentOrchestrator.orchestrate()`:
1. `IntentClassifier.classify()` analiza el texto:
   - Detecta "auto SUV familiar" + "$25,000" → scored como RECOMMENDATION
   - Confianza calculada = best_score / total_score
2. Retorna `ClassificationResult(intent=RECOMMENDATION, confidence=0.85, matched_keywords=["auto"])`

### Paso 5: Se construye el contexto del usuario

`ContextManager.build_context()`:
1. Carga perfil de `user_profiles` (si existe)
2. `ContextExtractor.extract()` procesa los 20 mensajes:
   - Detecta presupuesto: `$25,000`
   - Detecta uso: "familiar" (keyword)
   - Detecta tipo: "SUV" → vehicle_type
3. Fusiona con perfil existente via `ProfileUpdater.merge()` (existing-data-wins)
4. Guarda perfil actualizado en DB si hay cambios
5. Carga resúmenes de conversaciones anteriores (Fase 5.7)
6. Renderiza `agent_context_block.txt` con todos los campos + resúmenes

### Paso 6: Se consultan datos automotrices (intent-aware, Fase 5.2)

`AgentOrchestrator._fetch_automotive_data(RECOMMENDATION, user_context)`:
1. Detecta intención RECOMMENDATION → ejecuta `_fetch_recommendation_data()`
2. Mapea uso a tipo de vehículo: "familiar" → "suv"
3. Busca vehículos SUV con presupuesto ≤ $25,000
4. Deduplica por clave (manufacturer+model+year) para evitar bloques repetidos
5. Retorna bloques formateados como string

Si el usuario hubiera dicho "Toyota RAV4 2024 por $25,000":
1. Detectaría marca "Toyota" y vehículo "RAV4 2024"
2. `AutomotiveAgentTool.get_vehicle_details("Toyota", "RAV4", 2024)` → consulta DB
3. `AutomotiveAgentTool.get_model_info("Toyota", "RAV4")` → consulta DB
4. Bloques formateados concatenados como string

### Paso 7: Se ensambla el system prompt (con follow-up, Fase 5.3)

`CapabilityRegistry.build_system_prompt(RECOMMENDATION, context)`:
1. Renderiza `base.txt` (prompt base del asistente automotriz)
2. Agrega `agent_context_block.txt` (perfil del usuario + resúmenes previos)
3. Agrega `agent_recommendation_enhancement.txt` (mejora para recomendaciones con usage guidance)
4. Si hay `automotive_data`, agrega reglas anti-alucinación
5. Si `detect_missing_info()` encontró campos faltantes, inyecta bloque de seguimiento:
   - CRÍTICO: campos sin los cuales no puede responder
   - IMPORTANTE: campos que mejoran significativamente la respuesta
   - COMPLEMENTARIO: campos opcionales pero útiles

### Paso 8: Se invoca el LLM

`OpenRouterProvider.stream_chat(messages, system_prompt)`:
1. Construye payload con system prompt + historial + último mensaje
2. Envía request POST a `https://openrouter.ai/api/v1/chat/completions`
3. Parsea la respuesta SSE línea por línea
4. Yield cada chunk de contenido: `choices[0].delta.content`

### Paso 9: El frontend renderiza la respuesta

1. `chatStore` acumula chunks en `streamingContent`
2. `ChatWindow` renderiza un `MessageBubble` con `isStreaming=true`
3. Se muestra `StreamingIndicator` (dots pulsantes) hasta que llega el primer chunk
4. El contenido se renderiza como Markdown (react-markdown + remark-gfm)
5. Si hay bloques `[CAR]...[/CAR]`, `carBlockParser` los extrae y renderiza como `CarCard` con radar chart

### Paso 10: Se guarda la respuesta

1. Al recibir `done: true`, se crea el mensaje assistant completo en `chatStore.messages`
2. `ChatUseCase` guarda el mensaje completo en la tabla `messages`
3. Si es el primer intercambio (≤ 2 mensajes), se auto-titula la conversación

---

## 7. Estado de Pruebas

### 7.1 Resumen General

| Métrica | Valor |
|---------|-------|
| **Archivos de test** | 14 |
| **Tests totales** | 311 |
| **Tests aprobados** | 289 |
| **Tests omitidos (skipped)** | 22 (opt-in, requieren DB real) |
| **Warnings** | 1 (deprecación httpx en TestClient) |
| **Framework** | pytest 9.1.1 + pytest-asyncio 1.4.0 (asyncio_mode = "auto") |
| **conftest.py** | No existe (fixtures definidas localmente en cada archivo) |

### 7.2 Distribución por Archivo

| Archivo | Tests | Tipo | Qué prueba |
|---------|-------|------|------------|
| `test_automotive_api.py` | 28 | Unit | Endpoints REST de la API automotriz con repos mockeados |
| `test_automotive_api_integration.py` | 8 | Integration | Endpoints contra DB real (opt-in) |
| `test_automotive_agent_tool.py` | 19 | Unit | Formateo de datos de DB a bloques VehicleDataBlock |
| `test_automotive_flow.py` | 25 | E2E (mock) | Flujo completo: mensaje → intención → datos → prompt → LLM |
| `test_automotive_mappers.py` | 32 | Unit | Mapeo ORM → DTO, normalización de strings, Decimal→float |
| `test_automotive_repository.py` | 46 | Unit | Queries SQL con sesiones mockeadas |
| `test_automotive_repository_integration.py` | 14 | Integration | Queries contra DB real (opt-in) |
| `test_capabilities_automotive.py` | 4 | Unit | Inclusión/exclusión de datos en prompts de capabilities |
| `test_orchestrator_automotive.py` | 31 | Unit | _fetch_automotive_data, intent-aware queries, CapabilityContext |
| `test_followup.py` | 24 | Unit | Follow-up detection, detect_missing_info, FollowupField |
| `test_subfase_5_4_5.py` | 26 | Unit | Recommendation usage guidance + Comparison focus guidance |
| `test_subfase_5_6.py` | 14 | Unit | Diagnosis automotive data injection + orchestrator integration |
| `test_subfase_5_7.py` | 19 | Unit | ConversationMemoryService, Conversation model summary, ContextManager memory |
| `test_subfase_5_8.py` | 21 | Unit | Brand preference extraction, UserProfile preferred_brands, ProfileUpdater merge |

### 7.3 Cobertura Funcional

| Componente | Tests | Cobertura |
|------------|-------|-----------|
| Automotive API (REST) | 28 unit + 8 integration | Alta — happy paths, errores, edge cases, validación |
| Automotive Repository | 46 unit + 14 integration | Alta — búsquedas, filtros, errores DB, normalización |
| Automotive Agent Tool | 19 | Alta — formateo, precios, N/A, edge cases |
| Mappers | 32 | Alta — Decimal, strings, None, immutability |
| Flujo completo (flow) | 25 | Media-Alta — escenarios A-F, tool invocation, streaming |
| Orchestrator automotriz | 31 | Alta — fetch de datos, brand detection, dedup, intent-aware queries |
| Capabilities automotrices | 4 | Media — presencia/ausencia de datos en prompts |
| Follow-up Detection | 24 | Alta — missing info, priority ordering, edge cases |
| Comparison/Recommendation Focus | 26 | Alta — usage guidance, focus guidance, context enrichment |
| Diagnosis Data | 14 | Alta — automotive data injection, anti-hallucination rules |
| Conversation Memory | 19 | Alta — summary generation, model persistence, context loading |
| Brand Preference Extraction | 21 | Alta — 6 patterns, recognition filtering, profile merge |
| IntentClassifier | 0 (tests formales) | **Baja** — cubierto indirectamente por flow tests |
| ChatUseCase | 0 (tests formales) | **Baja** — cubierto indirectamente por flow tests |
| ConversationUseCase | 0 (tests formales) | **Baja** |

### 7.4 Estado de Ruff

Ruff está configurado en `pyproject.toml`:
- Target: Python 3.13
- Line length: 99
- Rules seleccionadas: E, F, I, N, UP, S, B, A, C4, PT, RUF
- Ignorados: S101 (assert), B008 (Depends), S105 (hardcoded passwords)
- Versión instalada: 0.15.21

**Resultado real de `ruff check .`:** 20 errores detectados.

| Regla | Cantidad | Ubicación | Descripción |
|-------|----------|-----------|-------------|
| E501 | 6 | scripts/ | Líneas > 99 caracteres |
| UP045 | 4 | api/schemas/chat.py | `Optional[X]` debería ser `X \| None` (PEP 604) |
| S608 | 3 | scripts/ | Posible SQL injection (f-strings en queries) |
| B023 | 2 | scripts/ | Lambda captura variable de loop |
| F541 | 2 | scripts/ | f-string sin placeholders |
| I001 | 2 | alembic/env.py, scripts/ | Imports desordenados |
| F841 | 1 | infrastructure/llm/openrouter.py | Variable asignada pero no usada (`response`) |

**Nota:** La mayoría de errores están en `scripts/` (scripts auxiliares) y `alembic/env.py` (boilerplate), no en el código de la aplicación. Los errores en código de app son: 4x UP045 en `chat.py` y 1x F841 en `openrouter.py`.

### 7.5 Estabilidad General

- Los 289 tests aprobados (311 totales) cubren: capacidades de agente, orquestador, pipeline unificado, memoria, personalización, y datos automotrices
- Los 22 tests de integración son opt-in (`RUN_DB_INTEGRATION_TESTS=true`) y requieren DB real con datos
- No hay tests de frontend (sin Vitest configurado)
- No existe `conftest.py` global ni fixtures compartidas
- No se ha ejecutado cobertura formal con `pytest-cov`
- Mypy está configurado en modo strict pero no se ha verificado su paso completo
- 1 warning de deprecación: `httpx` con `starlette.testclient` (debería usar `httpx2`)

---

## 8. Decisiones Técnicas Importantes

### 8.1 PostgreSQL

**Por qué:** Necesidad de una base de datos relacional robusta que soporte:
- Queries con filtros múltiples (búsqueda de vehículos con 8+ parámetros)
- Ordenamiento con `NULLS LAST`
- Manejo de tipos `Numeric(12,2)` para precios
- Concurrentes conexiones async
- Persistencia confiable para el perfil del usuario y conversaciones
- Volumen significativo: 67,000+ registros automotrices

**Alternativa descartada:** SQLite (se mantiene como fallback para desarrollo, pero no para producción).

### 8.2 SQLAlchemy Async

**Por qué:** FastAPI es nativamente async. SQLAlchemy 2.0 soporta async con `create_async_engine` y `AsyncSession`, permitiendo:
- No bloquear el event loop de Uvicorn durante queries a DB
- Compatibilidad nativa con `asyncpg` para PostgreSQL
- Mismo ORM para sync (Alembic) y async (app)
- Tipo checking estricto con `Mapped[T]`

### 8.3 AutomotiveRepository

**Por qué:** Separación de concerns — los datos automotrices pre-cargados son read-only y tienen un esquema diferente (3 tablas sin FK con la app). Un repositorio dedicado:
- Mantiene el dominio limpio de detalles de schema
- Permite optimizar queries sin afectar la lógica de negocio
- Facilita testing con mocks
- Abstrae la fuente de datos (podría cambiarse a una API externa)

### 8.4 AutomotiveAgentTool

**Por qué:** El LLM necesita datos formateados de manera específica para ser útiles. Este componente:
- Traduce resultados crudos de DB a bloques `[TAG]...[/TAG]` que el LLM puede interpretar
- Formatea precios y odómetro en formato legible
- Maneja valores None como "N/A"
- Aísla al LLM de la implementación de la DB
- Es inyectado como dependencia (testable con mocks)

### 8.5 ContextManager

**Por qué:** La gestión de contexto es el componente más complejo del sistema. Coordina:
- Extracción de datos nuevos del texto (regex)
- Carga del perfil persistente de DB
- Fusión de ambos (existing-data-wins)
- Persistencia del perfil actualizado
- Renderizado del contexto como texto para el prompt

Unificarlo en un solo componente evita duplicación de lógica y garantiza consistencia.

### 8.6 UserProfileManager

**Por qué:** La persistencia del perfil del usuario requiere:
- Estrategia de fusión sofisticada (existing-data-wins, listas deduplicadas)
- Lazy initialization (get_or_create)
- Detección de cambios antes de guardar (evitar writes innecesarios)
- Un solo punto de verdad para el perfil

### 8.7 IntentClassifier Basado en Reglas

**Por qué:**
- **Velocidad:** Clasificación instantánea sin llamadas a LLM (0ms de latencia adicional)
- **Costo:** No consume tokens del LLM para una tarea que puede resolverse con regex
- **Predictibilidad:** Las reglas son deterministas y auditables
- **Suficiencia:** Para 4 intenciones bien definidas, un clasificador por reglas con pesos es suficiente
- **Complemento:** Los boosts contextuales (budget → RECOMMENDATION) mejoran la precisión sin LLM

**Limitación conocida:** No maneja frases ambiguas o intenciones mixtas tan bien como un clasificador ML.

### 8.8 Clean Architecture

**Por qué:**
- **Testabilidad:** Cada capa puede testearse aisladamente con mocks
- **Cambios de infraestructura:** Podría migrarse de PostgreSQL a MongoDB cambiando solo Infrastructure
- **Cambios de framework:** Podría migrarse de FastAPI a otro framework cambiando solo API
- **Claridad:** Cada archivo tiene una responsabilidad clara
- **Extensibilidad:** Agregar una nueva capability o un nuevo repo no afecta otras capas

---

## 9. Deuda Técnica Actual

> Enumera únicamente lo que realmente falta implementar. No se proponen funcionalidades nuevas.

### 9.1 Tests Faltantes

- No existen tests unitarios directos para: `IntentClassifier`, `ChatUseCase`, `ConversationUseCase`, `OpenRouterProvider`
- No existe `conftest.py` global con fixtures compartidas (fixtures duplicadas en cada archivo)
- No hay tests de frontend (Vitest no configurado)
- No se ha medido cobertura formal con `pytest-cov`

### 9.2 Alembic

- Solo existe el boilerplate de Alembic (`env.py`, `script.py.mako`)
- No se ha generado ninguna migración
- Las tablas se crean por `Base.metadata.create_all()` en startup
- No hay control de versionado de schema

### 9.3 Configuración

- Discrepancia entre `.env.example` y `.env` real:
  - `.env.example` usa `APP_DEBUG=true`, pero `config.py` lee `debug` (pydantic-settings lo mapea desde `DEBUG=true` en `.env`)
  - `.env.example` incluye `APP_PORT=8000` y `APP_HOST=0.0.0.0`, pero `config.py` no los define
- El `.env` usa `OPENROUTER_MODEL=openrouter/free` (placeholder). `.env.example` tiene `deepseek/deepseek-chat-v3-0324:free`
- No hay README.md en el proyecto

### 9.4 Frontend

- `zod` está instalado pero no se usa para validación de schemas
- `API_BASE_URL` en `constants.ts` no es consumido por `client.ts`
- `VEHICLE_BRANDS` en `constants.ts` no es consumido por ningún componente
- `TYPING_INDICATOR_DELAY` no es consumido
- `compareVehicles()` en `conversations.ts` es parcialmente redundante con `garageStore`
- No hay lazy loading de componentes

### 9.5 Backend

- `ChatRequest` en `chat.py` schema permite `budget`, `terrain`, `engine_type` pero también los acepta por `buildFilterContext` en el frontend como texto inyectado — hay dos caminos paralelos
- No hay rate limiting a nivel de aplicación
- No hay autenticación/autorización
- No hay logging estructurado (solo `logging.basicConfig`)
- No hay métricas ni observabilidad
- **Ruff detecta 20 errores** (5 en código de app: 4x UP045 en schemas, 1x F841 variable no usada en openrouter.py)

**Nota (Fase 5 completada):** Los 3 endpoints (compare, diagnose, recommend) ahora usan el sistema de capabilities vía AgentOrchestrator unified pipeline. Ya no van directo al LLM.

### 9.6 Despliegue

- No hay configuración de producción (solo development)
- No hay HTTPS/TLS configurado
- No hay health checks en Docker Compose para backend y frontend
- No hay CI/CD pipeline

---

## 10. Estado del Proyecto

### 10.1 Fases Completadas

| Fase | Estado | Detalle |
|------|--------|---------|
| Fase 1 — Fundamentos | ✅ Completada | Clean Architecture, modelos, repos, FastAPI base |
| Fase 2 — Agente Inteligente | ✅ Completada | Orchestrator, IntentClassifier, Capabilities, ContextManager |
| Fase 3 — Frontend React | ✅ Completada | SPA con glassmorphism, streaming SSE, markdown rendering |
| Fase 4 — Datos Automotrices | ✅ Completada | PostgreSQL, AutomotiveRepository, AutomotiveAgentTool, 67,000+ registros |
| Fase 5 — Experiencia Conversacional | ✅ Completada | Unified pipeline, intent-aware queries, follow-ups, memory, personalization |

### 10.2 Componentes Completamente Funcionales

| Componente | Estado |
|------------|--------|
| FastAPI Application Factory + DI | ✅ |
| AgentOrchestrator | ✅ |
| IntentClassifier (4 intenciones) | ✅ |
| CapabilityRegistry + 3 Capabilities | ✅ |
| ContextManager + ContextExtractor | ✅ |
| UserProfileManager + ProfileUpdater | ✅ |
| AutomotiveRepository | ✅ |
| AutomotiveAgentTool (5 métodos de formateo) | ✅ |
| OpenRouterProvider (streaming + retry) | ✅ |
| ChatUseCase (streaming SSE) | ✅ |
| ConversationUseCase (CRUD) | ✅ |
| 4 endpoints de vehículos (compare, diagnose, recommend) | ✅ |
| 6 endpoints de datos automotrices REST | ✅ |
| ConversationRepo + MessageRepo + UserProfileRepo | ✅ |
| Prompt templates (8 archivos Jinja2) | ✅ |
| React SPA con 3 paneles | ✅ |
| Chat con streaming SSE | ✅ |
| Garaje Virtual con localStorage | ✅ |
| Panel Físico de filtros | ✅ |
| CarCard con radar chart SVG | ✅ |
| Parsing de bloques [CAR] | ✅ |
| Sidebar de conversaciones | ✅ |
| 311 pruebas (289 passed, 22 skipped) | ✅ |
| Docker Compose (3 servicios) | ✅ |
| Unified Pipeline (3 endpoints → AgentOrchestrator) | ✅ Fase 5.1 |
| Intent-Aware AutomotiveAgentTool Queries | ✅ Fase 5.2 |
| Follow-up Detection (missing info) | ✅ Fase 5.3 |
| Recommendations with Real Data | ✅ Fase 5.4 |
| Comparisons with Focus Guidance | ✅ Fase 5.5 |
| Diagnosis with Real Data + Anti-Hallucination | ✅ Fase 5.6 |
| ConversationMemoryService (cross-convo recall) | ✅ Fase 5.7 |
| Simple Personalization (preferred_brands) | ✅ Fase 5.8 |

### 10.3 Componentes Parcialmente Implementados

| Componente | Estado | Falta |
|------------|--------|-------|
| IntentClassifier | Parcial | Funciona pero no tiene tests unitarios directos dedicados; casos borde no cubiertos |
| Perfil persistente | Parcial | Guarda y fusiona, pero el merge"profile-to-context" no propaga TODOS los campos del historial (solo el primero) |
| Alembic | Parcial | Boilerplate existe, pero no hay migraciones generadas |

**Nota (Fase 5 completada):** `ProfileUpdater`, `ContextExtractor` y `ContextManager` ahora tienen tests unitarios directos (Fase 5.8, 5.8, 5.7 respectivamente). Los 3 endpoints (compare/diagnose/recommend) ahora usan el sistema de capabilities vía unified pipeline (Fase 5.1).

---

## 11. Roadmap Restante

### Fase 5 — Experiencia Conversacional Inteligente ✅ COMPLETADA

| Feature | Subfase | Estado |
|---------|---------|--------|
| Unified Pipeline (3 endpoints → orchestrator) | 5.1 | ✅ |
| Intent-Aware AutomotiveAgentTool Queries | 5.2 | ✅ |
| Follow-up Detection (missing info) | 5.3 | ✅ |
| Recommendations with Real Data (usage-aware) | 5.4 | ✅ |
| Comparisons with Focus Guidance | 5.5 | ✅ |
| Diagnosis with Real Data + Anti-Hallucination | 5.6 | ✅ |
| Cross-Conversation Memory (summary-based) | 5.7 | ✅ |
| Simple Personalization (preferred_brands) | 5.8 | ✅ |

### Fase 6 — Visualizaciones y Analítica

| Feature | Descripción |
|---------|-------------|
| Gráficos | Visualizaciones de datos automotrices (precios por año, distribución, etc.) |
| Estadísticas | Dashboard con estadísticas de uso del chatbot |
| Comparativas visuales | Radar charts comparativos enriquecidos |
| Dashboards | Panel de analítica para el usuario |
| Reportes | Exportación de comparativas y diagnósticos |

### Fase 7 — Refinamiento y Calidad AAA

| Feature | Descripción |
|---------|-------------|
| UI/UX | Pulido de animaciones, transiciones, micro-interacciones |
| Rendimiento | Optimización de queries, caching de respuestas, lazy loading |
| Seguridad | Autenticación, rate limiting, sanitización de inputs |
| Logging | Logging estructurado con correlación de requests |
| Caché | Cache de resultados de DB y respuestas del LLM |
| Optimización | Reducción de tamaño de prompts, compresión de contexto |
| Testing | Cobertura completa: tests unitarios para todos los componentes, tests de frontend |
| Documentación | README.md, API docs, guía de desarrollo |
| Preparación para defensa | Demo funcional, presentación, documentación académica |

---

## 12. Recomendaciones para Continuar

La **Fase 5 — Experiencia Conversacional Inteligente** está **completada**. A continuación se recomienda el orden de trabajo para las fases restantes.

### Paso 1: Alembic migrations

**Por qué:** El schema actual se crea por `create_all()`, pero cualquier cambio futuro (nuevos campos, tablas) necesita un control de versionado. Generar la primera migración ahora establece la base.

**Acciones:**
1. Generar migración inicial con `alembic revision --autogenerate`
2. Verificar que la migración refleja el schema actual
3. Integrar `alembic upgrade head` en el lifespan de la app (opcional)

### Paso 2: Comenzar Fase 6 — Visualizaciones y Analítica

**Por qué:** Con la Fase 5 completa (pipeline unificado, memoria, personalización), el siguiente nivel de valor es ofrecer analítica visual al usuario.

**Acciones:**
1. Dashboard con estadísticas de uso del chatbot
2. Visualizaciones de datos automotrices (precios por año, distribución)
3. Radar charts comparativos enriquecidos
4. Exportación de comparativas y diagnósticos

### Paso 3: Fase 7 — Refinamiento y Calidad AAA

**Por qué:** La preparación para defensa académica requiere pulido final de UI/UX, testing completo, y documentación.

**Acciones:**
1. Tests de frontend (Vitest configurado)
2. Cobertura formal con `pytest-cov`
3. README.md y guía de desarrollo
4. Preparación de demo funcional

---

> **Documento generado automáticamente para continuar el desarrollo de AutoExpert AI.**
> **Última actualización del estado del código:** Fase 5 completada (Experiencia Conversacional Inteligente).

---

## Auditoría de consistencia

> Sección generada verificando directamente contra el estado real del repositorio y la base de datos.
> Fecha de auditoría: 24 de julio de 2026.

### Comandos utilizados

```bash
# Pytest
cd backend && python -m pytest tests/ -v --tb=short

# Ruff
cd backend && python -m ruff check .

# Conteos de DB (vía script Python con SQLAlchemy async)
python _check_db.py

# Versiones
python -m ruff --version
python -c "import sys; print(sys.version)"

# SQLite fallback
python _check_sqlite.py

# Rutas OpenAPI
python -c "from app.main import app; schema = app.openapi(); print(list(schema['paths'].keys()))"

# Verificar .env y config.py
# Lectura directa de archivos
```

### Datos corregidos

| Campo | Valor en doc. original | Valor real verificado | Fuente |
|-------|----------------------|---------------------|--------|
| **Python (runtime)** | `>= 3.13` (requerido) | `3.14.6` | `sys.version` |
| **PostgreSQL (runtime)** | `PostgreSQL 16 (Alpine)` | `PostgreSQL 18.0 on x86_64-windows` | `SELECT version()` |
| **Ruff (versión)** | No especificada | `0.15.21` | `ruff --version` |
| **pytest (versión)** | No especificada | `9.1.1` | pytest output header |
| **Tests totales** | 149 | **311** | `pytest` resumen |
| **Tests aprobados** | 140 | **289** | `pytest` resumen |
| **Tests omitidos** | 18 | **22** | `pytest` resumen |
| **OpenRouter model (.env)** | `deepseek/deepseek-chat-v3-0324:free` | **`openrouter/free`** | `.env` línea 20 |
| **OpenRouter model (default)** | `deepseek/deepseek-chat-v3-0324:free` | `deepseek/deepseek-chat-v3-0324:free` | `config.py` línea 19 |
| **vehicles_master** | 4,582 | **47,030** | `SELECT COUNT(*)` |
| **vehicle_market_stats** | 12,222 | **20,036** | `SELECT COUNT(*)` |
| **brands** | 65 | **40** | `SELECT COUNT(*)` |
| **Total registros automotrices** | 17,064 | **67,106** | Suma de las 3 tablas |
| **Ruff errores** | No especificado | **20** (5 en código app) | `ruff check .` |
| **SQLite fallback** | "Fallback a SQLite" | **Solo 3 tablas** (sin automotrices) | `sqlite3` introspección |
| **OpenAPI paths** | 14 listados en doc | **14** (confirmado) | `app.openapi()` |
| **Tablas en SQLite** | No especificado | `conversations`, `messages`, `user_profiles` | Introspección SQLite |

### Diferencias encontradas

#### 1. Conteos de datos automotrices (CRÍTICO)
El documento original reportaba **4,582 / 12,222 / 65** registros. Los conteos reales son **47,030 / 20,036 / 40**. Las tablas tienen ~10x más datos de lo documentado, excepto `brands` que tiene menos (40 vs 65 documentado). Esto afecta directamente la sección "Base de Datos" y "Componentes Implementados".

#### 2. Versión de PostgreSQL (CRÍTICO)
Docker Compose define `postgres:16-alpine`, pero la instancia real reporta **PostgreSQL 18.0 en Windows nativo**. La DB no está corriendo en Docker sino como servicio nativo.

#### 3. Tests: cantidad total (IMPORTANTE)
El documento original reportaba 149 tests (140 unit + 18 integration). El total real es **311 tests** (289 passed + 22 skipped). La diferencia incluye tests de Fase 5 (orquestador, capacidades, memoria, personalización).

#### 4. Modelo de OpenRouter (MENOR)
El `.env` real usa `openrouter/free` (placeholder), no `deepseek/deepseek-chat-v3-0324:free` como documentaba el original. El default en `config.py` sí es DeepSeek.

#### 5. SQLite fallback (MENOR)
El documento mencionaba "fallback a SQLite" sin especificar limitaciones. En realidad, el SQLite **solo crea 3 tablas** (conversations, messages, user_profiles). Las tablas automotrices NO existen en SQLite, por lo que el AutomotiveRepository retornaría listas vacías silenciosamente.

#### 6. Ruff errores (MENOR)
El documento original decía "Configurado y activo" sin mencionar errores. Hay **20 errores** detectados, pero solo 5 están en código de la aplicación (4x UP045 en `api/schemas/chat.py`, 1x F841 en `infrastructure/llm/openrouter.py`). Los demás están en `scripts/` y `alembic/env.py`.

#### 7. Discrepancia .env.example vs .env (MENOR)
- `.env.example` usa `APP_DEBUG=true`, `.env` usa `DEBUG=true` (ambos funcionan por pydantic-settings)
- `.env.example` incluye `APP_PORT` y `APP_HOST` que `config.py` no consume

### Resultado final de pytest

```
============================= test session starts =============================
platform win32 -- Python 3.14.6, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\USER\Desktop\CHATBOT\backend
configfile: pyproject.toml
plugins: anyio-4.14.2, asyncio-1.4.0
asyncio: mode=Mode.AUTO

collected 311 items

289 passed, 22 skipped, 1 warning in ...
```

### Resultado final de Ruff

```
Found 20 errors.
 6 x E501   [line-too-long]          — scripts/
 4 x UP045  [non-pep604-annotation]  — api/schemas/chat.py
 3 x S608   [hardcoded-sql]          — scripts/
 2 x B023   [function-uses-loop-var] — scripts/
 2 x F541   [f-string-no-placeholders] — scripts/
 2 x I001   [unsorted-imports]       — alembic/env.py, scripts/
 1 x F841   [unused-variable]        — infrastructure/llm/openrouter.py

8 fixable with --fix (1 hidden with --unsafe-fixes)
```

### Roadmap oficial (actualizado)

**Fase 5 — Experiencia Conversacional Inteligente ✅ COMPLETADA**
- Unified pipeline (3 endpoints → AgentOrchestrator)
- Intent-aware AutomotiveAgentTool queries
- Follow-up detection (missing info)
- Recommendations with real data (usage-aware)
- Comparisons with focus guidance
- Diagnosis with real data + anti-hallucination
- Cross-conversation memory (summary-based)
- Simple personalization (preferred_brands)

**Fase 6 — Visualizaciones y Analítica**
- Gráficos
- Estadísticas
- Comparativas visuales
- Dashboards
- Reportes

**Fase 7 — Refinamiento y Calidad AAA**
- UI/UX
- Rendimiento
- Seguridad
- Logging
- Caché
- Optimización
- Testing
- Documentación
- Preparación para la defensa
