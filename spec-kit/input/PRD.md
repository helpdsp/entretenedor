# PRD — Local Project

## Product PRD (input)

# FastTrack AI — Product Requirements Document
## Versión Funcional v4.3
**Fecha:** 2026-04-06  
**Tipo:** Requerimientos funcionales — con épicos y fases de entrega (Fase 1 / Fase 2 dentro del MVP)

---

## Tabla de Contenidos

1. [Visión del Producto](#1-visión-del-producto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Entidades del Dominio](#3-entidades-del-dominio)
4. [Roles y Capacidades](#4-roles-y-capacidades)
5. [Requerimientos Funcionales](#5-requerimientos-funcionales)
   - [5.0 Épicos y fases de entrega](#50-épicos-y-fases-de-entrega)
6. [Requerimientos de UI / UX](#6-requerimientos-de-ui--ux)
7. [Requerimientos de Base de Datos](#7-requerimientos-de-base-de-datos)
8. [Requerimientos de Infraestructura y API](#8-requerimientos-de-infraestructura-y-api)
9. [Requerimientos de Calidad](#9-requerimientos-de-calidad)
10. [Requerimientos de Despliegue](#10-requerimientos-de-despliegue)
11. [Reglas de Negocio](#11-reglas-de-negocio)
12. [Alcance del Producto](#12-alcance-del-producto)

---

## 1. Visión del Producto

FastTrack AI es un **Sistema de Gestión del Aprendizaje Atómico**. El conocimiento se entrega en unidades mínimas reutilizables llamadas **Átomos**, agrupadas en **Células**; cada **Track** (camino de aprendizaje) contiene un conjunto ordenado de células. El diferenciador central es el **Reconocimiento de Progreso Cross-Track**: el progreso se rastrea a nivel de Átomo, no de curso.

### Promesa por Rol

| Rol | Promesa |
|-----|---------|
| **Creador** | Documento fuente → curso publicado en menos de 60 minutos |
| **Aprendiz** | Nunca repetir contenido ya dominado — el progreso es por Átomo, no por Track |
| **Org Admin** | Gestión completa del aprendizaje del equipo con dashboards y leaderboards |

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript (strict mode) |
| Estilos | Tailwind CSS v4 + Shadcn/ui (Radix UI) |
| Router | React Router v6 |
| Data fetching | TanStack React Query v5 |
| Animaciones | Framer Motion |
| Grafo del track (Node Graph) | React Flow (@xyflow/react) |
| Gráficos analíticos | Recharts |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Sanitización HTML | DOMPurify |
| Formularios | react-hook-form + zod |
| i18n | react-i18next + i18next |
| Iconos | lucide-react |
| Drag & drop | @dnd-kit/core |
| Base de datos | PostgreSQL 15+ via Supabase |
| Auth | Supabase GoTrue |
| Storage | Supabase Storage |
| Edge Functions | Deno (Supabase Functions) |
| AI | OpenRouter → DeepSeek V3 (`deepseek/deepseek-chat`) |
| MCP Server | @modelcontextprotocol/sdk (entrega **Fase 2** — ver §5.0 y RF-22) |
| Testing | Vitest + React Testing Library |

**Principio irrevocable:** Supabase es la única fuente de verdad. No se introducen otras bases de datos.

---

## 3. Entidades del Dominio

### Átomo
Unidad mínima e indivisible de conocimiento. Cada átomo tiene exactamente un tipo:

| Tipo | Condición de completado |
|------|------------------------|
| `video` | El usuario reproduce ≥ 80% del video |
| `playbook` | El usuario hace scroll hasta el final del contenido |
| `quiz` | El usuario responde correctamente (score ≥ `passing_score`) |
| `flashcard` | El usuario pasa por todas las tarjetas al menos una vez |
| `task` | El usuario marca el checkbox de confirmación |

Un átomo completado por un usuario **es completado para siempre**, sin importar en cuántas células o tracks aparezca.

Un átomo puede estar en tres estados: `active`, `breaking_change`, `deprecated`.

### Célula
Grupo ordenado de Átomos. Sirve para segmentar el contenido (p. ej. módulos, temas o fases). Las células son **entidades reutilizables** al igual que los átomos:
- Una **misma instancia** de célula (misma fila en `cells`) puede incluirse en **varios tracks** mediante la tabla de unión `track_cells` (`track_id`, `cell_id`, `position`). No es una copia por track: al editar título o metadata de presentación de la célula, el cambio se refleja en **todos** los tracks que la referencian.
- Un átomo puede pertenecer a **múltiples células** (y por tanto a múltiples tracks) simultáneamente.
- El orden de consumo en el grafo respeta: orden entre células **en ese track** y orden de átomos dentro de cada célula (detalle de visualización en RF-08).
- Una célula puede tener título opcional y metadata de presentación para el acordeón o agrupación en el Node Graph.

### Track
Camino de aprendizaje: colección ordenada de **referencias** a células existentes (`track_cells`), cada célula con su propia secuencia de átomos (`cell_atoms`).
- El progreso en un Track = átomos requeridos completados / total átomos requeridos **en todo el track** (suma de las células).
- Un Track tiene un tiempo estimado calculado como suma de `estimated_minutes` de sus átomos (en todas las células).
- Visibilidad: `public`, `org_private`, `invite_only`.

### Organización
Grupo de usuarios con un dominio corporativo común.
- Soporta domain matching automático al registrarse.
- Contiene Teams (subgrupos de usuarios) y Assignments (tracks asignados a equipos o individuos).

### Creador
Usuario con rol `creator` habilitado por Platform Admin tras aprobar una aplicación formal. Puede publicar Tracks y gestionar Átomos y **Células** propias.

---

## 4. Roles y Capacidades

| Capacidad | Learner | Creator | Org Admin | Platform Admin |
|-----------|:-------:|:-------:|:---------:|:--------------:|
| Ver catálogo público | ✅ | ✅ | ✅ | ✅ |
| Completar átomos | ✅ | ✅ | ✅ | — |
| Obtener certificados | ✅ | ✅ | ✅ | — |
| Thumbs down en átomo | ✅ | ✅ | ✅ | ✅ |
| Switch modo Aprendiz/Creador | ✅ | ✅ | ✅ | ✅ |
| Crear átomos, células y tracks | ❌ | ✅ | ✅ (solo org) | ✅ |
| Usar Content Factory (Wizard) | ❌ | ✅ | ✅ | ✅ |
| Deprecar átomo propio | ❌ | ✅ propios | ✅ de org | ✅ todos |
| Publicar breaking change | ❌ | ✅ propios | ✅ de org | ✅ todos |
| Gestionar miembros y equipos de org | ❌ | ❌ | ✅ | ✅ |
| Asignar tracks a equipos | ❌ | ❌ | ✅ | ✅ |
| Ver métricas de org | ❌ | ❌ | ✅ | ✅ |
| Exportar CSV de org | ❌ | ❌ | ✅ | ✅ |
| Aprobar aplicaciones de creador | ❌ | ❌ | ❌ | ✅ |
| Editar o eliminar cualquier átomo | ❌ | ❌ | ❌ | ✅ |
| Acceder al Admin Panel | ❌ | ❌ | ❌ | ✅ |

---

## 5. Requerimientos Funcionales

### 5.0 Épicos y fases de entrega

Los requisitos funcionales (RF-XX) se agrupan en **épicas** para planificación. La **Fase 1** (primeras iteraciones) reduce el alcance en **leaderboard** y aplaza **MCP**; el resto del MVP sigue disponible según priorización de equipo.

| Epic | Nombre | RF principales | Fase mínima |
|------|--------|----------------|-------------|
| **E-01** | Onboarding y superficie pública | RF-01, RF-02, RF-03 | Fase 1 |
| **E-02** | Learner: consumo de contenido | RF-04, RF-08, RF-09, RF-10 | Fase 1 |
| **E-03** | Dashboard y progreso personal | RF-05 (mini-leaderboard por fases), RF-06 | Fase 1 |
| **E-04** | Catálogo y descubrimiento | RF-07 | Fase 1 |
| **E-05** | Competición y ranking | RF-11 (pestañas por fases; ver RF-11) | Fase 1 + Fase 2 |
| **E-06** | Organizaciones (Org Admin) | RF-12 | Fase 1 |
| **E-07** | Content Factory y gestión creator | RF-13, RF-14 | Fase 1 |
| **E-08** | Aplicación creador y admin plataforma | RF-15, RF-16 | Fase 1 |
| **E-09** | Notificaciones y certificados | RF-17, RF-18 | Fase 1 |
| **E-10** | Tema, i18n, switch y perfil | RF-19, RF-20, RF-21, RF-23 | Fase 1 |
| **E-11** | Integración MCP (agentes externos) | RF-22 | **Solo Fase 2** |

**Reglas de despliegue por fase (dentro del MVP):**

- **Fase 1 — primeras iteraciones:** en **RF-05** (MiniLeaderboard) y **RF-11** (Leaderboard página) solo está disponible el ámbito **My Groups** (tab **Groups**). Las pestañas **Global** y **My Org** no se implementan hasta **Fase 2**. El backend puede seguir modelando `leaderboard_snapshots` por scope; la UI limita tabs en Fase 1.
- **Fase 2 — cierre de MVP:** se habilitan pestañas **Global** y **My Org** en dashboard y leaderboard, y se entrega **RF-22 (MCP Server)**.

---

### RF-01 — Registro Invite-Only y Waitlist

- El registro de nuevos usuarios requiere un código de invitación válido.
- Si el usuario no tiene código, puede registrarse en la lista de espera (waitlist) con nombre y email.
- Platform Admin puede convertir un usuario de waitlist a `invited`, generando un token de acceso.
- Al completar el registro, el sistema verifica el dominio del email:
  - Si existe una org con ese dominio y `domain_matching_enabled = true`, el usuario es auto-añadido como miembro de esa org.
- Tras el registro exitoso, el usuario ve una pantalla de bienvenida.

### RF-02 — Autenticación

- Login con email + contraseña.
- Recuperación de contraseña por email.
- Sesión persistente con refresh token.
- Logout desde cualquier vista.
- Toda URL protegida redirige al login si no hay sesión activa.
- Acceso condicionado por rol mediante `RoleGuard`.

### RF-03 — Landing Pública

- La URL `/` (landing) es pública y no requiere autenticación.
- Presenta la narrativa del modelo disruptivo de aprendizaje atómico.
- Muestra beneficios diferenciados por rol (Learner, Creator, Org).
- Contiene CTAs diferenciados: Login (usuarios existentes) y Get Early Access (waitlist).
- Incluye formulario de waitlist con nombre + email y confirmación de registro.
- El ThemeSwitcher y el LanguageSwitcher están disponibles en esta vista.

### RF-04 — Completar un Átomo

- El learner abre un Track y selecciona un átomo en el Node Graph.
- El AtomDrawer se abre mostrando el player correspondiente al tipo del átomo.
- Al cumplir la condición de completado del tipo, se ejecuta `markAtomComplete`:
  1. Upsert en `user_progress` (user_id, atom_id) con status `completed`.
  2. Se actualiza la racha diaria del usuario.
  3. Si todos los átomos requeridos del track están completos → se genera un certificado y se muestra el TrackCompletionModal.
- El Cross-Track Recognition se aplica automáticamente: si ese átomo existe en otros tracks del usuario, aparece como completado en todos.

### RF-05 — Dashboard Personal

El dashboard personal muestra, en tiempo real con datos reales:

- **Saludo contextual** según franja horaria (mañana / tarde / noche).
- **StreakCounter**: racha actual con animación de llama. Subtext con la racha máxima histórica.
- **WeeklyHeatmap**: 7 cuadrados (Lun–Dom) con intensidad de color según átomos completados ese día.
- **StatCards** (4 tarjetas):
  - Átomos completados (total + delta esta semana)
  - Tracks en progreso (count + último track)
  - Certificados (total, clickable → /certificates)
  - Racha actual (días + máxima histórica)
- **ContinueLearningSection**: últimos 3 tracks en progreso del usuario.
- **MiniLeaderboard**: posición del usuario en el ranking, con 2 filas arriba y 2 abajo. Tabs: Global | Org | Groups.
  - **Fase 1 (primeras iteraciones):** solo el tab **Groups** está visible y operativo; **Global** y **Org** se ocultan o deshabilitan hasta **Fase 2** (ver §5.0).
  - **Fase 2:** tabs **Global**, **Org** y **Groups** completos.
- **Switch Aprendiz/Creador**: visible solo si el usuario tiene rol `creator`. Al activar el modo Creador se muestra el CreatorDashboard.

### RF-06 — CreatorDashboard

Visible cuando el usuario activa el modo Creador:

- Listado de tracks publicados propios con métricas (completions, rating de thumbs down).
- Listado de borradores del wizard pendientes de publicar.
- Acceso rápido a "Create New Track" y a "Manage Atoms".

### RF-07 — Catálogo

- Búsqueda full-text con debounce de 300ms y atajo ⌘K.
- Filtros: Idioma (All | EN | ES), Tipo (All | Video | Quiz | Task | Flashcard), Orden (Newest | Popular | Shortest).
- Tabs de contexto org: "Assigned to Me" | "All Org" | "Public".
- Grid responsivo: 3 cols desktop / 2 tablet / 1 mobile.
- Cada TrackCard muestra: thumbnail, título, descripción, creator, tiempo estimado, idioma, atom count, barra de progreso (si en progreso), badge de completado.
- Estado vacío con EmptyState y CTA al explorar.

### RF-08 — Track Detail y Node Graph

- Vista superior con título, descripción colapsable, creator, stats (N átomos, tiempo estimado, completions).
- CTA contextual: "Start Track" / "Continue (N%)" / "✓ Completed".
- **Node Graph** (React Flow):
  - Cada átomo es un nodo visual con su tipo, título y estado de progreso (opcionalmente agrupados visualmente por célula).
  - Los bordes representan el orden de consumo dentro del track (respetando el orden de células y de átomos en cada célula).
  - Los nodos tienen estados visuales: `not_started` / `in_progress` / `completed` / `breaking_change`.
  - Click en un nodo abre el AtomDrawer.
  - Controles: ZoomIn, ZoomOut, FitView.

### RF-09 — AtomDrawer y Players

El AtomDrawer es un panel lateral (desktop: 420px; mobile: bottom sheet) que contiene el player del átomo seleccionado.

**Quiz Player:**
- Barra de progreso de preguntas ("Q N de M").
- 4 opciones de respuesta. Submit deshabilitado hasta seleccionar.
- Feedback inmediato: correcto (verde) / incorrecto (rojo + respuesta correcta + hint).
- Pantalla de resultados: círculo animado con score, confetti si pasa, botón "Try Again" si falla.

**Flashcard Deck:**
- Flip 3D de cada tarjeta al hacer click (frente = término, reverso = definición).
- Navegación prev/next + shuffle.
- Mark Complete disponible tras ver todas las tarjetas.

**Playbook Reader:**
- Renderizado de markdown con tabla de contenidos auto-generada.
- **PlaybookChecklist**: checkboxes por cada sección H2/H3 con contador "N/M secciones leídas".
- Barra de progreso de lectura en la parte superior.
- Mark Complete al llegar al final.

**Video Player:**
- Embed de URL de video.
- Auto-pausa al cerrar el drawer.
- Mark Complete tras reproducir ≥ 80%.

**Task Atom:**
- HTML renderizado con DOMPurify.
- Image lightbox al hacer click en imágenes.
- Checkbox de confirmación requerido para Mark Complete.

**Footer del drawer:**
- Navegación prev/next entre átomos.
- Indicador de posición (N/M).
- Botón ThumbsDown (con confirmación antes de enviar).

### RF-10 — TrackCompletionModal

Aparece al completar todos los átomos requeridos de un track:
- Confetti desde ambos lados.
- Preview de la tarjeta del certificado generado.
- Botones: "Share Certificate" (copia URL al clipboard + toast), "View Certificate", "Continue Learning".

### RF-11 — Leaderboard

- Tabs: Global | My Org | My Groups.
  - **Fase 1 (primeras iteraciones):** solo el tab **My Groups** se implementa en UI; **Global** y **My Org** se entregan en **Fase 2** (ver §5.0). Los datos por scope pueden prepararse en backend sin exponer aún las pestañas.
  - **Fase 2:** los tres tabs activos con conmutación y datos según `leaderboard_snapshots`.
- PeriodSelector: Weekly | Monthly | All Time.
- **PodiumDisplay**: top 3 con entrada secuencial animada (oro, plata, bronce).
- **LeaderboardTable**: rank, avatar, nombre, org badge, átomos, racha, indicador de cambio (↑N verde / ↓N rojo / — gris).
- Fila del usuario actual con fondo destacado.
- Sticky footer con el rank del usuario cuando está fuera del viewport.
- **My Groups**:
  - Lista de GroupCards del usuario (nombre, miembros, tu rank, atom count).
  - "Create Group" → CreateGroupModal (nombre + invite por email).

### RF-12 — Organizaciones — Org Admin

**OrgDashboard** (`/org/:orgId/dashboard`):
- Tabs de período: This Week | This Month | All Time.
- Botón "Export CSV" para descargar todos los datos del dashboard.
- 4 StatCards: Total Members, Active Learners, Atoms Completed (org), Avg Quiz Score.
- **Team Progress Table**: Avatar + Nombre | Rol | Atoms Done | Last Active | Quiz Avg | Status badge (Active / At Risk / Inactive). Columnas ordenables. Click en fila → MemberDetailPanel.
- **Track Assignment Table**: Track | Assigned To | Progress Bar | Avg Score | Actions.
- **OrgLeaderboardWidget**: top 10 de la org.
- **TeamDonutChart**: Recharts PieChart con átomos por equipo.
- **RecentActivityFeed**: eventos recientes ("N completó X") con polling cada 30 segundos.

**MemberDetailPanel** (Sheet 420px):
- Avatar, nombre, email, role badge.
- Fecha de ingreso, última actividad, racha.
- Tracks asignados con barras de progreso.
- Últimas 5 completions.
- "Remove from Organization" con confirm dialog.

**OrgMembersPage** (`/org/:orgId/members`):
- Tabla sortable de miembros.
- InviteMemberModal (email + selector de rol).
- Acciones en bulk (cambiar rol, remover).

**OrgTeamsPage** (`/org/:orgId/teams`):
- Lista de TeamCards (nombre + member count + avatar stack ≤ 5).
- CreateTeamModal (nombre + multi-select de miembros).
- Añadir/remover miembros de un equipo.

**OrgAssignmentsPage** (`/org/:orgId/assignments`):
- Tabla de tracks asignados.
- AssignTrackModal (búsqueda de track + target: Org | Team | Individual + deadline opcional).

**OrgSettingsPage** (`/org/:orgId/settings`):
- Editar nombre, logo, slug.
- Toggle de domain matching (email domain → auto-join).

**CreateOrgPage** (`/org/new`): formulario de creación de org.
**JoinOrgPage** (`/org/join`): unirse por código o token.

### RF-13 — Content Factory — Track Wizard

Wizard de 7 pasos en overlay full-screen con indicador de progreso sticky:

**Paso 1 — File Upload:**
- Zona de drag & drop. Acepta `.pdf` y `.docx`. Rechaza otros formatos.
- Lista de archivos con nombre, tamaño, progreso individual, botón de remove.

**Paso 2 — AI Fragmentation:**
- Skeleton con mensajes rotativos mientras la IA procesa.
- Resultado: acordeón de **células** (secciones) con átomos reordenables (dnd-kit). Cada fila: handle de drag, ícono de tipo, título, type badge, botón remove. Las secciones del JSON de IA se mapean a filas en `cells` y el publicado crea `track_cells` para el track en curso; el creator puede **reutilizar células existentes** en pasos posteriores (misma instancia).

**Paso 3 — Track Configuration:**
- Campo de título (requerido, autofocused).
- Textarea de descripción.
- Toggle de idioma: EN | ES.
- RadioGroup de visibilidad: Public | Org Only.
- Upload opcional de thumbnail.

**Paso 4 — Reutilization Check:**
- La IA busca átomos existentes similares (pg_trgm similarity).
- Por cada match: ícono, título, creator, badge de % de similaridad, botón "Use Existing" o "Generate New".
- Si no hay matches: info card "No matches — generating fresh."

**Paso 5 — Batch Generation:**
- Por cada átomo: ícono, título, estado (Pending | Generating | Done✓ | Failed✗), botón Retry si falló.
- Progress bar global "Generated N of M atoms".

**Paso 6 — Copilot Editing:**
- Split pane: lista de átomos (izquierda) + preview + chat (derecha).
- Lista izquierda: badge "Edited" en átomos modificados, clic para seleccionar.
- Panel derecho: preview read-only del átomo + botón "Refine with AI".
- Panel de chat (slide-up): burbujas de conversación, chips de sugerencias ("Make shorter", "Add examples", "Translate to Spanish", "Add 2 quiz questions"), diff con colores (verde = añadido, rojo = eliminado), botones "Accept ✓" y "Revert ↺".

**Paso 7 — Publish:**
- Preview de la TrackCard como aparecerá en el catálogo.
- Resumen de tipos de átomos generados.
- Checklist: átomos generados ✓, título definido ✓, átomos sin revisar ⚠ (no bloquea).
- Botón "Publish Track". En éxito: confetti + "Published! 🎉" + link "View Track".

**Wizard Draft Persistence:**
- El estado del wizard se guarda en localStorage en cada cambio de paso.
- Al volver a `/create`, si existe borrador: dialog "Continue draft?" con opción de descartarlo.
- El borrador también se persiste en la tabla `track_drafts` de la DB.

### RF-14 — Gestión de Átomos (Creator)

**AtomManagementPage** (`/creator/atoms`):
- Listado de todos los átomos propios con acciones.
- **Deprecar átomo**: DeprecateAtomModal muestra cuántos tracks se ven afectados. Confirmar → `atoms.status = 'deprecated'`, notificación a owners de tracks afectados.
- **Breaking change**: BreakingChangeModal requiere descripción del cambio + checkbox "Notify affected learners". Confirmar → `atoms.status = 'breaking_change'`, notificación a todos los learners que completaron ese átomo. Los nodos de ese átomo en el Node Graph muestran un ring ámbar pulsante.

**CreatorTracksPage** (`/creator/tracks`):
- Lista de tracks publicados y borradores del wizard.

### RF-15 — Creator Application

**ApplyPage** (`/apply`) — formulario de 3 pasos:
1. Display name (pre-llenado) + teléfono (opcional).
2. "Why create content?" (textarea, mínimo 100 caracteres con contador) + "Topics" (tag input).
3. Revisión + Submit.
- Post-submit: confirmación con nota "48-hour review".

**ApplyStatusPage** (`/apply/status`):
- Timeline del estado de la aplicación con timestamps.
- Si rechazada: muestra feedback del admin + botón "Reapply".

### RF-16 — Admin Panel

**AdminPanel** (`/admin` — Platform Admin only):
- Cola de aplicaciones de creador: Nombre | Email | Motivación | Fecha | Status.
- Botón "Approve": actualiza `profiles.role = 'creator'` + envía notificación.
- Botón "Reject": abre RejectApplicationModal (textarea de feedback requerido) + envía notificación.

### RF-17 — Notificaciones

**Eventos que generan notificación:**

| Evento | Tipo | Destinatario |
|--------|------|-------------|
| Invitación a org | `invite` | Usuario invitado |
| Track asignado por org admin | `track_assigned` | Miembro |
| Átomo con breaking change en track activo | `breaking_change` | Learners que completaron ese átomo |
| Aplicación de creator aprobada | `creator_approved` | Solicitante |
| Aplicación de creator rechazada | `creator_rejected` | Solicitante |
| Track completado | `track_completion` | El propio usuario |
| Certificado outdated | `cert_outdated` | Poseedor del certificado |

**NotificationBell** (en AppShell):
- Ícono `<Bell/>` sin no leídas / `<BellRing/>` con no leídas + punto rojo pulsante.
- Badge count hasta "99+".
- Click abre Popover (desktop, 380px) o Sheet bottom (mobile).
- Realtime: Supabase Realtime subscription → badge y lista se actualizan en tiempo real al recibir una notificación nueva.

**NotificationPanel**:
- Header: "Notifications" + botón "Mark all read".
- Lista scrollable de NotificationItems.
- Empty state: "You're all caught up!"
- Footer: "View all" → `/notifications`.
- Invites muestran botones inline Accept / Decline.
- Mobile: swipe izquierdo en un item → "Mark read" | "Delete".
- Click en item: marca como leído + navega a `action_url`.

**NotificationsPage** (`/notifications`): historial completo paginado.

**PendingInvitesBanner**: banner que aparece en el primer login si el usuario tiene invitaciones org pendientes.

### RF-18 — Certificados

- Al completar un track, se genera automáticamente un certificado con `verification_code` único.
- Un usuario tiene máximo un certificado por track.
- Un certificado puede marcarse como `is_outdated = true` si más del 30% de los átomos requeridos del track tienen `status = 'breaking_change'` después de la fecha de emisión.

**CertificatePage** (`/certificates/:certId` — pública, sin auth):
- No requiere login. Accesible por URL directa.
- Muestra: nombre del learner, título del track, creator, fecha de emisión, atom count.
- Si `is_outdated`: banner ámbar "⚠ Content updated since issuance."
- QR code (80px) + URL de verificación.
- Acciones: "Copy Link" (clipboard + toast), "Share on LinkedIn", "Share on X".

**CertificatesListPage** (`/certificates` — autenticado):
- Grid de todos los certificados del usuario.

### RF-19 — Skins y ThemeSwitcher

- El sistema soporta al menos 3 skins de tema seleccionables.
- El ThemeSwitcher está disponible en: landing, login y dashboard.
- La selección se persiste en localStorage y en `profiles.skin_preference`.
- Los temas se aplican mediante CSS custom properties en `<html>`.

### RF-20 — Switch Aprendiz / Creador

- El toggle es visible en el dashboard solo para usuarios con `profiles.role = 'creator'`.
- Al activar "modo Creador" se muestra el CreatorDashboard en lugar del Personal Dashboard.
- El modo seleccionado persiste en localStorage y en `profiles.active_mode`.
- El switch es instantáneo, sin recarga de página.

### RF-21 — i18n Bilingüe (EN / ES)

- Toda la interfaz está disponible en inglés y español desde el primer día.
- El usuario puede cambiar el idioma mediante el LanguageSwitcher en cualquier vista.
- La preferencia se persiste en localStorage y en `profiles.language_preference`.
- No debe quedar ningún string hardcodeado en el código fuente.

### RF-22 — MCP Server

**Fase de entrega:** **Fase 2** (no forma parte de las primeras iteraciones; ver §5.0). Hasta entonces el stack puede listar la dependencia, pero el servidor MCP y las herramientas no son obligatorias para entregables de Fase 1.

El sistema expone un servidor MCP (Model Context Protocol) que permite a clientes de IA externos (Claude, Cursor, etc.) interactuar con FastTrack:

| Tool MCP | Descripción |
|----------|-------------|
| `create_atom` | Crea un átomo individual con su contenido |
| `create_track` | Crea un track vacío |
| `add_atom_to_cell` | Añade un átomo existente a una célula |
| `add_cell_to_track` | Enlaza una célula existente a un track (posición en `track_cells`) |
| `create_track_with_cells_and_atoms` | Crea track, referencias `track_cells`, células y átomos en una sola llamada |
| `get_learner_progress` | Consulta el progreso de un learner |
| `complete_atom` | Marca un átomo como completado |
| `get_leaderboard` | Consulta el leaderboard por scope y período |

### RF-23 — Profile Settings

- Edición de display name.
- Upload de avatar (Supabase Storage bucket `avatars`, URL pública).
- Cambio de preferencia de idioma.
- Cambio de skin/tema.

---

## 6. Requerimientos de UI / UX

### 6.1 Design System

**Tema base:** dark. CSS custom properties sobre Shadcn/ui.

```css
:root {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --card: 0 0% 7%;
  --primary: 262 83% 68%;        /* electric violet */
  --secondary: 199 89% 48%;      /* electric cyan */
  --accent: 330 81% 60%;         /* hot pink */
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 60%;
  --border: 0 0% 14.9%;
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --destructive: 0 72% 51%;
  --radius: 0.75rem;
}
```

**Tipografía:** Inter (todos los pesos) + JetBrains Mono (bloques de código).

**Motion:** Framer Motion en todas las animaciones. Transiciones de página: 150ms ease-out.

**Cards:** hover con `translateY(-2px)` + aumento de shadow en 200ms.

**Skeletons:** shimmer animado en cada componente que carga datos async.

**Confetti:** `canvas-confetti` en: quiz pass, track completion, publicación exitosa.

**Skins:** al menos 3 temas seleccionables implementados en `src/lib/theme/skin.ts`.

### 6.2 Layout Principal

```
AppShell
├── Sidebar (desktop ≥ 1024px)
│   ├── Logo
│   ├── ContextSwitcher
│   ├── Nav items (condicionales por rol)
│   └── Footer: UserMenu + NotificationBell + LanguageSwitcher + ThemeSwitcher
├── TopBar (mobile < 1024px): Logo + NotificationBell + StreakBadge
├── BottomNav (mobile): Home | Catalog | Leaderboard | Profile
└── MainContent (React Router outlet)
```

### 6.3 ContextSwitcher

- Radix Popover en la parte superior de la sidebar.
- Muestra: "Personal Space" + lista de orgs del usuario con logo, nombre y count de miembros.
- Al seleccionar: actualiza `profiles.active_context_org_id`, invalida queries, navega a `/`.
- Footer: "Join an Organization".

### 6.4 Navegación — URLs de la Aplicación

**Públicas (sin auth):**
- `/` — LandingPage
- `/auth/login` — LoginPage
- `/auth/signup` — SignupPage
- `/auth/forgot-password` — ForgotPasswordPage
- `/invite/accept/:token` — OrgInviteAcceptPage
- `/certificates/:certId` — CertificatePage

**Protegidas (autenticado):**
- `/dashboard` — PersonalDashboard / CreatorDashboard (switch)
- `/catalog` — CatalogPage
- `/tracks/:trackId` — TrackDetailPage
- `/leaderboard` — LeaderboardPage
- `/settings/profile` — ProfileSettingsPage
- `/notifications` — NotificationsPage
- `/certificates` — CertificatesListPage

**Org Admin (role-gated):**
- `/org/new` — CreateOrgPage
- `/org/join` — JoinOrgPage
- `/org/:orgId/dashboard` — OrgDashboard
- `/org/:orgId/members` — OrgMembersPage
- `/org/:orgId/teams` — OrgTeamsPage
- `/org/:orgId/assignments` — OrgAssignmentsPage
- `/org/:orgId/settings` — OrgSettingsPage

**Creator (role-gated):**
- `/create` — CreatePage + TrackWizard
- `/creator/tracks` — CreatorTracksPage
- `/creator/atoms` — AtomManagementPage
- `/apply` — ApplyPage
- `/apply/status` — ApplyStatusPage

**Platform Admin (role-gated):**
- `/admin` — AdminPanel

**Fallback:**
- `/404` — NotFoundPage
- `/error` — ErrorPage

### 6.5 Componentes Requeridos

**Layout:**  
`AppShell`, `Sidebar`, `TopBar`, `BottomNav`, `ContextSwitcher`, `UserMenuDropdown`, `LanguageSwitcher`, `ThemeSwitcher`

**Auth:**  
`AuthProvider`, `ProtectedRoute`, `RoleGuard`, `PendingInvitesBanner`, `LearnerCreatorRoleToggle`

**Common:**  
`EmptyState`, `LoadingSpinner`, `SkeletonCard`, `ErrorBoundary`, `PageHeader`

**Notifications:**  
`NotificationBell`, `NotificationItem`, `NotificationPanel`

**Atoms / Players:**  
`AtomDrawer`, `VideoPlayer`, `PlaybookReader`, `PlaybookChecklist`, `QuizPlayer`, `FlashcardDeck`, `TaskAtom`, `AtomTypeBadge`, `ThumbsDownButton`, `ReviewHintPanel`

**Tracks:**  
`TrackCard`, `NodeGraphCanvas`, `AtomNode`, `TrackCompletionModal`, `ContinueLearningCTA`

**Dashboard:**  
`GreetingHero`, `StreakCounter`, `WeeklyHeatmap`, `StatCard`, `MiniLeaderboard`, `ContinueLearningSection`, `LearnerCreatorSwitch`, `StreakLostBanner`

**Leaderboard:**  
`PodiumDisplay`, `LeaderboardTable`, `PeriodSelector`, `ChangeIndicator`, `GroupCard`, `CreateGroupModal`

**Org:**  
`OrgSubNav`, `OrgLeaderboardWidget`, `RecentActivityFeed`, `TeamCard`, `TeamDonutChart`, `InviteMemberModal`, `CreateTeamModal`, `AssignTrackModal`, `MemberDetailPanel`

**Creator / Breaking Changes:**  
`BreakingChangeBadge`, `BreakingChangeModal`, `DeprecateAtomModal`, `RejectApplicationModal`

**Wizard:**  
`TrackWizard`, `WizardStepIndicator`, `FileUploadZone`, `AIFragmentationView`, `TrackConfigForm`, `ReutilizationCheckView`, `BatchGenerationView`, `CopilotEditingView`, `CopilotChat`, `PublishingView`

**Certificates:**  
`QRCodeDisplay`

### 6.6 Responsividad

- Toda la aplicación debe funcionar correctamente en: 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (wide desktop).
- En mobile, la sidebar es reemplazada por TopBar + BottomNav.
- El AtomDrawer es un bottom sheet en mobile.
- El NotificationPanel es un Sheet bottom en mobile.

### 6.7 Accesibilidad

- Todos los elementos interactivos deben ser navegables por teclado.
- Todos los elementos interactivos deben tener `aria-label` o `aria-labelledby`.
- Focus rings visibles (`focus-visible`) en todos los interactivos.
- Contraste de colores conforme a WCAG AA mínimo.

---

## 7. Requerimientos de Base de Datos

### 7.1 Tablas Requeridas

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Extensión de `auth.users` — roles, preferencias, contexto activo |
| `atoms` | Unidades de conocimiento con contenido JSONB por tipo |
| `atom_thumbs_down` | Votos negativos por usuario/átomo (deduplicados) |
| `tracks` | Tracks de aprendizaje con full-text search vector |
| `cells` | Células reutilizables: `creator_id`, título, metadata de presentación (JSONB opcional); **sin** `track_id` (no pertenecen a un solo track) |
| `track_cells` | Relación ordenada track↔célula (`track_id`, `cell_id`, `position`) — habilita la misma célula en varios tracks |
| `cell_atoms` | Relación ordenada célula↔átomo con flag `is_required` |
| `track_drafts` | Estado del wizard persistido por creator |
| `user_progress` | Progreso por usuario+átomo (UNIQUE = cross-track recognition) |
| `atom_cross_credits` | Registro de créditos cross-track otorgados |
| `organizations` | Orgs con slug único y domain matching |
| `org_members` | Miembros de org con rol (owner/admin/member) |
| `org_teams` | Subgrupos dentro de una org |
| `org_team_members` | Relación equipo↔usuario |
| `org_track_assignments` | Asignaciones de tracks a org/team/individual con deadline |
| `org_invitations` | Tokens de invitación a org (expiración 7 días) |
| `user_streaks` | Racha actual, máxima y fecha de última actividad |
| `leaderboard_snapshots` | Rankings precalculados por período y scope |
| `friend_groups` | Grupos de amigos para leaderboard de grupos |
| `friend_group_members` | Relación grupo↔usuario |
| `certificates` | Certificados emitidos con verification_code único |
| `creator_applications` | Solicitudes de rol creator con estado y feedback |
| `notifications` | Notificaciones in-app por usuario |
| `ai_jobs` | Jobs de generación de contenido por IA |
| `ai_rate_limits` | Rate limiting de llamadas a IA (10/hora/usuario) |
| `waitlist` | Lista de espera invite-only con tokens |

### 7.2 Constraints Críticos

- `user_progress`: UNIQUE en `(user_id, atom_id)` — este constraint ES el mecanismo de Cross-Track Recognition.
- `certificates`: UNIQUE en `(user_id, track_id)` — un solo certificado por track por usuario.
- `atom_thumbs_down`: PRIMARY KEY en `(user_id, atom_id)` — voto deduplicado.
- `org_members`: UNIQUE en `(org_id, user_id)`.
- `track_cells`: UNIQUE en `(track_id, position)` y UNIQUE en `(track_id, cell_id)` — una misma célula no se inserta dos veces en el mismo track.
- `cell_atoms`: UNIQUE en `(cell_id, atom_id)` y `(cell_id, position)`.

### 7.3 Contenido JSONB por Tipo de Átomo

```
video:     { "url": string, "duration_seconds": number, "thumbnail_url": string }
playbook:  { "markdown": string, "estimated_read_minutes": number }
quiz:      { "passing_score": number, "questions": [{ "id": string, "text": string, "options": string[4], "correct_index": number, "review_hint": string }] }
flashcard: { "cards": [{ "front": string, "back": string }] }
task:      { "instructions_html": string, "reference_image_url": string | null }
```

### 7.4 Row Level Security

RLS habilitado en **todas** las tablas. Política deny-by-default.

| Tabla | Anon | Learner | Creator | Org Admin | Platform Admin |
|-------|:----:|:-------:|:-------:|:---------:|:--------------:|
| atoms | active=read | active=read | own=full | org=read | all=full |
| tracks | public=read | public=read | own=full | org=full | all=full |
| cells | public=read | public=read | own=full | org=full | all=full |
| track_cells | public=read | public=read | own=full | org=full | all=full |
| cell_atoms | public=read | public=read | own=full | org=full | all=full |
| user_progress | — | own=full | own+creator_view | — | all=full |
| organizations | — | member=read | member=read | admin=write | all=full |
| org_members | — | own_org=read | own_org=read | admin=full | all=full |
| notifications | — | own=full | own=full | own=full | all=full |
| certificates | public=read | own=read | own=read | — | all=full |
| leaderboard_snapshots | read | read | read | read | full |
| waitlist | — | — | — | — | full |
| creator_applications | — | own=read | own=full | — | all=full |

### 7.5 Trigger Crítico: handle_new_user

Al crear un nuevo usuario en `auth.users`:
1. Se inserta un perfil en `profiles` con `display_name` del metadata.
2. Si existe una org con `domain_matching_enabled = true` cuyo `domain` coincide con el dominio del email → se inserta en `org_members` con rol `member`.

### 7.6 Estándar de Seed (GoTrue)

Todo seed de usuarios debe incluir `auth.identities` y usar strings vacíos (nunca `NULL`) para los campos de token:

```sql
-- Tokens: strings vacíos NUNCA NULL
-- auth.identities: inserción obligatoria junto a auth.users
```

### 7.7 Índices de Performance Requeridos

- `atoms(creator_id)`
- `atoms(status, language)`
- `tracks(status, visibility)`
- `tracks(search_vector)` — GIN index para full-text search
- `cells(creator_id)`
- `track_cells(track_id)` / `track_cells(cell_id)`
- `atoms(title)` — GIN con `gin_trgm_ops` para similarity search (pg_trgm)
- `user_progress(user_id)`
- `user_progress(track_id)` — opcional para analytics; progreso lógico sigue siendo por `atom_id`
- `notifications(user_id, read)` — filtrado parcial WHERE NOT read
- `org_members(user_id)`
- `leaderboard_snapshots(period, period_key, atoms_completed DESC)`

---

## 8. Requerimientos de Infraestructura y API

### 8.1 Edge Functions Requeridas

| Función | Descripción |
|---------|-------------|
| `upload-document` | Recibe documento multipart → guarda en Storage bucket `documents` |
| `fragment-document` | Lee documento de Storage → llama a IA → devuelve estructura JSON de átomos |
| `check-reutilization` | Busca átomos similares con pg_trgm similarity |
| `generate-atoms` | Por átomo propuesto → genera content JSONB via IA |
| `copilot-edit` | Recibe átomo + mensaje del usuario → devuelve content actualizado |
| `update-streak` | Aplica lógica de racha (hoy/ayer/reset). Llamada por `mark_atom_complete` |
| `update-leaderboard` | Recalcula todos los `leaderboard_snapshots`. Cron cada 60 minutos |
| `check-cert-outdated` | Si >30% de átomos requeridos breaking → `is_outdated = true` |
| `issue-certificate` | Genera certificado con `verification_code` único al completar track |
| `create-org-invite` | Genera token de invitación → inserta en `org_invitations` |
| `accept-org-invite` | Valida token → inserta en `org_members` → envía notificación |
| `waitlist-invite` | Convierte usuario de waitlist a `invited` con token |

### 8.2 RPCs Requeridas (PostgreSQL Functions)

**Auth / Perfil:**
- `get_user_orgs()` — orgs del usuario actual con roles
- `update_profile(display_name, language_preference, active_context_org_id, skin_preference, active_mode)`

**Catálogo / Tracks:**
- `get_tracks(language?, search?, page?, org_context?)` — paginado, full-text
- `get_track_detail(track_id)` — track + células + átomos + progreso del usuario en cada átomo
- `get_assigned_tracks(org_id)` — tracks asignados via `org_track_assignments`
- `mark_atom_complete(atom_id, track_id)` — upsert progress + streak + cross-credits + trigger certificate

**Dashboard:**
- `get_dashboard_stats()` — átomos total+semana, tracks en progreso, certs, streak
- `get_weekly_activity()` — 7 filas: `{date, atoms_completed}`
- `get_in_progress_tracks()` — tracks parciales del usuario, ordenados por última actividad

**Leaderboard:**
- `get_leaderboard(scope, period, org_id?, group_id?)` — ranked + cambio vs período anterior
- `get_user_leaderboard_position(scope, period)` — rank + 2 arriba + 2 abajo
- `create_friend_group(name)` + `invite_to_group(group_id, email)`
- `get_my_groups()` — grupos del usuario con su rank en cada uno

**Atoms / Quiz:**
- `submit_quiz_attempt(atom_id, answers[])` — valida, puntúa, completa si pasa, retorna `{score, passed, correct_indices, hints}`
- `submit_thumbs_down(atom_id)` — insert deduplicado + incrementa contador

**Organizaciones:**
- `create_organization(name, slug, domain?, domain_matching_enabled)`
- `get_org_members(org_id)` — perfiles + rol + átomos semana + última actividad
- `update_member_role(org_id, user_id, new_role)`
- `remove_org_member(org_id, user_id)`
- `create_team / add_team_member / remove_team_member`
- `assign_track(org_id, track_id, assigned_to, assigned_to_id?, deadline_at?)`
- `get_org_dashboard_stats(org_id, period)` — 4 valores de statcards
- `get_member_progress_details(org_id, user_id)` — para MemberDetailPanel
- `get_recent_org_activity(org_id, limit)` — últimos N eventos

**Creator:**
- `submit_creator_application(motivation_text, topics_tags[])`
- `review_creator_application(id, status, feedback?)` — admin only; approve → profiles.role='creator'
- `deprecate_atom(atom_id)` — status=deprecated + notificación
- `publish_breaking_change(atom_id, description)` — status=breaking_change + notificación
- `get_affected_tracks_count(atom_id)` — para modales de confirmación
- `publish_track(wizard_state_json)` — transacción: track + `track_cells` + cells (nuevas o existentes) + atoms + `cell_atoms`
- `get_tracks_referencing_cell(cell_id)` — cuántos tracks referencian una célula (modales al editar título/metadata compartida)
- `save_draft(wizard_state_json)` — upsert track_drafts
- `get_creator_tracks()` — tracks publicados + borradores

**Notificaciones:**
- `get_notifications(limit, offset)` — DESC por created_at
- `mark_notification_read(id)` / `mark_all_notifications_read()`

**Certificados:**
- `get_certificate(cert_id)` — pública, sin auth requerida
- `issue_certificate(track_id)` — llamada en track completion

### 8.3 Realtime

- Supabase Realtime habilitado en tabla `notifications` filtrado por `user_id = current`.
- Al recibir un INSERT: el badge de NotificationBell se actualiza y el item se prepende en la lista.

### 8.4 Rate Limiting de IA

- Máximo 10 llamadas a Edge Functions de IA por usuario por hora.
- Verificado via tabla `ai_rate_limits` antes de cada llamada.

### 8.5 AI — Prompts Canónicos (inmutables)

**Fragmentación:**
```
You are an expert instructional designer. Analyze the document and structure it
into atomic learning units. Rules:
1. Each atom = ONE concept (max 3-min video equivalent)
2. Group atoms into logical sections (each section maps to a **célula** in the track)
3. Atom types: playbook=theory, quiz=assessment, task=practice, flashcard=terms
Return ONLY valid JSON: { "sections": [{ "title": "", "atoms": [{ "title": "", "type": "", "summary": "" }] }] }
```

**Generación por tipo:**
```
Generate content for a {type} atom titled: "{title}"
Source: {excerpt}
Return ONLY JSON matching the {type} schema.
```

**Copilot:**
```
You are an AI copilot for a course creator.
Current atom JSON: {current_content}
Creator request: {message}
Return ONLY the updated JSON in the exact same schema.
```

### 8.6 Storage Buckets

| Bucket | Contenido | Acceso |
|--------|-----------|--------|
| `avatars` | Fotos de perfil | Público (URL directa) |
| `documents` | PDFs y DOCXs subidos por creators | Privado (via service role en Edge Function) |
| `thumbnails` | Thumbnails de tracks | Público |

---

## 9. Requerimientos de Calidad

### 9.1 Cobertura de Tests

| Métrica | Threshold |
|---------|-----------|
| Lines | ≥ 78% |
| Functions | ≥ 78% |
| Branches | ≥ 70% |
| Statements | ≥ 78% |

El gate de cobertura es **bloqueante**: ningún merge sin cobertura verificada.

### 9.2 Hooks con cobertura obligatoria ≥ 90%

- `useAtomProgress` — completar átomo + cross-credits
- `useDailyStreak` — cálculo de racha (hoy/ayer/reset)
- `useLeaderboard` — ranking + actualización
- `useTrackProgress` — progreso total de track
- `useAuth` — login, logout, roles
- `useOrgMembers` — gestión de organización

### 9.3 Estrategia por Capa

- **Hooks:** tests unitarios completos. Son la lógica de negocio crítica.
- **Componentes:** tests de comportamiento (qué hace), no de implementación (cómo lo hace). Patrón AAA (Arrange-Act-Assert).
- **Páginas:** tests de flujo completo con proveedores mock.
- **Utilidades:** tests unitarios sin mocks.
- **Edge Functions:** tests de integración contra Supabase local.

### 9.4 Gate de Calidad

```bash
npm run gate   # = npm run coverage && npm run build && npm run lint
```

Todos deben pasar para considerar el trabajo listo.

### 9.5 Métricas de Performance

| Métrica | Target |
|---------|--------|
| Catalog page load (LCP) | < 2 segundos |
| Node graph render | < 1 segundo |
| Edge function p95 latency | < 500ms |
| Build time | < 3 minutos |
| Lighthouse score desktop | ≥ 85 |

---

## 10. Requerimientos de Despliegue

### 10.1 Entorno Local

- `supabase start` levanta el stack local (PostgreSQL + GoTrue + PostgREST + Storage).
- `npm run dev` levanta el frontend (puerto 5173 o 8000 en Docker).
- `npm run env:sync` verifica que `.env.local` esté sincronizado con el estado local de Supabase.
- Docker disponible como opción alternativa de entorno (`npm run docker:up`).

### 10.2 Producción — Vercel + Supabase Cloud

- Deploy automático en cada push a `main`.
- SPA rewrite: toda URL de la app → `index.html`.
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Edge Functions: `OPENROUTER_API_KEY`, `RESEND_API_KEY`.
- MCP Server (si se despliega): `SUPABASE_SERVICE_ROLE_KEY`.

### 10.3 Entornos

| Entorno | Branch | Supabase |
|---------|--------|----------|
| Local | cualquier | CLI local |
| Preview | `feature/*` | Cloud (branch preview) |
| Staging | `develop` | Cloud (staging project) |
| Production | `main` | Cloud (prod project) |

### 10.4 Checklist de Producción

```
[ ] Variables de entorno configuradas en plataforma target
[ ] Migraciones aplicadas al proyecto de producción
[ ] Edge Functions desplegadas
[ ] npm run gate pasa sin errores
[ ] DNS y SSL activos
[ ] Smoke test: login + completar átomo + ver dashboard + certificado
[ ] Monitoreo configurado
```

---

## 11. Reglas de Negocio

| # | Regla |
|---|-------|
| RN-01 | **Progreso irrevocable.** Un átomo completado nunca puede "descompletarse" desde la UI. `user_progress` es UPSERT, nunca DELETE. |
| RN-02 | **Racha diaria.** Se incrementa si el usuario completa al menos 1 átomo en el día. Se pierde si la brecha entre la última acti

...(truncated — see full product PRD in refdocs or pass a larger file)...


## Executive brief

# Brief — FastTrack AI

## Executive Summary

FastTrack AI es un **Sistema de Gestión del Aprendizaje Atómico** (Atomic LMS) diseñado para descomponer el conocimiento en unidades mínimas e indivisibles —denominadas **Átomos**— que se agrupan en **Células** y conforman **Tracks** (rutas de aprendizaje). La propuesta de valor central es el **Reconocimiento de Progreso Cross-Track**: el progreso se rastrea a nivel de Átomo —no de curso—, de modo que un learner nunca repite contenido ya dominado, sin importar en cuántos tracks aparezca ese átomo.

La plataforma sirve tres roles clave con promesas diferenciadas: el **Creador** puede transformar un documento fuente en un curso publicado en menos de 60 minutos gracias al Content Factory Wizard de 7 pasos asistido por IA. El **Aprendiz** experimenta una ruta personalizada sin repetición de lo ya aprendido, con gamificación (streaks, leaderboards, certificados). El **Org Admin** gestiona el aprendizaje de su equipo —asignando tracks, gestionando equipos y visualizando métricas— con un modelo de **pago por asiento por track**: la organización paga por cada asignación de un track a un miembro, lo que convierte cada ruta en un producto factorable.

El proyecto parte de un estado inicial de **reverse engineering**: existe un `App.tsx` esqueleto sin implementación funcional todavía. El código fuente real debe construirse a partir del PRD funcional v4.3 y los mockups visuales disponibles en `refdocs/mockups`.

---

## Context

El mercado de e-learning corporativo sufre de dos patologías crónicas: (1) duplicación del esfuerzo —los aprendices consumen el mismo contenido varias veces en distintos cursos—, y (2) granularidad excesiva de los cursos —nadie aprovecha el progreso de un módulo en otro curso—. FastTrack resuelve ambos con el mecanismo de Cross-Track Recognition a nivel de Átomo.

Adicionalmente, el costo de crear contenido de calidad es alto. El Content Factory Wizard democratiza la producción: un creador sube un PDF o DOCX y la IA lo fragmenta en átomos estructurados, detecta reutilización de contenido existente y genera el contenido de cada átomo tipo por tipo (quiz, flashcard, playbook, video, task). El creador solo edita y publica.

El sistema es invite-only en su primera fase: los nuevos usuarios requieren un token de invitación o permanecen en waitlist hasta ser habilitados por el Platform Admin.

---

## Goals

- **G-01:** Entregar el MVP completo (Fase 1) que permita a un creador producir y publicar un track de aprendizaje en ≤ 60 minutos desde un documento fuente.
- **G-02:** Implementar el mecanismo de Cross-Track Recognition que elimina la repetición de contenido ya completado a nivel de átomo.
- **G-03:** Habilitar la gestión completa de organizaciones (teams, assignments, miembros, métricas) con modelo de facturación pay-per-seat-per-track mediante Stripe.
- **G-04:** Proveer una experiencia de aprendizaje mobile-first con gamificación (streaks, leaderboards de grupo, certificados) que incremente la retención y el engagement.
- **G-05:** Lanzar con ≥ 3 skins de tema (Dark Vibrant, Light Mode, Gamified Cyberpunk) seleccionables por el usuario.
- **G-06:** Alcanzar cobertura de tests ≥ 78% en líneas/funciones/statements y ≥ 70% en branches como gate de calidad bloqueante.
- **G-07:** Mantener métricas de performance: LCP catálogo < 2s, Node Graph render < 1s, Edge Functions p95 < 500ms.

---

## Target Users / Roles

| Rol | Necesidades principales |
|-----|------------------------|
| **Learner** | Consumir átomos en cualquier pantalla (mobile-first), no repetir contenido ya dominado, ver su progreso y racha, obtener certificados compartibles. |
| **Creator** | Generar un track completo desde un documento con asistencia de IA en minutos; editar átomos individualmente con un Copilot de IA; deprecar o publicar breaking changes. |
| **Org Admin** | Gestionar miembros y equipos de una organización; asignar tracks a individuos o grupos; ver dashboards de progreso y métricas; pagar por las asignaciones de tracks. |
| **Platform Admin** | Aprobar o rechazar aplicaciones de creador; convertir usuarios de waitlist en invitados; acceso total al sistema. |

---

## Scope — In

### Autenticación y Onboarding (E-01)
- Registro invite-only con token + lista de espera (waitlist).
- Login email/password, recuperación de contraseña, refresh token.
- Domain matching automático al registrarse (org auto-join).
- Landing pública (`/`) con narrativa, beneficios por rol y formulario waitlist.
- CTAs: Login y Get Early Access.

### Consumo de Contenido del Learner (E-02)
- 5 tipos de Átomo con players completos:
  - **Video**: reproducción con mark complete al 80%.
  - **Playbook**: markdown con PlaybookChecklist (H2/H3) y barra de lectura.
  - **Quiz**: 4 opciones, feedback inmediato, confetti en aprobación.
  - **Flashcard**: flip 3D, shuffle, navigación prev/next.
  - **Task**: HTML sanitizado, image lightbox, checkbox de confirmación.
- AtomDrawer (panel lateral desktop 420px / bottom sheet mobile).
- ThumbsDown por átomo con confirmación.
- TrackCompletionModal con confetti y preview de certificado.
- Cross-Track Recognition automático (UNIQUE constraint en `user_progress.user_id, atom_id`).

### Dashboard y Progreso Personal (E-03)
- Saludo contextual (mañana/tarde/noche).
- StreakCounter con animación de llama + máximo histórico.
- WeeklyHeatmap (7 días, color según intensidad).
- 4 StatCards: Átomos, Tracks en progreso, Certificados, Racha.
- ContinueLearningSection (últimos 3 tracks en progreso).
- MiniLeaderboard: Fase 1 solo tab **Groups**; Fase 2 añade Global y Org.
- Switch Aprendiz/Creador (visible solo para role=creator).

### Catálogo y Descubrimiento (E-04)
- Búsqueda full-text con debounce 300ms y atajo ⌘K.
- Filtros: Idioma, Tipo de átomo, Orden (Newest/Popular/Shortest).
- Tabs: Assigned to Me | All Org | Public.
- Grid responsivo: 3 cols desktop / 2 tablet / 1 mobile.
- TrackCard: thumbnail, título, descripción, creator, tiempo estimado, progreso, badge completed.

### Track Detail y Node Graph (E-02 + E-04)
- Título, descripción colapsable, stats.
- CTA contextual: Start / Continue (N%) / Completed.
- Node Graph con React Flow: nodos por átomo con estado visual, edges ordenadas, ZoomIn/Out/FitView.
- Nodos agrupados visualmente por célula.
- Estados: `not_started` / `in_progress` / `completed` / `breaking_change` (ring ámbar pulsante).

### Gamificación y Competición (E-05)
- **Leaderboard page** (`/leaderboard`): Fase 1 solo My Groups. Fase 2: Global, My Org, Groups.
- PeriodSelector: Weekly | Monthly | All Time.
- PodiumDisplay top 3 con animación de entrada.
- LeaderboardTable con indicador de cambio (↑/↓/—).
- Sticky footer con posición del usuario.
- My Groups: lista de GroupCards, CreateGroupModal.

### Organizaciones — Org Admin (E-06)
- OrgDashboard: StatCards, Team Progress Table, Track Assignment Table, OrgLeaderboardWidget, TeamDonutChart, RecentActivityFeed (polling 30s).
- MemberDetailPanel (Sheet 420px) con progreso individual y "Remove from Organization".
- OrgMembersPage: tabla sortable, InviteMemberModal, acciones bulk.
- OrgTeamsPage: CreateTeamModal, add/remove miembros.
- OrgAssignmentsPage: AssignTrackModal (org/team/individual), tabla de asignaciones.
- OrgSettingsPage: nombre, logo, slug, domain matching toggle.
- Modelo de facturación: **pay-per-seat-per-track** via Stripe. La org paga por cada asignación de track a un miembro. Checkout de Stripe al asignar un track con facturación por miembro.
- Export CSV desde OrgDashboard.

### Content Factory — Track Wizard (E-07)
- Wizard 7 pasos full-screen con progress indicator sticky:
  1. File Upload (drag & drop, .pdf/.docx).
  2. AI Fragmentation: célula→átomo con dnd-kit, reordenamiento libre.
  3. Track Configuration: título, descripción, idioma, visibilidad, thumbnail.
  4. Reutilization Check: pg_trgm similarity, "Use Existing" vs "Generate New".
  5. Batch Generation: estado por átomo (Pending/Generating/Done/Failed), retry.
  6. Copilot Editing: split pane lista+preview+chat, chips de sugerencias, diff coloreado, Accept/Revert. **Modo Híbrido**: la IA extrae estructura del documento fielmente; el Copilot puede ampliar, acortar, traducir, añadir preguntas o ejemplos creativamente.
  7. Publish: preview TrackCard, checklist, confetti en éxito.
- Wizard Draft Persistence: localStorage + tabla `track_drafts`. Dialog "Continue draft?" al volver.

### Gestión Creator (E-07)
- AtomManagementPage: DeprecateAtomModal, BreakingChangeModal (con notify checkbox).
- CreatorTracksPage: publicados + borradores.
- Breaking change: ring ámbar en nodos, notificación a learners.

### Creator Application y Admin Panel (E-08)
- ApplyPage 3 pasos: display name/phone → motivation (≥100 chars) + topics → review/submit.
- ApplyStatusPage: timeline con timestamps; si rechazada → feedback + Reapply.
- AdminPanel (`/admin`): cola de aplicaciones, Approve (role=creator + notif) / Reject (feedback requerido).

### Notificaciones (E-09)
- 7 tipos de eventos: invite, track_assigned, breaking_change, creator_approved, creator_rejected, track_completion, cert_outdated.
- NotificationBell: Bell/BellRing + badge "99+", Popover desktop / Sheet mobile.
- Realtime via Supabase Realtime en tabla `notifications`.
- PendingInvitesBanner en primer login.
- NotificationsPage: historial paginado.
- Mobile: swipe para mark read / delete.

### Tema, i18n, Switch y Perfil (E-10)
- **3 Skins seleccionables**:
  1. **Dark Vibrant** (base): electric violet primary #7C3AED, electric cyan #0EA5E9, hot pink accent, fondo ~#0A0A0A.
  2. **Light Mode**: fondo blanco/gris muy claro, paleta corporativa neutra y limpia.
  3. **Gamified Cyberpunk**: neones cian intenso (#00F5FF), magenta (#FF00FF), amarillo eléctrico (#FFE600) sobre fondo negro ultra-profundo (#030303). Tipografía JetBrains Mono complementando Inter. Motion más intenso (glow effects, holographic gradients). Feel de consola Star Trek / interfaz holocubierta del futuro.
- ThemeSwitcher + LanguageSwitcher en landing, login y dashboard.
- Persistencia en localStorage y en `profiles.skin_preference` / `profiles.language_preference`.
- i18n EN/ES completo (react-i18next). Sin strings hardcodeados.
- Switch Aprendiz/Creador instantáneo, sin recarga.
- ProfileSettingsPage: display name, avatar upload, idioma, skin.

### Certificados (E-09)
- Auto-generación al completar todos los átomos requeridos de un track.
- CertificatePage pública (`/certificates/:certId`): QR + URL de verificación, share LinkedIn/X.
- `is_outdated` si >30% de átomos requeridos en `breaking_change` tras emisión.
- CertificatesListPage grid.

### MCP Server (E-11 — Fase 2 únicamente)
- Tools: `create_atom`, `create_track`, `add_atom_to_cell`, `add_cell_to_track`, `create_track_with_cells_and_atoms`, `get_learner_progress`, `complete_atom`, `get_leaderboard`.
- **No se implementa en Fase 1**.

---

## Scope — Out / Non-goals

- Leaderboard tabs Global y My Org → **Fase 2**.
- MCP Server → **Fase 2**.
- Pagos o créditos de tipo diferente a pay-per-seat-per-track (no marketplace, no freemium en v1).
- URL scraping de plataformas externas (Udemy, etc.).
- Bot Tutor / IA conversacional de roleplay.
- Feed estilo TikTok.
- Revenue Share Creator/Platform.
- Motor de traducción automático EN↔ES.
- Búsqueda semántica con pgvector.
- SSO (SAML/OIDC).
- Multi-org / jerarquías de organizaciones.
- White-label skin configurable por Org Admin (se consideraría en Fase 2+).

---

## Functional Requirements Summary

Los 23 RF del PRD se agrupan en 11 épicas:

| Épica | RF principales | Fase |
|-------|----------------|------|
| E-01: Onboarding y superficie pública | RF-01 (invite-only + waitlist), RF-02 (auth), RF-03 (landing) | Fase 1 |
| E-02: Consumo de contenido | RF-04 (completar átomo + cross-track), RF-08 (Track Detail + Node Graph), RF-09 (AtomDrawer + 5 players) | Fase 1 |
| E-03: Dashboard personal | RF-05 (stats, streak, heatmap, mini-leaderboard groups), RF-06 (CreatorDashboard) | Fase 1 |
| E-04: Catálogo | RF-07 (búsqueda + filtros + TrackCards) | Fase 1 |
| E-05: Gamificación/Ranking | RF-10 (TrackCompletionModal), RF-11 (Leaderboard — Groups en F1, completo en F2) | F1+F2 |
| E-06: Organizaciones | RF-12 (OrgDashboard, Members, Teams, Assignments, Settings + billing Stripe) | Fase 1 |
| E-07: Content Factory | RF-13 (Wizard 7 pasos), RF-14 (AtomManagement) | Fase 1 |
| E-08: Aplicación creator / Admin | RF-15 (ApplyPage), RF-16 (AdminPanel) | Fase 1 |
| E-09: Notificaciones y certificados | RF-17 (notifs + realtime), RF-18 (certificados) | Fase 1 |
| E-10: Tema, i18n, switch, perfil | RF-19 (skins), RF-20 (switch rol), RF-21 (i18n), RF-23 (profile) | Fase 1 |
| E-11: MCP Server | RF-22 | **Solo Fase 2** |

**Reglas de negocio clave:**
- **RN-01**: Progreso irrevocable (UPSERT never DELETE en `user_progress`).
- **RN-05**: Cross-Track Recognition = UNIQUE constraint `(user_id, atom_id)`.
- **RN-07**: Certificado outdated si >30% átomos requeridos en breaking_change (estrictamente mayor).
- **RN-08**: Rate limit IA: 10 llamadas/usuario/hora.
- **RN-10**: Wizard draft dual: localStorage + `track_drafts` DB.
- **RN-11**: Leaderboard precalculado cada 60 min (cron), no en tiempo real.
- **RN-14**: Células son instancias únicas reutilizables; cambios en título/metadata afectan a todos los tracks que las referencian.

---

## Technical Stack & Constraints

### Frontend
| Capa | Tecnología |
|------|-----------|
| Core | React 18 + Vite + TypeScript (strict mode) |
| Estilos | Tailwind CSS v4 + Shadcn/ui (Radix UI) |
| Router | React Router v6 |
| Data fetching | TanStack React Query v5 |
| Animaciones | Framer Motion |
| Node Graph | React Flow (@xyflow/react) |
| Gráficos | Recharts |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Sanitización | DOMPurify |
| Formularios | react-hook-form + zod |
| i18n | react-i18next + i18next |
| Iconos | lucide-react |
| Drag & drop | @dnd-kit/core |
| Testing | Vitest + React Testing Library |

### Backend
| Capa | Tecnología |
|------|-----------|
| Base de datos | PostgreSQL 15+ via Supabase (fuente única de verdad) |
| Auth | Supabase GoTrue |
| Storage | Supabase Storage (buckets: avatars, documents, thumbnails) |
| Edge Functions | Deno (Supabase Functions) |
| AI | OpenRouter → DeepSeek V3 (`deepseek/deepseek-chat`) |
| Pagos | Stripe (pay-per-seat-per-track para organizaciones) |
| Email | Resend |
| Realtime | Supabase Realtime (tabla notifications) |
| MCP (Fase 2) | @modelcontextprotocol/sdk |

### UX/Design Constraints
- **Mobile-first**: el diseño se concibe desde 375px; desktop es extensión funcional secundaria.
- **Estilo**: Sleek/Modern — glassmorphism suave, gradientes vibrantes, estética SaaS premium.
- **Densidad**: UI espaciosa, pocas opciones por pantalla, jerarquía visual clara, whitespace generoso.
- **Motion**: Framer Motion en todas las animaciones. Transiciones de página 150ms ease-out. Skins con diferentes intensidades de motion (Cyberpunk más intenso, Light más sutil).
- **Responsividad**: 375px / 768px / 1280px / 1920px. AppShell con Sidebar (≥1024px) → TopBar + BottomNav (<1024px).
- **Accesibilidad**: WCAG 2.1 AA (teclado, focus rings, aria-labels, contraste). AtomDrawer = bottom sheet en mobile.

### Constraints de Infraestructura
- Despliegue: Vercel (frontend) + Supabase Cloud (backend).
- Deploy automático en push a `main`.
- Entorno local: `supabase start` + `npm run dev`.
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend); `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` (Edge Functions).
- RLS habilitado en todas las tablas. Política deny-by-default.
- Gate de calidad bloqueante: `npm run gate` = coverage + build + lint.

### Edge Functions requeridas (13)
`upload-document`, `fragment-document`, `check-reutilization`, `generate-atoms`, `copilot-edit`, `update-streak`, `update-leaderboard` (cron 60min), `check-cert-outdated`, `issue-certificate`, `create-org-invite`, `accept-org-invite`, `waitlist-invite`, **`stripe-checkout`** (nueva: pago por asignación de track), **`stripe-webhook`** (nueva: confirmar pago y activar asignación).

### RPCs PostgreSQL (≥20)
`get_user_orgs`, `update_profile`, `get_tracks`, `get_track_detail`, `get_assigned_tracks`, `mark_atom_complete`, `get_dashboard_stats`, `get_weekly_activity`, `get_in_progress_tracks`, `get_leaderboard`, `get_user_leaderboard_position`, `create_friend_group`, `invite_to_group`, `get_my_groups`, `submit_quiz_attempt`, `submit_thumbs_down`, `assign_track`, `get_org_dashboard_stats`, `submit_creator_application`, `review_creator_application`, `publish_track`, `save_draft`, y otras.

---

## Success Criteria

| Criterio | Medición |
|----------|---------|
| Creator puede publicar un track desde PDF en ≤ 60 min | QA manual del wizard end-to-end |
| Cross-Track Recognition funciona correctamente | Test unitario en `useAtomProgress` + test de integración DB |
| Org Admin puede asignar un track y pagar via Stripe | Smoke test en staging: assign → checkout → confirmation |
| Learner puede completar un átomo en mobile (375px) | Test exploratorio en dispositivo real o emulado |
| 3 skins operativos y persistidos | Test E2E de cambio de tema |
| Coverage gate ≥ 78% líneas/funciones | `npm run gate` pasa sin errores |
| LCP catálogo < 2s | Lighthouse en staging |
| Node Graph render < 1s | Medición de Performance en React DevTools |
| i18n: 0 strings hardcodeados | Lint rule o revisión manual pre-merge |
| Leaderboard Groups operativo (Fase 1) | Test de integración con datos de seed |

---

## Open Questions / Risks

| # | Pregunta / Riesgo | Impacto | Estado |
|---|-------------------|---------|--------|
| OQ-01 | **Stripe checkout**: ¿el pago es por asignación individual (por miembro) o se factura en batch al final del mes? La lógica de billing afecta el flujo de AssignTrackModal. | Alto — afecta UX del Org Admin y flujo de Stripe | **Pendiente** → se definirá en `generate_spec_kit` |
| OQ-02 | **Gamified Cyberpunk skin**: ¿los efectos de glow y animaciones holográficas se pueden desactivar en dispositivos con `prefers-reduced-motion`? Necesario para WCAG. | Medio — afecta accesibilidad del skin | Recomendación: sí, respetar `prefers-reduced-motion` siempre |
| OQ-03 | **Wizard reutilización**: cuando el creator elige "Use Existing" en el paso 4, ¿la célula existente se reutiliza directamente vía `track_cells` o se crea una copia? | Alto — afecta integridad de datos y RN-14 | Decisión: reutilizar instancia (no copiar), conforme a RN-14 |
| OQ-04 | **Rate limit IA en Wizard**: el batch generation de un track grande puede superar las 10 llamadas/hora/usuario. ¿Hay una excepción para el wizard o se usa service role? | Alto — puede bloquear el wizard si el track tiene >10 átomos | **Pendiente** → definir en technical-spec |
| OQ-05 | **Stripe en Fase 1 vs 2**: el PRD v4.3 lista "Créditos, pagos o suscripciones" como excluidos del scope. Las clarificaciones del usuario definen un modelo de pago explícito. Se debe confirmar que el billing se incluye en Fase 1 y actualizar el PRD si corresponde. | Alto — posible contradicción de scope | **Pendiente** → prioridad alta para siguiente sesión |

---

## Input Sources
- **refdocs**: `PRD-FastTrack.md` (v4.3, 1054 líneas — documento principal de requisitos funcionales)
- **refdocs**: `README.md` (notas de mockups)
- **refdocs/mockups**: carpeta de mockups visuales (referenciada; no leídos individualmente)
- **source-code**: `App.tsx` (placeholder React, sin implementación funcional — estado inicial del reverse engineering)
- **clarificaciones**: `planning/clarifications/brief.json` — respuestas del Product Owner sobre monetización, skins, AI scope, responsive strategy, visual style y densidad de UI

## Goals

- Ship software that satisfies the product PRD above.
- Refine this engineering PRD after structured generation when LOCAL_IDE_AI_COMMAND is available.
