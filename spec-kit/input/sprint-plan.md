# Sprint Plan — FastTrack AI

> Plan de 8 sprints para Fase 1 (MVP). RF-22 (MCP) queda en Fase 2.
> Duración sugerida por sprint: 1–2 semanas. Ajustar con `clarify_sprints` y el equipo.

## Resumen

| Sprint | Goal | RF cubiertos | Stories | Dependencias |
|--------|------|-------------|---------|--------------|
| 1 | Fundación: DB schema + Auth + Landing | RF-01, RF-02, RF-03 | S-01, S-02, S-03 | — |
| 2 | Core learning loop: Track Detail + Atom Players | RF-04, RF-08, RF-09 | S-04, S-08, S-09 | Sprint 1 |
| 3 | Dashboard personal + Catálogo | RF-05, RF-06, RF-07 | S-05, S-06, S-07 | Sprint 2 |
| 4 | Gamificación + OrgsAdmin + Billing Stripe | RF-10, RF-11, RF-12 | S-10, S-11, S-12 | Sprint 3 |
| 5 | Content Factory Wizard (pasos 1–5) | RF-13 (parcial) | S-13a | Sprint 4 |
| 6 | Content Factory Wizard (pasos 6–7) + Creator Mgmt | RF-13 (completo), RF-14 | S-13b, S-14 | Sprint 5 |
| 7 | Creator app + Admin Panel + Notificaciones + Certs | RF-15, RF-16, RF-17, RF-18 | S-15, S-16, S-17, S-18 | Sprint 6 |
| 8 | Skins + i18n + Perfil + QA gate + Performance | RF-19, RF-20, RF-21, RF-23 | S-19, S-20, S-21, S-23 | Sprint 7 |

---

## Sprint 1 — Fundación: DB schema + Auth + Landing

| Campo | Detalle |
|-------|---------|
| **Goal** | El proyecto tiene infraestructura Supabase lista (schema, RLS, seeds), el usuario puede registrarse invite-only o unirse a la waitlist, iniciar sesión y ver la landing pública. |
| **RF cubiertos** | RF-01 (invite-only + waitlist), RF-02 (auth), RF-03 (landing pública) |
| **Stories** | S-01, S-02, S-03 |
| **Tareas clave** | Migration SQL completa (27 tablas + constraints + índices + triggers); seed de usuarios de prueba; Edge Function `waitlist-invite`; App shell: ProtectedRoute + RoleGuard; LandingPage con ThemeSwitcher + LanguageSwitcher; i18n setup base (EN/ES namespaces vacíos). |
| **Gate de calidad** | Auth flow end-to-end probado; landing carga en < 2s; schema sin errores de migración. |

---

## Sprint 2 — Core learning loop: Track Detail + Atom Players

| Campo | Detalle |
|-------|---------|
| **Goal** | Un learner puede abrir un track, ver el Node Graph, abrir un átomo en el AtomDrawer y completarlo. Cross-Track Recognition operativo. |
| **RF cubiertos** | RF-04 (mark_atom_complete + cross-track), RF-08 (Track Detail + Node Graph), RF-09 (AtomDrawer + 5 players) |
| **Stories** | S-04, S-08, S-09 |
| **Tareas clave** | RPC `mark_atom_complete` + UNIQUE constraint; Node Graph con React Flow (nodos por átomo, agrupados por célula, estados visuales, breaking_change ring ámbar); 5 players (Quiz, Flashcard flip 3D, Playbook markdown, Video embed, Task DOMPurify); AtomDrawer 420px desktop / bottom sheet mobile; update-streak Edge Function. |
| **Gate de calidad** | Node Graph render < 1s con 50 átomos; test unitario `useAtomProgress` verifica cross-track; players probados en 375px. |

---

## Sprint 3 — Dashboard personal + Catálogo

| Campo | Detalle |
|-------|---------|
| **Goal** | El learner ve su progreso consolidado en el dashboard y puede descubrir tracks en el catálogo con búsqueda y filtros. |
| **RF cubiertos** | RF-05 (dashboard: streak, heatmap, StatCards, ContinueLearning, MiniLeaderboard Groups), RF-06 (CreatorDashboard), RF-07 (catálogo) |
| **Stories** | S-05, S-06, S-07 |
| **Tareas clave** | RPCs `get_dashboard_stats`, `get_weekly_activity`, `get_in_progress_tracks`; StreakCounter con animación Framer Motion; WeeklyHeatmap; debounce 300ms búsqueda + atajo ⌘K; GIN index `search_vector` validado; TrackCard con progreso; grid responsive 3/2/1. |
| **Gate de calidad** | Dashboard carga < 1.5s; LCP catálogo < 2s; búsqueda full-text retorna resultados en < 500ms. |

---

## Sprint 4 — Gamificación + Orgs + Billing Stripe

