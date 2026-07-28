# Registro de Mejoras UI — AutoExpert AI

## v2.0: Obsidian Glass Redesign (Pantalla Principal)

**Fecha:** 2026-07-27
**Alcance:** Sidebar, Header, ChatWindow, MessageBubble, MessageInput, StreamingIndicator, PhysicalPanel, App layout, GarageSidebar toggle, GlassButton, globals.css, tailwind.config.ts

---

### Archivos Modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `tailwind.config.ts` | Reescritura completa de tokens de color, sombras, animaciones |
| `src/styles/globals.css` | Reescritura completa del design system, fondo ambiental, glassmorphism, markdown theme |
| `src/App.tsx` | Layout actualizado con separación visual sidebar/chat, fondo ambiental |
| `src/components/sidebar/Sidebar.tsx` | Reescritura: panel glass independiente, sección de usuario inferior, indicador wine activo |
| `src/components/layout/Header.tsx` | Reescritura: header sutil glass, sin controles sólidos |
| `src/components/chat/ChatWindow.tsx` | Reescritura: welcome state premium, sugerencias como cápsulas glass, max-width ampliado |
| `src/components/chat/MessageBubble.tsx` | Reescritura: burbujas usuario wine glass, asistente glass light, markdown con paleta azul/wine |
| `src/components/chat/MessageInput.tsx` | Reescritura: cápsula flotante, radio 20px, focus premium, botón wine saturado |
| `src/components/chat/StreamingIndicator.tsx` | Actualización de colores |
| `src/components/chat/PhysicalPanel.tsx` | Actualización de colores (gold en vez de warning) |
| `src/components/sidebar/GarageSidebar.tsx` | Actualización: toggle button gold, badges con bordes, selections gold |
| `src/components/design-system/GlassButton.tsx` | Actualización: variant primary usa wine, outline usa wine |
| `index.html` | theme-color actualizado a #06080D |

---

### Estilos Anteriores Eliminados

- Fondo negro plano `#07080a` con gradiente dorado animado `liquidShift`
- Gradiente ambiental wine centrado (`ax-ambient-bg` era solo un punto wine difuso)
- Paleta basada en gold/dorado como acento dominante (`#d4af37`, `#b8860b`)
- Neon blue (`#00f0ff`) como color accent info
- Wine anterior: `#6f2640` / `#5c1a2a` (demasiado oscuro y plano)
- `ax-glass` con `blur(16px)` y sombras más pronunciadas
- Input con `border-t` sólido y fondo `ax-glass` plano
- Welcome state con icono azul info genérico y sugerencias como `span` inline
- MessageInput con botón de envío dorado/gold
- Sidebar con items activos usando fondo `bg-ax-accent-primary/[0.08]` sin indicador lateral
- Scrollbar con opacidad fija `bg-white/10`

---

### Cambios Estructurales

1. **Fondo global:** Gradiente radial azul frío superior + halo wine tenue inferior + rejilla técnica 64px + textura de ruido SVG. Ya no es negro plano.

2. **Separación Sidebar/Chat:** El `<main>` tiene `bg-ax-bg-deep/60` semitransparente creando una capa visual diferenciada del sidebar. El sidebar usa `ax-sidebar-glass` con mayor opacidad y blur que el contenido.

3. **Sidebar:** Panel glass independiente con:
   - Sección de usuario en la zona inferior (email, avatar inicial, logout)
   - Indicador vertical wine de 3px en item activo (`ax-sidebar-active`)
   - Label "Conversaciones" como separador tipográfico
   - Botón "Nueva conversación" con estilo wine en vez del gradiente rojizo anterior
   - Colapso a 4.5rem con puntos indicadores

4. **MessageInput:** Cápsula flotante sin `border-t`:
   - Radio 20px, altura mínima 56px
   - Glass intensidad media-alta (`ax-input-glass`)
   - Separado del borde inferior por `pb-4 pt-2`
   - Botón de envío wine luminoso (mayor saturación de la pantalla)
   - Focus state con borde azul frío sutil

