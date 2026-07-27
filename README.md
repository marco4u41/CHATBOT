# AutoExpert AI

Asistente automotriz inteligente con conversaciones en tiempo real, recomendaciones de vehículos, comparación, diagnóstico orientativo, garage virtual y dashboard analítico. Potenciado por IA a través de OpenRouter.

## Descripción

AutoExpert AI es una aplicación full-stack que combina una base de datos vehicular con un agente de IA conversacional. El usuario puede mantener conversaciones privadas donde el asistente recomienda, compara y diagnostica vehículos utilizando datos reales de la base de datos complementados con conocimiento general automotriz.

### Funcionalidades principales

- **Autenticación**: Login, registro y cierre de sesión con JWT y cookies httpOnly.
- **Conversaciones privadas**: Cada usuario tiene su historial de conversaciones persistente en PostgreSQL.
- **Recomendaciones**: El agente filtra vehículos por marca, presupuesto, tipo, combustible y uso, manteniendo estrictamente las restricciones del usuario.
- **Comparación**: Tabla comparativa interactiva con análisis cualitativo específico por vehículo.
- **Diagnóstico orientativo**: Orientación sobre posibles problemas mecánicos basada en síntomas reportados.
- **Garage Virtual**: El usuario guarda hasta 10 vehículos en su garage personal, persistente entre sesiones.
- **Modal de comparación**: Comparación side-by-side desde el garage con análisis de uso, confort, desempeño y confiabilidad.
- **Dashboard y analítica**: Estadísticas de uso, distribución de vehículos y actividad reciente.
- **Respuestas en español**: Todo el sistema opera exclusivamente en español.
- **Streaming en tiempo real**: Las respuestas del asistente se muestran token por token.

## Tecnologías

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3 | UI library |
| TypeScript | 5.6 | Type safety |
| Vite | 6.0 | Build tool y dev server |
| TailwindCSS | 3.4 | Estilos |
| Zustand | 5.0 | State management |
| Vitest | 4.1 | Testing |

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Python | >=3.13 | Runtime |
| FastAPI | 0.115+ | API framework |
| SQLAlchemy | 2.0+ (async) | ORM |
| Alembic | 1.14+ | Migraciones |
| asyncpg | 0.30+ | PostgreSQL driver |
| Pydantic | 2.6+ | Validation |
| Uvicorn | 0.32+ | ASGI server |

### IA

| Servicio | Modelo actual |
|---|---|
| OpenRouter | `nvidia/nemotron-3-ultra-550b-a55b:free` |

## Requisitos

### Windows

| Requisito | Versión mínima | Comando para verificar |
|---|---|---|
| Windows | 10/11 | — |
| Git | 2.x | `git --version` |
| Python | 3.13+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |

### Linux / macOS

Las instrucciones están escritas para Windows PowerShell. Los comandos son equivalentes en Linux/macOS con las adaptaciones habituales (usa `python3`, `source .venv/bin/activate`, etc.).

## Estructura del proyecto

```
CHATBOT/
├── .env.example              # Variables de entorno de referencia
├── .gitignore
├── backend/
│   ├── .env.example          # Variables del backend
│   ├── alembic.ini           # Configuración de Alembic
│   ├── alembic/
│   │   ├── env.py            # Entorno de migraciones
│   │   └── versions/         # Archivos de migración
│   ├── app/
│   │   ├── main.py           # Entrada FastAPI
│   │   ├── config.py         # Settings (pydantic-settings)
│   │   ├── dependencies.py   # Dependency injection
│   │   ├── api/v1/           # Endpoints (chat, auth, garage, analytics, automotive)
│   │   ├── domain/           # Lógica de negocio (agent, models, intents)
│   │   ├── infrastructure/   # DB, LLM, repositories
│   │   ├── prompts/          # Templates de prompts (Jinja2)
│   │   └── use_cases/        # Casos de uso
│   ├── database/             # SQLite fallback (dev)
│   ├── scripts/              # Scripts de inspección
│   ├── tests/                # Pruebas backend (pytest)
│   └── pyproject.toml        # Dependencias y configuración Python
├── frontend/
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # Componentes React
│   │   ├── stores/           # Zustand stores
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilidades
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## Instalación

### 1. Clonar el repositorio

```powershell
git clone https://github.com/marco4u41/CHATBOT.git
cd CHATBOT
```

### 2. Configurar PostgreSQL

Crea la base de datos:

```sql
-- Conéctate a PostgreSQL con un usuario con permisos de administrador
CREATE DATABASE autoexpert_db;
```

Puerto por defecto: `5432`. Usuario por defecto: `postgres`.

### 3. Configurar el backend

```powershell
cd backend

