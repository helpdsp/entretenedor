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
