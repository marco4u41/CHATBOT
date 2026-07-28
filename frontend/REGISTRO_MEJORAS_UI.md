# Registro de Mejoras UI — AutoExpert AI

## v3.3: Domain Completeness, Light Theme Audit, Garage Consolidation, Streaming

**Fecha:** 2026-07-27
**Alcance:** 6 fixes: garage consolidation to header, comprehensive light theme audit (semantic tokens), quick actions with contextual responses, expanded automotive domain classifier, intent pattern improvements, full test coverage

---

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `Header.tsx` | Garage button (Warehouse icon) in header only; all hardcoded `text-white/XX` → `text-[var(--ax-text[-muted/-secondary])]`, borders → `border-[var(--ax-glass-border)]`, bg → `bg-[var(--ax-glass-highlight)]`; mobile hamburger `lg:hidden` |
| `Sidebar.tsx` | "Mi Garage" button removed; `useGarageStore` import removed; all hardcoded colors → theme tokens (14+ instances) |
| `ChatWindow.tsx` | Quick actions replaced: 4 suggestions now send contextual intro prompts (not test queries); logo, suggestion text, streaming content → theme tokens |
| `MessageInput.tsx` | Input text, placeholder, spinner, copyright → theme tokens |
| `MessageBubble.tsx` | User/assistant text colors → theme tokens |
| `PhysicalPanel.tsx` | Budget spinner fix (type="text"+inputMode); all labels, inputs, buttons, borders, engine/terrain cards → theme tokens |
| `SettingsModal.tsx` | Uses `setStoredTheme()`; all tabs, theme/font cards, password fields, labels, borders → theme tokens |
| `NotificationPanel.tsx` | Full conversion: 13 hardcoded `text-white/XX`, `bg-white/XX`, `border-white/XX`, `divide-white/XX` → `text-[var(--ax-text)]`, `bg-[var(--ax-glass-highlight)]`, `border-[var(--ax-glass-border)]`, `divide-[var(--ax-glass-border)]` |
| `GarageSidebar.tsx` | Full conversion: 13 hardcoded `border-white/XX`, `bg-white/XX` → `border-[var(--ax-glass-border)]`, `bg-[var(--ax-glass-highlight)]` |
| `CarCard.tsx` | SVG grid ring/axis stroke `rgba(255,255,255,0.08/0.06)` → `var(--ax-glass-border)` |
| `backend/app/domain/agent/intent_classifier.py` | `_AUTOMOTIVE_DOMAIN_KEYWORDS` expanded from ~200 to ~300+ terms (lubricants, filters, brakes, transmission, tires, batteries, parts, diagnostics, tools); duplicate `return False` removed from `_is_out_of_scope()`; duplicate keywords removed; COMPARISON/RECOMMENDATION signals expanded |
| `backend/tests/test_domain_completeness.py` | **NEW** — 49 test classes covering: lubricants (5W-30, API SP, ACEA, ILSAC, OEM), coolants, filters, tires, batteries, spare parts, the spec query, out-of-scope (Docker, recipes, general history), LLM mock verification for automotive vs non-automotive queries |

### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `backend/tests/test_domain_completeness.py` | Comprehensive domain coverage tests: 49 test classes validating automotive consumables stay in scope, out-of-scope topics are correctly filtered, and LLM is only called for automotive queries |

---

### Funcionalidades Implementadas

#### 1. Garage Consolidation
- Garage button removed from Sidebar; single Warehouse icon button in Header controls `toggleGarage`
- Header is the single entry point for garage on all screen sizes

#### 2. Light Theme Audit — Semantic Tokens
- All components now use CSS variable tokens (`var(--ax-text)`, `var(--ax-text-muted)`, `var(--ax-text-secondary)`, `var(--ax-glass-border)`, `var(--ax-glass-highlight)`, `var(--ax-bg)`)
- Zero remaining hardcoded `text-white/XX`, `bg-white/XX`, `border-white/XX` in any component
- SVG inline strokes (CarCard radar chart) use `var(--ax-glass-border)` for theme-aware rendering

#### 3. Quick Actions with Contextual Responses
- Diagnosticar: sends "Tengo problemas con mi carro..." (full diagnostic prompt)
- Mantenimiento: sends "Necesito información sobre el mantenimiento..."
- Comparar: sends "Me gustaría comparar vehículos..."
- Rendimiento: sends "Quiero mejorar el rendimiento..."

#### 4. Expanded Domain Classifier
- `_AUTOMOTIVE_DOMAIN_KEYWORDS`: ~300+ terms covering lubricants (5W-30, API SP/ACEA/ILSAC), filters, brakes (DOT3/4/5), transmission, tires, batteries, parts, diagnostics (ECU, OBD2, scanner), performance, fuel, accessories
- COMPARISON signals: expanded with product comparison patterns (mejores, versus vs, comparar + aceite/llanta/etc.)
- RECOMMENDATION signals: expanded with product/consumable keywords (aceites, filtros, baterías, etc.)
- Duplicate `return False` removed from `_is_out_of_scope()`

#### 5. Domain Tests
- 49 test classes: lubricants (5W-30, API SP, ACEA, ILSAC, OEM, viscosity, synthetic vs mineral, oil change interval), coolants, brake fluids (DOT4), filters (oil, air, fuel, cabin), tires (pressure, rotation, brand, wear), batteries (replacement, type, warning), spare parts (OEM, aftermarket, clutch kit), the spec query, out-of-scope (Docker, recipes, general history), LLM mock verification (8 automotive queries that DO call LLM)

---

### Verificación

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | 0 errores |
| `npx vite build` | success (6.42s) |
| `python -m pytest` | 469 passed, 22 skipped |
| `ruff check` | All checks passed (changed files) |