# Crear entorno virtual
py -m venv .venv
.\.venv\Scripts\Activate.ps1

# Actualizar pip
python -m pip install --upgrade pip

# Instalar dependencias
pip install -e .
pip install -e ".[dev]"
```

### 4. Variables de entorno del backend

Copia el archivo de ejemplo y completa tus valores:

```powershell
cd backend
Copy-Item .env.example .env
```

Edita `backend/.env` con tus valores reales:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu-password-real
POSTGRES_DB=autoexpert_db

# OpenRouter (obtener key en https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-tu-api-key-real
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free

# Backend
APP_ENV=development
DEBUG=true

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

### 5. Aplicar migraciones

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
alembic upgrade head
```

### 6. Configurar el frontend

```powershell
cd frontend
npm install
```

No se requiere archivo `.env` para el frontend. La conexión al backend se realiza a través del proxy de Vite configurado en `vite.config.ts`.

## Ejecutar

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```powershell
cd frontend
npm run dev
```

### URLs

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://127.0.0.1:8000 |
| Swagger docs | http://127.0.0.1:8000/docs |
| Health check | http://127.0.0.1:8000/health |

## Pruebas

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest tests/ -q
```

### Frontend

```powershell
cd frontend
npm run typecheck
npm run test
npm run build
```

## Migrations (Alembic)

### Ver migración actual

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
alembic current
```

### Ver última migración disponible

```powershell
alembic heads
```

### Aplicar todas las migraciones pendientes

```powershell
alembic upgrade head
```

### Crear una nueva migración

```powershell
alembic revision --autogenerate -m "descripcion del cambio"
```

### Revertir una migración

```powershell
# Revertir una migración
alembic downgrade -1

# Revertir todo
alembic downgrade base
```

> **Precaución**: Revertir migraciones en producción puede causar pérdida de datos. Siempre haz backup antes.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `APP_ENV` | Entorno de ejecución | `development` |
| `DEBUG` | Modo debug | `true` |
| `POSTGRES_HOST` | Host de PostgreSQL | `""` (usa SQLite) |
| `POSTGRES_PORT` | Puerto de PostgreSQL | `5432` |
| `POSTGRES_USER` | Usuario de PostgreSQL | `""` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `""` |
| `POSTGRES_DB` | Nombre de la base de datos | `""` |
| `OPENROUTER_API_KEY` | API key de OpenRouter | `""` |
| `OPENROUTER_MODEL` | Modelo de IA a usar | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| `OPENROUTER_BASE_URL` | URL base de OpenRouter | `https://openrouter.ai/api/v1` |
| `CORS_ORIGINS` | Orígenes permitidos (JSON array) | `["http://localhost:5173"]` |

> Si `POSTGRES_HOST` y `POSTGRES_USER` están vacíos, el backend usa SQLite como fallback (`backend/database/chatbot.db`).

## Flujo de desarrollo

1. Crear una rama para tu feature o fix:

```powershell
git checkout -b feat/nombre-del-cambio
```

2. Realizar los cambios.

3. Ejecutar pruebas:

```powershell
# Backend
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest tests/ -q

# Frontend
cd frontend
npm run typecheck
npm run test
```

4. Hacer commit:

```powershell
git add .
git commit -m "feat: descripcion del cambio"
```

5. Push y Pull Request:

```powershell
git push -u origin feat/nombre-del-cambio
```

Abre un Pull Request en GitHub contra `master`.

## Despliegue

Actualmente el proyecto está preparado para ejecución local en Windows. El despliegue productivo requiere configurar por separado frontend, backend y PostgreSQL.

### Backend (producción)

1. **Variables de entorno**:

```env
APP_ENV=production
DEBUG=false
POSTGRES_HOST=tu-host-postgres
POSTGRES_PORT=5432
POSTGRES_USER=tu-usuario
POSTGRES_PASSWORD=tu-password-seguro
POSTGRES_DB=autoexpert_db
OPENROUTER_API_KEY=sk-or-v1-tu-key-real
JWT_SECRET=genera-un-string-aleatorio-de-64-caracteres
CORS_ORIGINS=["https://tudominio.com"]
```

2. **Migraciones**: Ejecutar `alembic upgrade head` contra la base de datos de producción.

3. **Servidor ASGI**: Ejecutar con Uvicorn o Gunicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

4. **HTTPS**: Usar un reverse proxy (Nginx, Caddy) con certificado SSL.

5. **CORS**: Configurar `CORS_ORIGINS` con solo el dominio del frontend en producción.

### Frontend (producción)

```bash
cd frontend
npm run build
```

La carpeta `dist/` contiene los archivos estáticos. Publicar en un servidor web estático (Nginx, Vercel, Netlify, Cloudflare Pages, etc.).

Configurar el proxy o重escritura de URLs para que `/api/*` se redirija al backend.

### Base de datos

1. Crear una instancia de PostgreSQL en producción (AWS RDS, Supabase, Neon, Railway, etc.).
2. Configurar `DATABASE_URL` apuntando a la instancia.
3. Ejecutar `alembic upgrade head`.
4. No subir backups ni contraseñas al repositorio.

### Checklist de despliegue

- [ ] Variables de entorno configuradas en el servidor
- [ ] `JWT_SECRET` es un valor aleatorio seguro (no el default de desarrollo)
- [ ] Migraciones aplicadas (`alembic upgrade head`)
- [ ] Frontend compilado (`npm run build`)
- [ ] Backend iniciado y respondiendo en `/health`
- [ ] HTTPS habilitado
- [ ] CORS restringido al dominio del frontend
- [ ] Cookies con flag `Secure` en producción
- [ ] Pruebas básicas pasan (login, chat, garage)
- [ ] Logs no contienen secretos ni passwords

## Solución de problemas

### PostgreSQL no inicia

- Verificar que el servicio de PostgreSQL esté corriendo: Services > postgresql
- Verificar el puerto: `netstat -an | findstr 5432`

### Contraseña incorrecta de PostgreSQL

- Verificar `POSTGRES_PASSWORD` en `backend/.env`
- Probar conexión manual: `psql -U postgres -d autoexpert_db`

### Puerto 5432 ocupado

- PostgreSQL puede estar en otro puerto (común: 5433). Actualiza `POSTGRES_PORT` en `.env`.

### Backend no responde

- Verificar que esté corriendo en el puerto 8000
- Revisar `backend.log` o la terminal donde corre uvicorn
- Verificar que no haya errores de migración

### Frontend no conecta con backend

- Verificar que el backend esté corriendo en `http://localhost:8000`
- Vite proxy redirige `/api/*` a `http://localhost:8000` (configurado en `vite.config.ts`)
- No abrir el frontend directamente como archivo HTML

### Cookies y sesión

- El backend usa cookies httpOnly con SameSite=Lax
- Asegurarse de que el frontend acceda a `localhost:5173` (no a otra IP o puerto)

### Migraciones pendientes

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
alembic current    # Ver qué migración está aplicada
alembic upgrade head   # Aplicar pendientes
```

### API key de OpenRouter faltante

- Obtener key en https://openrouter.ai/keys
- Configurar `OPENROUTER_API_KEY` en `backend/.env`
- Verificar que el modelo configurado exista en OpenRouter

### PowerShell bloquea Activate.ps1

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Seguridad

- El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.
- Los archivos `.env.example` contienen solo valores de ejemplo, no secretos reales.
- En producción (`APP_ENV=production`), el backend valida que `JWT_SECRET` no sea el valor por defecto.
- Las passwords se hashean con bcrypt.
- Las sesiones usan JWT con cookies httpOnly.
- CORS está restringido por `CORS_ORIGINS`.

> **Importante**: Si encontraste una API key o password real en el repositorio, revocala inmediatamente en el servicio correspondiente y configura un nuevo valor en tu `.env` local.

## Licencia

Proyecto privado. Todos los derechos reservados.