| Campo | Detalle |
|-------|---------|
| **Goal** | El Leaderboard My Groups está operativo, el Org Admin puede gestionar miembros/equipos y asignar tracks con pago Stripe. |
| **RF cubiertos** | RF-10 (TrackCompletionModal + confetti), RF-11 (Leaderboard Fase 1: My Groups), RF-12 (OrgDashboard, Members, Teams, Assignments, Settings + Stripe billing) |
| **Stories** | S-10, S-11, S-12 |
| **Tareas clave** | TrackCompletionModal con confetti + preview certificado; leaderboard_snapshots cron (update-leaderboard cada 60min); PodiumDisplay animado; AssignTrackModal → stripe-checkout → stripe-webhook → activar asignación; OrgDashboard con Recharts PieChart + polling 30s; Export CSV; MemberDetailPanel Sheet 420px. |
| **Gate de calidad** | Stripe checkout end-to-end en staging; leaderboard My Groups con datos reales; test de integración assign_track. |

---

## Sprint 5 — Content Factory Wizard (pasos 1–5)

| Campo | Detalle |
|-------|---------|
| **Goal** | Creator puede subir un documento, obtener la fragmentación de IA, configurar el track, revisar reutilización y generar átomos en batch. El draft se persiste. |
| **RF cubiertos** | RF-13 (pasos 1–5 del Wizard) |
| **Stories** | S-13a (Wizard pasos 1–5) |
| **Tareas clave** | Edge Function `upload-document` (multipart → Storage bucket `documents`); `fragment-document` (IA → JSON de células+átomos); `check-reutilization` (pg_trgm similarity); `generate-atoms` (content JSONB por tipo vía service role); Paso 2 con dnd-kit reorder; Draft persistence localStorage + `track_drafts`; Progress bar batch generation; Retry en átomos fallidos; AI jobs tracking. |
| **Gate de calidad** | Upload funciona con PDF y DOCX; fragmentación genera JSON válido; batch generation procesa 10 átomos sin timeout; draft restaura correctamente. |

---

## Sprint 6 — Wizard (pasos 6–7) + Gestión Creator

| Campo | Detalle |
|-------|---------|
| **Goal** | Creator puede editar átomos con Copilot AI, publicar el track y gestionar átomos existentes (deprecar, breaking change). |
| **RF cubiertos** | RF-13 (pasos 6–7 del Wizard), RF-14 (AtomManagementPage, CreatorTracksPage) |
| **Stories** | S-13b (Wizard pasos 6–7), S-14 |
| **Tareas clave** | Edge Function `copilot-edit` con prompts canónicos; split pane Copilot (lista + preview + chat); diff coloreado (verde/rojo); Accept/Revert; chips de sugerencias; Paso 7 Publish con confetti; RPC `publish_track` (transacción atómica: track + track_cells + cells + atoms + cell_atoms); DeprecateAtomModal + BreakingChangeModal con `get_affected_tracks_count`; notificación a learners en breaking_change. |
| **Gate de calidad** | Publish track end-to-end en < 60 min QA manual; Copilot diff se renderiza correctamente; deprecar átomo notifica a los owners de tracks afectados. |

---

## Sprint 7 — Creator app + Admin + Notificaciones + Certificados

| Campo | Detalle |
|-------|---------|
| **Goal** | El flujo de onboarding de creators está completo (apply → review → approve/reject), las notificaciones son en tiempo real y los certificados son verificables. |
| **RF cubiertos** | RF-15 (ApplyPage + ApplyStatusPage), RF-16 (AdminPanel), RF-17 (Notificaciones Realtime), RF-18 (Certificados) |
| **Stories** | S-15, S-16, S-17, S-18 |
| **Tareas clave** | ApplyPage 3 pasos (mínimo 100 chars en motivación, tag input topics); timeline ApplyStatus; AdminPanel con cola + Approve/Reject modal; Supabase Realtime en `notifications` (Bell/BellRing, badge 99+, swipe mobile); issue-certificate Edge Function; CertificatePage pública con QR code + share LinkedIn/X; is_outdated check (> 30% breaking_change). |
| **Gate de calidad** | NotificationBell se actualiza en < 1s al recibir notificación; CertificatePage accesible sin auth; QR code válido; test de integración is_outdated threshold. |

---

## Sprint 8 — Skins + i18n + Perfil + QA Gate + Performance

| Campo | Detalle |
|-------|---------|
| **Goal** | Los 3 skins están operativos, la UI está completamente traducida EN/ES sin strings hardcodeados, perfiles configurables, y el gate de calidad (≥ 78% coverage + build + lint) pasa sin errores. |
| **RF cubiertos** | RF-19 (skins), RF-20 (switch rol), RF-21 (i18n EN/ES), RF-23 (ProfileSettingsPage) |
| **Stories** | S-19, S-20, S-21, S-23 |
| **Tareas clave** | CSS custom properties para 3 skins (`dark-vibrant`, `light`, `cyberpunk`); `prefers-reduced-motion` en Cyberpunk; LanguageSwitcher con react-i18next; todos los namespaces i18n completados EN+ES; lint rule `i18next/no-literal-string`; ProfileSettingsPage con avatar upload; `npm run gate` verde (coverage + build + lint); Lighthouse audit en staging (LCP < 2s, Node Graph < 1s). |
| **Gate de calidad** | `npm run gate` pasa 100%; 0 strings hardcodeados; 3 skins persistidos en localStorage + profiles; Lighthouse LCP catálogo < 2s. |

---

**Total RF Fase 1 en plan:** 22 (RF-01 a RF-21 + RF-23) · **Sprints:** 8  
**RF Fase 2:** RF-22 (MCP Server) — no incluido en este plan.