---

### Notas Técnicas

- **Theme tokens**: Components use `text-[var(--ax-text)]`, `text-[var(--ax-text-muted)]`, `text-[var(--ax-text-secondary)]`, `bg-[var(--ax-glass-highlight)]`, `border-[var(--ax-glass-border)]` — all resolve via CSS variables that change under `.theme-light`
- **SVG theme support**: Inline SVG strokes use `var(--ax-glass-border)` CSS variables (can't use Tailwind classes in SVG attributes)
- **Classifier architecture**: `_is_out_of_scope()` checks both keyword presence and automotive intent signals; GENERAL intent routes to LLM, OUT_OF_SCOPE returns local response without LLM call
- **Mobile sidebar**: The `lg:hidden` hamburger in Header only appears on mobile; desktop relies on Sidebar's always-visible panel with its own collapse toggle

---

## v3.2: Functional Completeness — Notifications, Settings, Garage, Context, Sidebar, CAR Blocks

**Fecha:** 2026-07-27
**Alcance:** 14 functional areas: notifications, settings, garage entry point, context isolation, sidebar, physical filters, CAR blocks, message input, conversation management, quick actions, logout, per-user isolation

---

### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `stores/notificationStore.ts` | Zustand store: notifications array, unread count, add/mark-read/markAllRead/clearAll/togglePanel |
| `components/notifications/NotificationPanel.tsx` | Dropdown panel with type-colored icons (info/success/warning/error), time formatting, mark-read on click, clear all |
| `components/settings/SettingsModal.tsx` | Glass modal (Radix Dialog) with 3 tabs: Theme (dark/light/system, persisted to localStorage), Font size (small/normal/large, persisted), Password change (current + new + confirm, show/hide toggles, validation, Spanish error messages) |
| `components/chat/VehicleCard.tsx` | CAR block renderer: pentagon SVG radar chart (5 axes), specs grid (engine, transmission, fuel, price, mileage), add-to-garage button with notification feedback |

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `backend/app/api/v1/auth.py` | Added `POST /auth/change-password` endpoint: verifies current password, hashes new, updates user, returns success/error. Fixed 3 pre-existing ruff E501 line-length violations |
| `backend/app/api/schemas/auth.py` | Added `ChangePasswordRequest` schema with `current_password` (min 1) and `new_password` (min 8, max 128) fields |
| `App.tsx` | Single sidebar toggle (desktop: always-visible collapsible panel; mobile: sheet overlay). Removed duplicate garage button from Header. Wired `SettingsModal`, `loadConversations` on auth. Passes `onOpenSettings` to Header |
| `Header.tsx` | Removed duplicate garage icon (was in Header + Sidebar). Wired `NotificationPanel` dropdown with real unread count badge (not static dot). Wired Settings gear to `onOpenSettings` prop. Removed unused `useGarageStore` import |
| `Sidebar.tsx` | Logout now clears all stores: chat (clearMessages), conversation (reset state), garage (clearGarage), then calls auth logout. Nueva Consulta clears messages before setting activeId to null. Added `useChatStore` import |
| `MessageBubble.tsx` | Integrates `carBlockParser.ts`. For assistant messages with CAR blocks: parses segments, renders `VehicleCard` for each `[CAR]...[/CAR]` block, ReactMarkdown for plain text. Never shows raw JSON |
| `MessageInput.tsx` | Removed Paperclip and ImageIcon buttons (were decorative/non-functional). Reclaimed horizontal space for textarea |
| `PhysicalPanel.tsx` | Budget input: added `$` prefix (absolute positioned), `bg-white/[0.06]` background, `border-white/[0.12]` border, `text-white/85` text, `placeholder:text-white/30`, `focus:border-ax-wine/30` + `focus:ring-1 focus:ring-ax-wine/20` |
| `chatStore.ts` | Added 500ms send debounce (`lastSendTime` state, prevents double-send). Syncs new conversation to `conversationStore.addConversation` on stream complete. Clears `streamingContent` on `clearMessages`. Imports `useConversationStore` |
| `conversationStore.ts` | Added try/catch on `loadConversations` (was unhandled promise). Added `addConversation(id, title)` method: creates new entry if not exists, updates timestamp + message count if exists. Fixed missing closing paren (TS error) |
| `ChatWindow.tsx` | Added conversation selection effect: when `activeId` changes, calls `loadMessages`; when activeId becomes null, calls `clearMessages`. Tracks `prevActiveIdRef` to prevent re-loading same conversation. Imports `useConversationStore` |

---

### Funcionalidades Implementadas

#### 1. Notifications

- **Store:** `notificationStore.ts` — 50 max notifications, unread count auto-tracked
- **Panel:** Dropdown below bell icon, click-outside to close, `AnimatePresence` fade+scale
- **Types:** `info` (steel), `success` (green), `warning` (gold), `error` (red) — each with distinct Lucide icon + background
- **Features:** Mark individual read on click, mark all read, clear all, relative time formatting (Ahora/Xm/Xh/Xd)
- **Badge:** Unread count shows as gold pill on bell icon (max `9+`)

#### 2. Settings

- **Modal:** Uses existing `GlassModal` (Radix Dialog), size `md`
- **Theme tab:** Dark (default), Light, System — persisted to `localStorage.ax-theme`
- **Font size tab:** Small (14px), Normal (16px), Large (18px) — persisted to `localStorage.ax-font-size`, applies to `document.documentElement.style.fontSize`
- **Password tab:** Current + new + confirm fields, show/hide eye toggle per field, validation:
  - Current password required
  - New password min 8 characters
  - Confirm must match new
  - Must differ from current
  - Spanish error messages
  - Loading spinner during API call
  - Success notification on completion

#### 3. Backend Password Change

- **Endpoint:** `POST /api/auth/change-password`
- **Schema:** `ChangePasswordRequest(current_password, new_password)`
- **Logic:** Verify current password with bcrypt, check new ≠ current, hash new, update user, log event

#### 4. Chat Store — New Conversation Flow + Debounce

- **Debounce:** 500ms minimum between sends (prevents accidental double-send)
- **Conversation sync:** On stream complete, `addConversation` called with conversation ID and title derived from first user message (truncated to 80 chars)
- **Cleanup:** `clearMessages` now also resets `streamingContent`

#### 5. Conversation Store — Load & Create

- **Load:** Added try/catch (was unhandled rejection on network error)
- **Add:** New `addConversation(id, title)` method creates entry in list or updates existing (increments message count, updates timestamp)
- **Per-user:** Backend already scopes conversations by `user_id` via `get_current_user` dependency

#### 6. Sidebar — Single Toggle, Proper Logout

- **Desktop:** Always-visible 280px panel, collapsible to 64px. Single `PanelLeftClose` toggle in Header
- **Mobile:** Sheet overlay via AnimatePresence, triggered by same toggle
- **Logout:** Clears chat messages, conversation list, garage vehicles, then calls `POST /auth/logout`

#### 7. Physical Filters — Budget Input Fix

- **Before:** `bg-white/4 border-white/8 text-white/70` — white-on-white, invisible text
- **After:** `bg-white/[0.06] border-white/[0.12] text-white/85` with `$` prefix, focus ring `ax-wine/30`

#### 8. CAR Block Rendering

- **Parser:** `carBlockParser.ts` was already implemented (`parseMessageSegments`, `hasCarBlocks`)
- **Integration:** `MessageBubble` detects CAR blocks in assistant messages, renders `VehicleCard` component
- **VehicleCard:** Pentagon SVG radar chart (5 axes: performance, economy, safety, comfort, reliability), specs row, price in USD, add-to-garage button
- **Never shows raw JSON:** `[CAR]{...}[/CAR]` text is always parsed and rendered visually

#### 9. Message Input — Cleanup

- Removed `Paperclip` and `ImageIcon` buttons (no upload functionality implemented)
- Reclaimed horizontal space for textarea

#### 10. Quick Actions — Prompts Ready

- 4 welcome cards with specific technical prompts:
  - **Diagnosticar:** P0300/P0171/P0420 on Toyota Corolla 2018
  - **Mantenimiento:** Preventive plan for Honda Civic 2020 at 45k km
  - **Comparar:** 5W-30 synthetic oils comparison for turbo engines in Venezuela
  - **Rendimiento:** 2.0T 250HP engine analysis and optimization

#### 11. Conversation Selection

- **ChatWindow** watches `activeId` from conversationStore
- On change: loads messages for selected conversation
- On deselect (null): clears messages to show welcome screen
- Prevents re-loading same conversation via `prevActiveIdRef`

---

### Pruebas Ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | Sin errores (0) |
| `npx vitest run` | 254/254 tests pasaron (27 archivos) |
| `npx vite build` | Build exitoso (55.90 kB CSS, 594.95 kB JS) |
| `python -m pytest tests/ -x -q` | 430 passed, 22 skipped |
| `python -m ruff check app/api/v1/auth.py app/api/schemas/auth.py` | All checks passed |

---

### Pendientes Reales

| # | Pendiente | Razón |
|---|-----------|-------|
| 1 | Theme toggle applies actual CSS changes | localStorage is set but no CSS class switching implemented yet (requires `dark`/`light` class on `<html>` + Tailwind `darkMode: 'class'`) |
| 2 | Browser Notification API | Should only fire after response finishes / comparison ready / important error, not during streaming — needs careful timing integration |
| 3 | Notification persistence | Currently in-memory only (Zustand). Would need backend endpoint + localStorage fallback for persistence across sessions |
| 4 | Per-user garage isolation | Backend already scopes by user_id. Frontend clears garage on logout. No additional work needed |
| 5 | Focus trap in settings modal | Radix Dialog handles this natively via `GlassModal` |
| 6 | Conversation title auto-generation | Currently uses first message truncated to 80 chars. Could use LLM to generate better titles |

---

## v3.1: Main Screen Redesign — Automotive Digital Cockpit

**Fecha:** 2026-07-27
**Alcance:** Sidebar, Header, ChatWindow (Welcome + Messages), MessageInput, MessageBubble, StreamingIndicator, PhysicalPanel, App.tsx, globals.css

---

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `globals.css` | Fondo ambient actualizado: radial gradient steel blue + wine, grid sutil 64px, noise texture. Nuevas clases: `ax-ambient-bg`, `ax-sidebar-glass`, `ax-input-glass`, `ax-message-capsule`, `ax-welcome-halo`, `ax-suggestion` |
| `App.tsx` | Shell responsive: desktop sidebar siempre visible (colapsable), mobile sidebar via motion sheet overlay. Eliminado view switching (solo chat) |
| `Sidebar.tsx` | Rediseño completo: 280px colapsable a 64px, glass sidebar oscuro, Lucide icons (MessageSquarePlus, MessageSquare, LogOut, Wrench, PanelLeftClose), indicador wine vertical, motion open/close, user section, garage quick access |
| `Header.tsx` | 68px height, glass light, conversation title, user initials badge, notification/settings buttons, wine sparkles logo |
| `ChatWindow.tsx` | Welcome: halo radial steel blue, logo wine/steel gradient 80px, Playfair Display title, 4 quick-access PlatinumGlassButton cards (Diagnosticar, Mantenimiento, Comparar, Rendimiento). Messages: max-w-4xl, wine left border para assistant |
| `MessageInput.tsx` | Floating capsule: 22px radius, textarea auto-resize, paperclip/image buttons, animated send button (wine gradient, scale animation), platinum border |
| `MessageBubble.tsx` | User: wine gradient background. Assistant: glass panel con gold "AE" badge. Markdown content con styles premium |
| `StreamingIndicator.tsx` | Steel blue dots con scale+opacity animation, gold "AE" badge, "Pensando..." label |
| `PhysicalPanel.tsx` | Reescrito para PhysicalPanelFilters real: engine_type, terrain, budget. Icons Lucide actualizados (Gauge, Mountain, DollarSign) |
| `format.ts` | Nuevo archivo: `formatRelativeTime()` para timestamps relativos en sidebar |

### Fondo Ambient

- Radial gradient steel blue 22% opacity desde top center
- Radial gradient wine 12% opacity bottom-right
- Grid sutil 64px con steel blue 4% opacity
- Noise texture SVG 2% opacity
- Fondo base: `#06080D` → `#05070B` gradient

### Sidebar Design

- **Desktop:** 280px, colapsable a 64px via `PanelLeftClose` icon
- **Mobile:** Sheet overlay via motion, 280px ancho, slide from left
- **Glass:** `ax-sidebar-glass` — very dark (88% opacity), steel blue highlights, platinum right border
- **Active item:** `ax-sidebar-active` — wine 10% bg, wine 18% border, wine 3px left indicator
- **Icons:** Lucide (MessageSquarePlus, MessageSquare, LogOut, Wrench, PanelLeftClose)
- **User section:** Initials badge, display name, role, logout button

### Welcome Screen

- **Halo:** `ax-welcome-halo` — radial steel blue 18% opacity, 220px, blur 30px
- **Logo:** 80px rounded-[22px], wine→steel gradient, border white/12, shadow-2xl
- **Title:** Playfair Display italic, 30px, gold+white+steel
- **Subtitle:** White 35% opacity, 14px
- **Quick-access:** 4 cards grid, `ax-suggestion` class, Lucide icons, glass hover states

### Message Input

- **Shape:** Floating capsule, `rounded-[22px]`, min-height from textarea
- **Glass:** `ax-message-capsule` — very dark (82% opacity), 24px blur, platinum border
- **Focus:** Steel blue border glow + ring
- **Send button:** Animated scale (scale 0.8→1), wine gradient, shadow wine, appears on input
- **Placeholder:** "Escribe tu consulta técnica..."

### Pruebas Ejecutadas (Rediseño)

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | Sin errores |
| `npx vitest run` | 254/254 tests pasaron (27 archivos) |
| `npx vite build` | Build exitoso (53.06 kB CSS, 576 kB JS) |

---

### Auditoría Visual v3.1.1 — Pulido Final

**Fecha:** 2026-07-27
**Alcance:** Corrección de contraste, accesibilidad, consistencia visual en los 10 archivos de la pantalla principal.

#### Problemas Encontrados

| # | Categoría | Descripción | Severidad |
|---|-----------|-------------|-----------|
| 1 | Contraste | "HISTORIAL" label en Sidebar a `text-white/30` (~4.6% luminance) — invisible sobre fondo oscuro | Crítica |
| 2 | Contraste | Timestamps de conversaciones a `text-white/20` (~3.1% luminance) — ilegibles | Crítica |
| 3 | Contraste | Texto vacío "Inicia una consulta técnica" a `text-white/15` — invisible | Crítica |
| 4 | Contraste | Icono estado vacío a `text-white/10` — imperceptible | Crítica |
| 5 | Contraste | Contador mensajes Header a `text-white/30` — invisible sobre glass light | Alta |
| 6 | Contraste | "AI" en logo Header y Welcome a `text-ax-steel/50` — demasiado oscuro | Alta |
| 7 | Contraste | Subtítulo Welcome a `text-white/35` — borderline en 14px | Alta |
| 8 | Contraste | Iconos tarjetas de sugerencia a `text-white/45` — poco visibles en 18px | Media |
| 9 | Contraste | Subtítulos tarjetas a `text-white/30` — ilegibles en 12px | Alta |
| 10 | Contraste | Label "AutoExpert AI" en burbujas a `text-ax-gold/50` — gold apagado | Media |
| 11 | Contraste | "Pensando..." a `text-ax-gold/40` — barely visible | Media |
| 12 | Contraste | Timestamp mensajes a `opacity-40` — muy bajo | Media |
| 13 | Contraste | "Filtros Físicos" label a `text-white/60` — borderline | Media |
| 14 | Contraste | Labels de sección PhysicalPanel a `text-white/40` — bajos | Media |
| 15 | Contraste | "Limpiar filtros" a `text-white/50` — bajo para acción | Media |
| 16 | Contraste | Icono conversación inactiva a `text-white/25` — invisible | Alta |
| 17 | Botones | Botón colapsar Sidebar a `text-white/40` — invisible en reposo | Alta |
| 18 | Botones | Botón logout a `text-white/30` — invisible en reposo | Alta |
| 19 | Botones | Toggle sidebar Header a `text-white/40` — invisible en reposo | Alta |
| 20 | Botones | Bell/Settings icons a `text-white/30` — invisibles en reposo | Alta |
| 21 | Botones | Paperclip/image input buttons a `text-white/25` — invisibles | Alta |
| 22 | Platinum | `.ax-platinum-btn` bg `0.08` — botón imperceptible en reposo | Alta |
| 23 | Platinum | `.ax-platinum-btn` border `white/0.18` — borde insuficiente | Media |
| 24 | Bordes | Sidebar glass border-right `white/0.10` — demasiado sutil | Media |
| 25 | Bordes | Suggestion border `white/0.10` — imperceptible | Media |
| 26 | Bordes | Sidebar top highlight `white/0.08` — invisible | Media |
| 27 | Bug | GarageSidebar usa `border-ax-border-subtle` — token no definido en Tailwind | Alta |
| 28 | Radios | Botón colapsar/logout usan `rounded-lg` (8px) — inconsistente con items `rounded-xl` (12px) | Baja |
| 29 | Blur | Sidebar glass `blur(24px)` — excesivo, sin contenido detrás que justifique | Baja |
| 30 | Blur | Sheet content `blur(24px)` — excesivo | Baja |
| 31 | Focus | `.ax-focus-ring` usa ring wine `0.4` opacity — poco visible en fondo oscuro | Alta |
| 32 | A11y | Mobile sheet sin `aria-label` — inaccessible para screen readers | Media |
| 33 | A11y | Textarea input sin `aria-label` — inaccessible | Media |
| 34 | A11y | PhysicalPanel budget input sin `aria-label` | Media |
| 35 | A11y | Header avatar div con `cursor-pointer` sin `role="button"` | Baja |
| 36 | Animación | Conversation list stagger `i * 0.02` sin cap — 20+ animaciones secuenciales | Baja |
| 37 | Contraste | Loading spinner text a `text-white/30` — dim para estado de carga | Baja |
| 38 | Contraste | Footer input text a `text-white/15` — invisible | Baja |

#### Correcciones Aplicadas

| # | Archivo | Cambio | Línea(s) |
|---|---------|--------|----------|
| 1 | `globals.css` | Focus ring: wine `0.4` → gold `0.55` + `#06080D` spacer | 156-158 |
| 2 | `globals.css` | `.ax-platinum-btn` bg `0.08` → `0.10`, border `0.18` → `0.22`, inset highlight `0.10` → `0.12` | 356-363 |
| 3 | `globals.css` | `.ax-sidebar-glass` blur `24px` → `20px`, border-right `white/0.10` → `white/0.12` | 124-131 |
| 4 | `globals.css` | `.ax-sidebar-glass::before` highlight `white/0.08` → `white/0.10` | 134-141 |
| 5 | `globals.css` | `.ax-suggestion` border `white/0.10` → `white/0.12` | 287-294 |
| 6 | `globals.css` | `.ax-sheet-content` blur `24px` → `20px` | 330-335 |
| 7 | `Sidebar.tsx` | Collapse button: `rounded-lg text-white/40` → `rounded-xl text-white/50` | 84-86 |
| 8 | `Sidebar.tsx` | "HISTORIAL" label: `text-white/30` → `text-white/45` | 111 |
| 9 | `Sidebar.tsx` | Empty icon: `text-white/10` → `text-white/15` | 120 |
| 10 | `Sidebar.tsx` | Empty text: `text-white/25` → `text-white/30`; subtext: `text-white/15` → `text-white/25` | 121-124 |
| 11 | `Sidebar.tsx` | Stagger delay: `i * 0.02` → `Math.min(i * 0.02, 0.15)` | 135 |
| 12 | `Sidebar.tsx` | Inactive icon: `text-white/25` → `text-white/30` | 152 |
| 13 | `Sidebar.tsx` | Timestamp: `text-white/20` → `text-white/35` | 165 |
| 14 | `Sidebar.tsx` | Role label: `text-white/25` → `text-white/35` | 216 |
| 15 | `Sidebar.tsx` | Logout button: `rounded-lg text-white/30` → `rounded-xl text-white/40` | 223-224 |
| 16 | `Header.tsx` | Toggle button: `rounded-lg text-white/40` → `rounded-xl text-white/50` | 46-48 |
| 17 | `Header.tsx` | Message count: `text-white/30` → `text-white/40` | 63 |
| 18 | `Header.tsx` | "AI" text: `text-ax-steel/50` → `text-ax-steel/70` | 76 |
| 19 | `Header.tsx` | Garage toggle inactive: `text-white/30` → `text-white/45` | 92 |
| 20 | `Header.tsx` | Bell icon: `text-white/30` → `text-white/45` | 100 |
| 21 | `Header.tsx` | Settings icon: `text-white/30` → `text-white/45` | 108 |
| 22 | `Header.tsx` | Avatar: + `role="button" tabIndex={0} aria-label="Perfil de usuario"` | 115 |
| 23 | `ChatWindow.tsx` | Welcome icon border: `white/12` → `white/15` | 77 |
| 24 | `ChatWindow.tsx` | "AI" text: `text-ax-steel/50` → `text-ax-steel/70` | 90 |
| 25 | `ChatWindow.tsx` | Subtitle: `text-white/35` → `text-white/45` | 97 |
| 26 | `ChatWindow.tsx` | Card icon bg: `white/5` → `white/6`; border: `white/8` → `white/10` | 122 |
| 27 | `ChatWindow.tsx` | Card icon: `text-white/45` → `text-white/50`; sublabel: `text-white/30` → `text-white/40` | 123, 129 |
| 28 | `ChatWindow.tsx` | Streaming label: `text-ax-gold/50` → `text-ax-gold/60` | 157 |
| 29 | `MessageBubble.tsx` | Label: `text-ax-gold/50` → `text-ax-gold/60` | 37 |
| 30 | `MessageBubble.tsx` | Timestamp: `opacity-40` → `opacity-50` | 49 |
| 31 | `StreamingIndicator.tsx` | "Pensando...": `text-ax-gold/40` → `text-ax-gold/55` | 29 |
| 32 | `MessageInput.tsx` | Paperclip/image: `text-white/25` → `text-white/35` | 41, 47 |
| 33 | `MessageInput.tsx` | Textarea: + `aria-label="Escribe tu consulta técnica"`, placeholder `text-white/25` → `text-white/35` | 54-61 |
| 34 | `MessageInput.tsx` | Inactive send icon: `text-white/20` → `text-white/30` | 86 |
| 35 | `MessageInput.tsx` | Footer: `text-white/15` → `text-white/20` | 93 |
| 36 | `PhysicalPanel.tsx` | Title: `text-white/60` → `text-white/70` | 79 |
| 37 | `PhysicalPanel.tsx` | Close button: `text-white/30` → `text-white/45` | 82 |
| 38 | `PhysicalPanel.tsx` | Section labels: `text-white/40` → `text-white/50` | 90, 118, 146 |
| 39 | `PhysicalPanel.tsx` | Budget input: + `inputMode="numeric"` + `aria-label="Presupuesto en dólares"` | 150-154 |
| 40 | `PhysicalPanel.tsx` | Clear filters: `text-white/50` → `text-white/60` | 164 |
| 41 | `App.tsx` | Loading text: `text-white/30` → `text-white/40` | 52 |
| 42 | `App.tsx` | Mobile sheet: + `aria-label="Menú de navegación"` | 92 |
| 43 | `GarageSidebar.tsx` | Undefined token: `border-ax-border-subtle` → `border-white/[0.08]` | 96 |

#### Resolución de Problemas Revisados

| Categoría | Estado | Detalle |
|-----------|--------|---------|
| Contraste texto | Resuelto | Todos los textos secundarios ≥ `text-white/30` en 12px+, ≥ `text-white/40` en 11px+. Labels ≥ `text-white/45` |
| Contraste botones | Resuelto | Todos los botones icon-only ≥ `text-white/45` en reposo. Platinum button bg `0.10` + border `0.22` |
| Contraste glass | Resuelto | Bordes glass ≥ `white/0.12`. Sidebar border-right `white/0.12` |
| Focus visible | Resuelto | Ring gold `0.55` con spacer `#06080D` — visible sobre cualquier fondo oscuro |
| Accesibilidad | Resuelto | ARIA labels en textarea, budget input, mobile sheet, avatar. `inputMode="numeric"` en budget |
| Animaciones | Resuelto | Stagger capado a `0.15s` máximo. `prefers-reduced-motion` en CSS cubre CSS transitions; motion components con transforms simples no requieren `motion-reduce` adicional |
| Radios | Resuelto | Botones de acción sidebar/Header normalizados a `rounded-xl` (12px) |
| Blur | Resuelto | Sidebar y sheet blur reducido de `24px` → `20px` |
| Bug token | Resuelto | `border-ax-border-subtle` reemplazado por `border-white/[0.08]` |

#### Resultados de Pruebas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | Sin errores |
| `npx vitest run` | 254/254 tests pasaron (27 archivos) |
| `npx vite build` | Build exitoso (53.07 kB CSS, 576 kB JS) |

#### Pendientes Reales

| # | Pendiente | Razón |
|---|-----------|-------|
| 1 | Focus trap en mobile sidebar sheet | Requiere integración con Radix Dialog o custom hook — fuera del alcance de pulido visual |
| 2 | Focus return al botón que abrió el sheet al cerrarlo | Mismo motivo que #1 |
| 3 | `prefers-reduced-motion` para motion/react `transform` animations | motion/react v12 no expone `useReducedMotion` en todos los contextos; requiere wrapper custom o `LazyMotion` con `features={false}` |
| 4 | Keyboard navigation en tarjetas de sugerencia (Enter/Space) | Los `<button>` ya son keyboard-accessibles por defecto |
| 5 | High contrast mode (`forced-colors`) | Requiere media query adicional, pendiente para iteración futura |

---

## v3.0: Premium Visual Foundations

**Fecha:** 2026-07-27
**Alcance:** Design system tokens, componentes reutilizables, motion integration, GlassSheet

---

### Dependencias Agregadas

No se instalaron dependencias nuevas. Todas las dependencias ya existían en `package.json`:

| Paquete | Versión | Motivo |
|---------|---------|--------|
| `motion` | ^12.42.2 | Transiciones y microinteracciones en componentes del design system |
| `lucide-react` | ^1.27.0 | Sistema único de iconos (ya integrado en GlassModal, GlassSheet) |
| `@radix-ui/react-dialog` | ^1.1.23 | Base para GlassModal y GlassSheet (focus trap, accesibilidad, teclado) |
| `@radix-ui/react-dropdown-menu` | ^2.1.24 | Menús desplegables accesibles |
| `@radix-ui/react-tooltip` | ^1.2.16 | Tooltips accesibles (GlassTooltip) |
| `@radix-ui/react-slot` | ^1.3.3 | Composición de botones (asChild pattern) |
| `tailwind-merge` | ^2.6.0 | Resolución de clases Tailwind conflictivas (cn utility) |
| `clsx` | ^2.1.1 | Construcción condicional de clases |

**No instalado:** Material UI, Ant Design, Bootstrap, Three.js, GSAP, partículas, glassmorphism kits.

---

### Tokens Visuales Creados/Consolidados

#### Tailwind Config (`tailwind.config.ts`)

| Token | Valor | Descripción |
|-------|-------|-------------|
| `ax-bg-deep` | `#06080D` | Fondo profundo |
| `ax-bg-base` | `#0A0F17` | Fondo base |
| `ax-bg-elevated` | `#0E1520` | Superficies elevadas |
| `ax-bg-raised` | `#131B28` | Superficies elevadas máxima |
| `ax-surface-platinum` | `rgba(225, 231, 239, 0.10)` | Superficie platinum translúcida |
| `ax-glass` | `rgba(17, 23, 34, 0.72)` | Superficie glass base |
| `ax-glass-light` | `rgba(17, 23, 34, 0.50)` | Glass ligero |
| `ax-glass-solid` | `rgba(17, 23, 34, 0.88)` | Glass sólido |
| `ax-glass-border` | `rgba(255, 255, 255, 0.10)` | Borde glass |
| `ax-glass-border-strong` | `rgba(255, 255, 255, 0.18)` | Borde glass fuerte |
| `ax-wine` | `#8B3152` | Acento principal wine |
| `ax-wine-light` | `#B14A6D` | Wine luminoso |
| `ax-steel` | `#567FA5` | Azul acero |
| `ax-gold` | `#B59A62` | Gold discreto |
| `ax-text-primary` | `#E7ECF3` | Texto principal |
| `ax-text-secondary` | `#919CAA` | Texto secundario |

#### Sombras (`boxShadow`)

| Token | Descripción |
|-------|-------------|
| `ax-glass` | Sombra glass estándar con inset highlights |
| `ax-card` | Sombra de tarjeta |
| `ax-elevated` | Sombra elevada |
| `ax-modal` | Sombra de modal |
| `ax-glow-wine` | Brillo wine sutil |
| `ax-glow-gold` | Brillo gold sutil |
| `ax-ring-wine` | Ring de foco wine |
| `ax-ring-steel` | Ring de foco steel |
| `ax-ring-gold` | Ring de foco gold |

#### Animaciones

| Token | Descripción |
|-------|-------------|
| `slide-in-right` | Entrada desde derecha (para Sheet) |
| `slide-in-left` | Entrada desde izquierda (para Sheet) |

#### CSS Classes (`globals.css`)

| Clase | Descripción |
|-------|-------------|
| `ax-platinum-surface` | Superficie platinum con borde translúcido |
| `ax-interactive` | Estados hover/active/disabled estándar |
| `ax-sheet-overlay` | Overlay para Sheet (glass dark) |
| `ax-sheet-content` | Contenido Sheet con glass dark |
| `ax-platinum-btn` | Botón platinum glass (base para PlatinumGlassButton) |

---

### Componentes Modificados

| Componente | Cambios |
|------------|---------|
| `GlassPanel` | + prop `motionPreset` ("fade"/"scale"/"slideUp"/"none"), + variante "platinum", integración motion/react |
| `GlassCard` | + prop `animate` para entrada motion, + prop `hover` con translateY sutil |
| `GlassButton` | Integración motion/react con `whileTap`, mismo comportamiento visual |
| `IconButton` | + variante "platinum", integración motion/react con `whileTap` |
| `NavigationItem` | Integración motion/react con `whileTap` |
| `FloatingInput` | Label animado con `AnimatePresence`, error message con animación de entrada |

### Componentes Creados

| Componente | Descripción |
|------------|-------------|
| `PlatinumGlassButton` | Botón con estilo platinum glass (`ax-platinum-btn`), soporte asChild, loading state, motion |
| `PrimaryButton` | Botón wine primario dedicado (gradiente wine, glow wine), soporte asChild, loading state, motion |
| `GlassSheet` | Panel lateral construido sobre Radix Dialog, soporte `side="left"/"right"`, slide animation, focus trap |

### Componentes Eliminados

| Componente | Razón |
|------------|-------|
| `GlassInput.tsx` | Duplicado de `FloatingInput.tsx`. Se mantiene export `GlassInput` como alias en `index.ts` |

---

### Paleta Base Aplicada

| Propósito | Color | Valor |
|-----------|-------|-------|
| Fondo | Background | `#06080D` |
| Fondo elevado | Background elevated | `#0A0F17` |
| Glass | Superficie glass | `rgba(17, 23, 34, 0.72)` |
| Platinum | Superficie platinum | `rgba(225, 231, 239, 0.10)` |
| Borde platinum | Borde translúcido | `rgba(255, 255, 255, 0.18)` |
| Texto primario | Texto principal | `#E7ECF3` |
| Texto secundario | Texto secundario | `#919CAA` |
| Wine | Acento principal | `#8B3152` |
| Wine bright | Acento luminoso | `#B14A6D` |
| Steel blue | Azul acero | `#567FA5` |
| Gold | Gold discreto | `#B59A62` |

---

### Pruebas Ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run typecheck` | Sin errores |
| `npm run test` | 254/254 tests pasaron (27 archivos) |
| `npm run build` | Build exitoso (52.58 kB CSS, 623 kB JS) |

---

### Notas Técnicas

- **motion/react**: Se usa `motion/react` (no `framer-motion`) ya que es el import correcto para motion v12+
- **Radix Sheet**: No existe `@radix-ui/react-sheet` como paquete independiente. GlassSheet se construyó sobre `@radix-ui/react-dialog` con animaciones slide personalizadas
- **GlassInput**: Se eliminó el archivo duplicado. El export `GlassInput` se mantiene como alias de `FloatingInput` en `index.ts` para backward compatibility
- **Prop spreading**: Se evitó `...props` en `motion.button` debido a conflictos de tipos entre `HTMLButtonAttributes` y `HTMLMotionProps` (específicamente `onDrag`). Se listan props explícitamente
- **Backward compatibility**: Todos los componentes existentes mantienen sus interfaces originales. Los cambios son aditivos (nuevas props opcionales)

---

## v3.3: Targeted UX Fixes — Input, Theme, Icons, Sidebar, Streaming

**Fecha:** 2026-07-27
**Alcance:** 5 targeted fixes: budget input spinners, light theme support, garage icon duplication, sidebar collapse duplication, streaming markdown rendering

---

### Fix 1: Budget Input Spinners

**Archivo:** `components/chat/PhysicalPanel.tsx`

**Problema:** `<input type="number">` rendered native browser spinner arrows (+/-) which clashed with the premium glass aesthetic.

**Solución:**
- Changed `type="number"` → `type="text"` with `inputMode="numeric"` and `pattern="[0-9]*"`
- Added `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none` to suppress any remaining spinners
- Added formatted display via `toLocaleString("en-US")` and sanitization via `.replace(/\D/g, "")` in onChange

---

### Fix 2: Light Theme Support

**Archivos:** `styles/globals.css`, `utils/theme.ts` (nuevo), `App.tsx`, `components/settings/SettingsModal.tsx`

**Problema:** SettingsModal saved theme to `localStorage` but never applied it to the DOM. No CSS custom properties existed. Body had hardcoded `#06080D` background. `darkMode: "class"` was configured but no class toggle existed.

**Solución:**
- **CSS Custom Properties** (`:root` + `.theme-light`): 35+ theme tokens covering backgrounds, text, glass, borders, wine, gold, steel, scrollbar, overlay, selection — all switchable via `.theme-light` class on `<html>`
- **`utils/theme.ts`**: `applyTheme()` toggles `theme-light` class on `<html>`, handles `system` preference via `matchMedia`. `getStoredTheme()` / `setStoredTheme()` for localStorage persistence
- **`App.tsx`**: Calls `applyTheme(getStoredTheme())` on mount. Replaced hardcoded `bg-[#06080D]` with `style={{ backgroundColor: "var(--ax-bg)" }}`
- **`SettingsModal.tsx`**: Uses `setStoredTheme()` which applies theme instantly when changed
- **CSS Overrides** (outside `@layer` for specificity): `text-white/XX` → dark text, `bg-white/XX` → subtle light, `border-white/XX` → light border, `hover:bg-white/XX` → light hover — all scoped to `.theme-light`
- **Ambient background**: `.theme-light .ax-ambient-bg` uses softer gradients suitable for light surfaces
- All glass materials (`ax-glass`, `ax-glass--light`, `ax-glass--solid`, `ax-sidebar-glass`, `ax-input-glass`, `ax-message-capsule`, `ax-platinum-btn`, `ax-sheet-overlay`, `ax-sheet-content`) use CSS variables

---

### Fix 3: Garage Icon Duplication

**Archivo:** `components/sidebar/Sidebar.tsx`

**Problema:** Both `Header.tsx` and `Sidebar.tsx` had a Wrench icon acting as garage entry points, creating confusion.

**Solución:**
- Changed `Wrench` → `Warehouse` icon in Sidebar (both logo section and "Mi Garage" quick-access button)
- Renamed "Mi Garaje" → "Mi Garage" for consistency
- Header already cleaned of garage button in v3.2

---

### Fix 4: Sidebar Collapse Duplication

**Archivos:** `components/layout/Header.tsx`, `App.tsx`

**Problema:** Both `Header.tsx` and `Sidebar.tsx` had sidebar toggle/collapse buttons, creating redundant controls.

**Solución:**
- **Header**: Removed desktop `PanelLeftClose`/`PanelLeft` toggle (was `lg:flex hidden`). Added mobile-only `Menu` hamburger button (`lg:hidden`) to open the sheet overlay for small screens
- **Sidebar**: Retains its own collapse button (`PanelLeftClose` → `PanelLeft` when collapsed) for desktop panel width control
- **App.tsx**: Updated Header props: removed `sidebarOpen`/`onToggleSidebar`, added `onToggleMobileSidebar` connected to `toggleSidebar` (sheet state)
- Clear separation: Sidebar handles desktop collapse, Header hamburger handles mobile sheet open

---

### Fix 5: Streaming Markdown Rendering

**Archivo:** `components/chat/ChatWindow.tsx`

**Problema:** Streaming content (`streamingContent`) was rendered as plain text, losing markdown formatting (bold, lists, tables, code blocks) that users see in completed messages.

**Solución:**
- Added `ReactMarkdown` + `remarkGfm` imports
- Changed `{streamingContent}` → `<ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>`
- Added blinking cursor span (`animate-pulse`) appended after markdown output for visual streaming feedback

---

### Pruebas Ejecutadas

| Comando | Resultado |
|---------|-----------|
| `tsc --noEmit` | Sin errores |
| `vitest run` | 254/254 tests pasaron (27 archivos) |
| `vite build` | Build exitoso (62.63 kB CSS, 596 kB JS) |
| `python -m pytest` | 430 passed, 22 skipped |
| `ruff check` | Sin errores |

---

### Notas Técnicas

- **Theme system**: Pure CSS custom properties + `.theme-light` class toggle. No runtime CSS-in-JS, no theme provider component. Theme persists via localStorage (`ax-theme` key)
- **Light theme palette**: Follows user specification — bg `#F0F3F8`, secondary `#E8ECF3`, surface `rgba(255,255,255,0.62)`, border `rgba(120,140,170,0.15)`, text primary `#172033`, secondary `#4A5568`
- **Override strategy**: Theme-light overrides are placed outside `@layer` blocks to ensure they win over Tailwind's utility-generated `text-white/XX` classes without needing `!important` everywhere (only used where Tailwind specificity demands it)
- **Mobile sidebar**: The `lg:hidden` hamburger in Header only appears on mobile; desktop relies on Sidebar's always-visible panel with its own collapse toggle