5. **Welcome State:** 
   - Icono con halo radial azul frío detrás (`ax-welcome-halo`)
   - Título 28px platinum tracking-tight
   - 4 sugerencias en grid 2x2 con cápsulas glass
   - Cada sugerencia tiene icono + texto + onClick funcional

6. **Mensajes:**
   - Usuario: max-w 70%, fondo wine translúcido `bg-ax-wine/[0.12]`, borde wine
   - Asistente: max-w 85%, `ax-glass--light`
   - Max-width global del chat: `max-w-[820px]`
   - Spacing vertical: `space-y-5`

7. **Markdown:**
   - Inline code: azul frío en vez de gold
   - Headers: platinum (h1), gold (h2, h3)
   - Tablas: thead azul frío, hover azul frío
   - Blockquotes: borde wine, fondo wine sutil
   - HR: gradiente azul frío

---

### Paleta Aplicada

| Token | Valor | Uso |
|-------|-------|-----|
| `ax-bg-deep` | `#06080D` | Fondo profundo |
| `ax-bg-base` | `#0A0F17` | Fondo secundario |
| `ax-wine` | `#7D2948` | Acento principal |
| `ax-wine-light` | `#A74468` | Wine luminoso |
| `ax-gold` | `#B59A62` | Gold discreto (badges, dashboard) |
| `platinum` | `#D5DBE3` | Texto principal |
| `ax-text-secondary` | `#8E99A8` | Texto secundario |
| `ax-accent-info` | `#4F7FA8` | Azul frío (links, código, tablas) |
| `glass-border` | `rgba(255,255,255,0.10)` | Bordes glass |

---

### Librerías Utilizadas

Ninguna nueva. Se utilizó únicamente:
- Tailwind CSS 3.4 (existente)
- CSS puro para glassmorphism, gradientes, texturas
- SVG inline para iconografía ( existente )

No se instalaron: Three.js, partículas, GSAP, MUI, Motion, Radix, Lucide.

---

### Pruebas Ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run typecheck` | ✅ Sin errores |
| `npm run test` | ✅ 254/254 tests pasaron (27 archivos) |
| `npm run build` | ✅ Build exitoso (49.78 kB CSS, 455.41 kB JS) |

---

### Verificación Visual (Antes vs Después)

**Antes:**
- Fondo negro plano `#07080a` con tenues gradientes dorados
- Sidebar y chat se percibían como una sola superficie negra
- MessageInput con `border-t` sólido pegado al borde
- Welcome state genérico con icono azul y sugerencias inline
- Botón de envío dorado/gold
- Items de sidebar activos con fondo transparente
- Usuario en el header, no en sidebar

**Después:**
- Fondo con iluminación ambiental: radial azul frío superior + halo wine inferior + rejilla técnica + textura ruido
- Sidebar y chat percibidos como capas separadas (diferentes niveles de opacidad y blur)
- MessageInput como cápsula flotante, separada del borde, con glass intensidad media-alta
- Welcome state premium: halo azul detrás del icono, grid 2x2 de sugerencias con cápsula glass
- Botón de envío wine luminoso (mayor saturación de la pantalla)
- Item activo de sidebar identificable por cápsula translúcida + indicador vertical wine 3px
- Sección de usuario en la zona inferior del sidebar (avatar, email, logout)
- Sidebar colapsa a iconos con puntos indicadores

---

### Criterios Visuales Cumplidos

1. ✅ Sidebar y Chat se perciben como capas separadas
2. ✅ El fondo tiene iluminación ambiental visible pero discreta
3. ✅ El MessageInput parece flotar
4. ✅ El item activo de Sidebar es claramente identificable
5. ✅ No existe púrpura dominante
6. ✅ El Chat usa mejor el ancho (820px max)
7. ✅ La jerarquía tipográfica es evidente (28px titulo, 14px mensajes, 10px labels)
8. ✅ Los paneles tienen bordes glass de 1px
9. ✅ El botón de envío es el control con mayor saturación (wine luminoso)
10. ✅ La pantalla se ve claramente distinta a la versión anterior
