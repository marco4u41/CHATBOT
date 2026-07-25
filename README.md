# AutoExpert AI

Chatbot conversacional especializado en el sector automotriz para el mercado latinoamericano. Responde preguntas sobre vehículos utilizando un LLM aumentado con una base de datos estructurada de datos automotrices reales (precios, especificaciones, estadísticas de mercado).

---

## Funcionalidades

- **Chat conversacional** con streaming de respuestas token por token (SSE)
- **Comparación de vehículos** entre 2 o más autos con análisis por categorías
- **Diagnóstico mecánico** con orientación sobre fallas, causas probables y acciones recomendadas
- **Recomendaciones de compra** personalizadas según presupuesto, uso y preferencias
- **Garaje virtual** para almacenar y comparar vehículos favoritos
- **Memoria cross-conversación** con resúmenes de interacciones previas
- **Perfil de usuario persistente** con fusión inteligente de datos
- **Base de datos automotriz** con 47,030 vehículos, 20,036 estadísticas de mercado y 40 marcas indexadas

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | Python 3.13+ / FastAPI |
| **ORM** | SQLAlchemy (asyncio) |
| **Base de Datos** | PostgreSQL 16+ (fallback SQLite) |
| **Migraciones** | Alembic |
| **LLM Provider** | OpenRouter API |
| **Frontend** | React 18 + TypeScript |
| **CSS** | Tailwind CSS 3.4 |
| **State** | Zustand 5 |
| **Build** | Vite 6 |
| **Contenedores** | Docker Compose |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                Docker Compose (3 servicios)          │
│                                                     │
│  ┌────────────┐  ┌────────────────┐  ┌───────────┐  │
│  │ PostgreSQL │◄─│ Backend (API)  │◄─│ Frontend  │  │
│  │   :5432    │  │ FastAPI :8000  │  │ Vite:5173 │  │
│  └────────────┘  └────────────────┘  └───────────┘  │
│                        │                            │
│                   OpenRouter LLM                     │
│                (modelo configurable)                 │
└─────────────────────────────────────────────────────┘
```

Clean Architecture / Hexagonal con separación estricta de capas:

- **API Layer** — Rutas FastAPI + Schemas Pydantic
- **Use Cases** — Orquestación de lógica de negocio
- **Domain** — Modelos, interfaces, agente (sin dependencias de framework)
- **Infrastructure** — Implementaciones concretas (SQLAlchemy, OpenRouter)

---

## Prerrequisitos

- **Python** >= 3.13
- **Node.js** >= 22
- **PostgreSQL** >= 16 (o usar Docker)
- **Docker** y **Docker Compose** (opcional pero recomendado)
- **API Key de OpenRouter** — [Obtener en openrouter.ai](https://openrouter.ai)

---

## Instalación

### Opción 1: Docker Compose (Recomendado)

1. Clonar el repositorio:

```bash
git clone https://github.com/marco4u41/CHATBOT.git
cd CHATBOT
```

2. Crear el archivo `.env`:

```bash
cp .env.example .env
```

3. Editar `.env` con tu API key de OpenRouter:

```env
OPENROUTER_API_KEY=sk-or-v1-tu-api-key-aqui
```

4. Levantar los servicios:

```bash
docker compose up --build
```

Los servicios estarán disponibles en:

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8000/docs |
| **PostgreSQL** | localhost:5432 |

### Opción 2: Instalación Manual

#### Backend

1. Navegar al directorio del backend:

```bash
cd backend
```

2. Crear y activar entorno virtual:

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

3. Instalar dependencias:

```bash
# Dependencias principales
pip install -e "."

# Dependencias de desarrollo (opcional)
pip install -e ".[dev]"
```

4. Crear archivo `.env` en `backend/`:

```env
APP_ENV=development
APP_DEBUG=true
APP_PORT=8000
APP_HOST=0.0.0.0

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin1234
POSTGRES_DB=autoexpert_db

OPENROUTER_API_KEY=sk-or-v1-tu-api-key-aqui
OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

5. Ejecutar migraciones:

```bash
alembic upgrade head
```

6. Iniciar el servidor:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend

1. Navegar al directorio del frontend:

```bash
cd frontend
```

2. Instalar dependencias:

```bash
npm install
```

3. Iniciar servidor de desarrollo:

```bash
npm run dev
```

El frontend estará disponible en http://localhost:5173

---

## Base de Datos

### PostgreSQL (Recomendado)

Si usas Docker, PostgreSQL se inicia automáticamente. Para instalación manual:

1. Crear la base de datos:

```bash
psql -U postgres -c "CREATE DATABASE autoexpert_db;"
```

2. Ejecutar migraciones:

```bash
cd backend
alembic upgrade head
```

### Fallback SQLite

Si PostgreSQL no está configurado, el sistema cae automáticamente a SQLite (`backend/database/chatbot.db`). **Nota:** Las tablas automotrices (vehículos, stats, marcas) no existirán en SQLite — solo funcionarán las funcionalidades básicas de chat.

---

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `APP_ENV` | Entorno de ejecución | `development` |
| `APP_DEBUG` | Modo debug | `true` |
| `APP_PORT` | Puerto del backend | `8000` |
| `POSTGRES_HOST` | Host de PostgreSQL | `localhost` |
| `POSTGRES_PORT` | Puerto de PostgreSQL | `5432` |
| `POSTGRES_USER` | Usuario de PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `admin1234` |
| `POSTGRES_DB` | Nombre de la base de datos | `autoexpert_db` |
| `OPENROUTER_API_KEY` | API key de OpenRouter | — (obligatorio) |
| `OPENROUTER_MODEL` | Modelo LLM a usar | `deepseek/deepseek-chat-v3-0324:free` |
| `CORS_ORIGINS` | Orígenes permitidos CORS | `["http://localhost:5173"]` |

---

## Comandos Útiles

```bash
# Levantar todo con Docker
docker compose up --build

# Detener servicios
docker compose down

# Ver logs del backend
docker compose logs -f backend

# Rebuild completo
docker compose up --build --force-recreate

# Ejecutar tests
cd backend && pytest

# Linting
cd backend && ruff check .

# Type checking
cd backend && mypy .

# Build del frontend
cd frontend && npm run build
```

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/chat` | Chat streaming (SSE) |
| `GET` | `/api/conversations` | Listar conversaciones |
| `GET` | `/api/conversations/{id}/messages` | Mensajes de conversación |
| `DELETE` | `/api/conversations/{id}` | Eliminar conversación |
| `POST` | `/api/vehicles/compare` | Comparar vehículos |
| `POST` | `/api/vehicles/diagnose` | Diagnosticar vehículo |
| `POST` | `/api/vehicles/recommend` | Recomendar vehículo |
| `GET` | `/api/automotive/vehicles/search` | Buscar vehículos |
| `GET` | `/api/automotive/brands` | Listar marcas |

Documentación interactiva disponible en http://localhost:8000/docs

---

## Estructura del Proyecto

```
CHATBOT/
├── docker-compose.yml        # Orquestación de servicios
├── .env.example              # Plantilla de variables de entorno
├── .gitignore
├── DOCUMENTACION_TECNICA.md  # Documentación técnica completa
│
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml        # Dependencias Python
│   ├── alembic.ini           # Config de migraciones
│   ├── alembic/              # Migraciones
│   ├── app/
│   │   ├── main.py           # Entry point
│   │   ├── config.py         # Settings
│   │   ├── dependencies.py   # Dependency Injection
│   │   ├── api/              # Rutas HTTP + Schemas
│   │   ├── domain/           # Modelos, interfaces, agente
│   │   ├── infrastructure/   # DB, LLM, implementaciones
│   │   ├── use_cases/        # Casos de uso
│   │   └── prompts/          # Templates Jinja2
│   ├── scripts/              # Scripts auxiliares
│   └── tests/                # Suite de pruebas
│
└── frontend/
    ├── Dockerfile
    ├── package.json          # Dependencias Node
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    └── src/
        ├── main.tsx          # Entry point React
        ├── App.tsx           # Layout principal
        ├── api/              # Cliente HTTP/SSE
        ├── stores/           # Estado global (Zustand)
        ├── components/       # Componentes React
        ├── types/            # Tipos TypeScript
        ├── utils/            # Utilidades
        └── config/           # Constantes
```

---

## Desarrollo

### Frontend

- **Dev server:** http://localhost:5173
- **Hot Module Replacement** habilitado por defecto
- **Tipado estricto** con TypeScript

### Backend

- **Auto-reload** con `--reload` en uvicorn
- **Documentación Swagger** en http://localhost:8000/docs
- **Documentación ReDoc** en http://localhost:8000/redoc

### Tests

```bash
cd backend
pytest -v
```

---

## Licencia

Proyecto privado. Todos los derechos reservados.

---

> **Desarrollado con la ayuda de [opencode](https://opencode.ai)**
