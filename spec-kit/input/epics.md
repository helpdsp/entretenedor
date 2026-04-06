# Epics — FastTrack AI

> Generado por agente a partir del brief aprobado + PRD v4.3. 11 épicas de dominio (no lotes genéricos).

## Mapa Epic ↔ RF ↔ Fase

| Epic | Nombre | RF incluidos | Fase |
|------|--------|--------------|------|
| **E-01** | Onboarding y superficie pública | RF-01, RF-02, RF-03 | Fase 1 |
| **E-02** | Consumo de contenido (Learner) | RF-04, RF-08, RF-09, RF-10 | Fase 1 |
| **E-03** | Dashboard y progreso personal | RF-05, RF-06 | Fase 1 |
| **E-04** | Catálogo y descubrimiento | RF-07 | Fase 1 |
| **E-05** | Gamificación y ranking | RF-11 | Fase 1 (My Groups) + Fase 2 (Global, Org) |
| **E-06** | Organizaciones — Org Admin | RF-12 | Fase 1 |
| **E-07** | Content Factory — Wizard + Creator mgmt | RF-13, RF-14 | Fase 1 |
| **E-08** | Aplicación creator y Admin Panel | RF-15, RF-16 | Fase 1 |
| **E-09** | Notificaciones y certificados | RF-17, RF-18 | Fase 1 |
| **E-10** | Tema, i18n, switch y perfil | RF-19, RF-20, RF-21, RF-23 | Fase 1 |
| **E-11** | MCP Server (agentes externos) | RF-22 | **Solo Fase 2** |

---

## E-01 — Onboarding y superficie pública

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Controlar el acceso invite-only, gestionar la waitlist, habilitar autenticación segura y presentar la propuesta de valor de FastTrack AI a través de una landing pública de alto impacto. |
| **Alcance (RF)** | RF-01 (invite-only + waitlist), RF-02 (auth email/password + refresh token), RF-03 (landing pública) |
| **Stories** | S-01, S-02, S-03 |
| **Fuera de alcance** | SSO/SAML, social login, MFA. |
| **Dependencias técnicas** | Supabase GoTrue, tabla `waitlist`, tabla `profiles`, trigger `handle_new_user`, Edge Function `waitlist-invite`. |
| **Riesgos** | Domain matching automático puede crear miembros no deseados si la org no tiene `domain_matching_enabled` bien configurado. |
| **Criterio de "done"** | Un usuario no invitado puede registrarse en waitlist; un invitado puede registrarse y loguearse; la landing pública carga en < 2s con todas las secciones visibles; ThemeSwitcher y LanguageSwitcher operativos en landing. |

---

## E-02 — Consumo de contenido (Learner)

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Entregar la experiencia de aprendizaje core: el learner selecciona un átomo en el Node Graph, lo consume con el player adecuado y obtiene progreso permanente. El Cross-Track Recognition es el diferenciador central. |
| **Alcance (RF)** | RF-04 (mark_atom_complete + cross-track), RF-08 (Track Detail + Node Graph), RF-09 (AtomDrawer + 5 players), RF-10 (TrackCompletionModal + confetti + certificado) |
| **Stories** | S-04, S-08, S-09, S-10 |
| **Fuera de alcance** | Bot tutor, feed TikTok. |
| **Dependencias técnicas** | RPC `mark_atom_complete`, UNIQUE constraint `(user_id, atom_id)` en `user_progress`, React Flow (@xyflow/react), Framer Motion (flip 3D flashcard, confetti), DOMPurify (task HTML), react-markdown + remark-gfm (playbook). Edge Function `update-streak`, `issue-certificate`. |
| **Riesgos** | Node Graph render > 1s si el track tiene > 50 átomos. Mitigación: virtualización de nodos con React Flow, lazy load del drawer. |
| **Criterio de "done"** | Learner puede completar un átomo de cada tipo en mobile (375px); el progreso aparece en todos los tracks que contienen ese átomo; TrackCompletionModal se muestra con certificado al completar el track; todas las condiciones de completado por tipo probadas en test unitario. |

---

## E-03 — Dashboard y progreso personal

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Dar al learner visibilidad de su avance, motivar la continuidad con streaks/heatmap y, para creators, proveer acceso rápido al panel de creación. |
| **Alcance (RF)** | RF-05 (dashboard personal: saludo, streak, heatmap, StatCards, ContinueLearning, MiniLeaderboard Groups), RF-06 (CreatorDashboard: tracks propios + borradores + acceso rápido) |
| **Stories** | S-05, S-06 |
| **Fuera de alcance** | Tabs Global y Org en MiniLeaderboard (Fase 2). |
| **Dependencias técnicas** | RPCs `get_dashboard_stats`, `get_weekly_activity`, `get_in_progress_tracks`, `get_leaderboard` (scope=groups Fase 1). Supabase Realtime no requerido aquí; TanStack Query con `refetchInterval` para polling ligero. |
| **Riesgos** | `get_dashboard_stats` puede ser lento si no está indexado. Usar `EXPLAIN ANALYZE` para validar uso de índices. |
| **Criterio de "done"** | Dashboard carga con datos reales en < 1.5s; StreakCounter refleja racha del día; WeeklyHeatmap muestra intensidad correcta; switch Aprendiz/Creador es instantáneo sin recarga; CreatorDashboard visible solo si `profiles.role = 'creator'`. |

---

## E-04 — Catálogo y descubrimiento

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Permitir que cualquier usuario encuentre tracks relevantes mediante búsqueda full-text, filtros y tabs de contexto org. |
| **Alcance (RF)** | RF-07 (catálogo con búsqueda, filtros, grid, TrackCard) |
| **Stories** | S-07 |
| **Fuera de alcance** | Búsqueda semántica con pgvector. |
| **Dependencias técnicas** | RPC `get_tracks` con full-text (GIN index en `search_vector`), pg_trgm para orden popularity, TanStack Query con debounce 300ms en cliente, atajo ⌘K (listener global). |
| **Riesgos** | LCP catálogo > 2s si grid grande sin paginación. Mitigación: paginación por página (20 tracks), lazy-load de thumbnails. |
| **Criterio de "done"** | LCP catálogo < 2s en Lighthouse staging; búsqueda full-text devuelve resultados relevantes; filtros funcionan en combinación; grid es responsive en 375/768/1280px. |

---

## E-05 — Gamificación y ranking

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Incrementar engagement mediante competición social. Fase 1 habilita My Groups; Fase 2 añade Global y Org. |
| **Alcance (RF)** | RF-11 (Leaderboard page: PodiumDisplay, LeaderboardTable, PeriodSelector, My Groups con GroupCards + CreateGroupModal) |
| **Stories** | S-11 |
| **Fuera de alcance Fase 1** | Tabs Global y My Org. |
| **Dependencias técnicas** | Tabla `leaderboard_snapshots` (precalculada cada 60 min por Edge Function `update-leaderboard` cron), RPCs `get_leaderboard`, `get_user_leaderboard_position`, `get_my_groups`, `create_friend_group`, `invite_to_group`. Framer Motion para animación secuencial podio. |
| **Riesgos** | Si el cron falla, los datos quedan stale. Implementar timestamp de última actualización visible en UI. |
| **Criterio de "done"** | Leaderboard My Groups muestra datos reales precalculados; PodiumDisplay anima correctamente; usuario ve su posición en sticky footer; crear grupo e invitar por email funciona. |

---

## E-06 — Organizaciones — Org Admin

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Habilitar la monetización B2B: el Org Admin gestiona miembros, equipos y asignaciones de tracks con modelo pay-per-seat-per-track vía Stripe. |
| **Alcance (RF)** | RF-12 (OrgDashboard, MemberDetailPanel, OrgMembersPage, OrgTeamsPage, OrgAssignmentsPage, OrgSettingsPage, CreateOrgPage, JoinOrgPage + billing Stripe) |
| **Stories** | S-12 |
| **Decisiones de arquitectura (OQ-01 resuelto)** | El pago es por asignación individual en el momento de asignar el track (no batch mensual). Flujo: AssignTrackModal → stripe-checkout Edge Function → Stripe Checkout Session → webhooks stripe-webhook confirma pago → activa asignación en `org_track_assignments.status = 'active'`. |
| **Fuera de alcance** | Multi-org, jerarquías, white-label, SSO. |
| **Dependencias técnicas** | Edge Functions `stripe-checkout`, `stripe-webhook`, `create-org-invite`, `accept-org-invite`. RPCs `assign_track`, `get_org_dashboard_stats`, `get_org_members`, `remove_org_member`, `create_team`, `add_team_member`. Recharts PieChart (TeamDonutChart). RecentActivityFeed con polling 30s via TanStack Query. |
| **Riesgos** | Stripe checkout session expira en 24h; si el admin abandona el checkout, la asignación queda en `pending`. Implementar cleanup job o expiración explícita. |
| **Criterio de "done"** | Org Admin puede asignar un track, completar el checkout de Stripe, y el miembro recibe el track asignado; Export CSV genera el archivo correcto; todas las páginas Org funcionan con RLS correcta (Org Admin no ve datos de otras orgs). |

---

## E-07 — Content Factory — Wizard + Gestión Creator

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | El diferenciador de productividad: un creador transforma un PDF/DOCX en un track publicado en ≤ 60 min con asistencia de IA. |
| **Alcance (RF)** | RF-13 (Wizard 7 pasos: Upload → Fragmentation → Config → Reutilization → BatchGen → Copilot → Publish), RF-14 (AtomManagementPage: deprecate + breaking_change; CreatorTracksPage) |
| **Stories** | S-13, S-14 |
| **Decisiones de arquitectura (OQ-03 resuelto)** | En Paso 4 "Use Existing" reutiliza la instancia de célula existente (misma fila `cells`), no crea copia. El `publish_track` RPC inserta en `track_cells` con referencia al `cell_id` existente, conforme a RN-14. |
| **Decisiones de arquitectura (OQ-04 resuelto)** | Las Edge Functions del wizard (`fragment-document`, `generate-atoms`, `copilot-edit`) usan **service role** de Supabase, eludiendo el rate limit de 10 llamadas/usuario/hora que aplica solo a llamadas front-end directas. La tabla `ai_jobs` trackea jobs del wizard; un job puede tener múltiples sub-llamadas internas. |
| **Fuera de alcance** | URL scraping, video generation automático, IA conversacional roleplay. |
| **Dependencias técnicas** | Edge Functions `upload-document`, `fragment-document`, `check-reutilization`, `generate-atoms`, `copilot-edit`. Tabla `track_drafts` + localStorage para draft persistence. RPC `publish_track` (transacción atómica). Dnd-kit para reordenamiento en Paso 2. |
| **Riesgos** | Batch generation puede tardar > 2 min para tracks con > 20 átomos. Implementar polling con RPC `get_job_status` o Supabase Realtime en tabla `ai_jobs`. |
| **Criterio de "done"** | Creator puede subir PDF, completar los 7 pasos y publicar un track en ≤ 60 min; draft persiste en localStorage y DB al navegar entre pasos; Retry en átomos fallidos funciona; DeprecateAtomModal muestra count correcto de tracks afectados. |

---

## E-08 — Aplicación creator y Admin Panel

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Controlar la calidad de los creadores mediante un proceso de solicitud formal con revisión humana del Platform Admin. |
| **Alcance (RF)** | RF-15 (ApplyPage 3 pasos + ApplyStatusPage + timeline), RF-16 (AdminPanel: cola de aplicaciones, Approve/Reject) |
| **Stories** | S-15, S-16 |
| **Dependencias técnicas** | RPCs `submit_creator_application`, `review_creator_application` (admin only → actualiza `profiles.role = 'creator'`). Tabla `creator_applications`. `RoleGuard` para `/admin`. Edge Function `waitlist-invite` reutilizable para notificación de aprobación via Resend. |
| **Riesgos** | El admin puede aprobar por error. Implementar confirmación modal + log de auditoría. |
| **Criterio de "done"** | Usuario puede aplicar, ver su status en timeline; admin puede aprobar o rechazar con feedback; al aprobar, el usuario puede acceder al Content Factory en el siguiente login. |

---

## E-09 — Notificaciones y certificados

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Mantener informados a todos los actores de eventos críticos en tiempo real, y proveer credenciales verificables al completar tracks. |
| **Alcance (RF)** | RF-17 (7 tipos de notificación, NotificationBell, Realtime, swipe mobile, PendingInvitesBanner), RF-18 (certificados auto-generados, CertificatePage pública con QR, is_outdated, share LinkedIn/X) |
| **Stories** | S-17, S-18 |
| **Dependencias técnicas** | Supabase Realtime en tabla `notifications` (filtrado por `user_id`). RPCs `get_notifications`, `mark_notification_read`, `mark_all_notifications_read`. Edge Functions `issue-certificate`, `check-cert-outdated`. Tabla `certificates` con `verification_code` único. QR code library (p.ej. `qrcode.react`). |
| **Riesgos** | Supabase Realtime puede desconectarse; implementar reconnect automático y fallback a polling 30s. |
| **Criterio de "done"** | NotificationBell se actualiza en tiempo real al recibir una notificación; swipe en mobile funciona en iOS y Android Chrome; CertificatePage es accesible sin login; QR code apunta a la URL verificable; `is_outdated` se activa correctamente cuando > 30% átomos en breaking_change. |

---

## E-10 — Tema, i18n, switch y perfil

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Personalización completa de la experiencia: 3 skins visuales, bilingüe EN/ES, switch de modo instantáneo y configuración de perfil. Sin strings hardcodeados. |
| **Alcance (RF)** | RF-19 (3 skins via CSS custom properties), RF-20 (switch Aprendiz/Creador sin recarga), RF-21 (i18n EN/ES con react-i18next), RF-23 (ProfileSettingsPage: avatar, display name, skin, idioma) |
| **Stories** | S-19, S-20, S-21, S-23 |
| **Fuera de alcance** | Motor de traducción automático, white-label, SSO. |
| **Dependencias técnicas** | CSS custom properties en `<html data-theme="dark-vibrant|light|cyberpunk">`. RPC `update_profile` (skin_preference, language_preference, active_mode). react-i18next con namespaces. `prefers-reduced-motion` media query para Cyberpunk skin (OQ-02 resuelto: siempre respetar). |
| **Decisiones OQ-02 resuelto** | El skin Gamified Cyberpunk respeta `prefers-reduced-motion`: todas las animaciones intensas (glow, holographic gradients) se reducen a `opacity` transitions sin motion. |
| **Riesgos** | Strings hardcodeados son difíciles de detectar. Implementar eslint rule `i18next/no-literal-string` como gate de CI. |
| **Criterio de "done"** | Los 3 skins aplicados correctamente y persistidos; cambio de idioma EN↔ES instantáneo; switch Creador/Learner sin recarga; 0 strings hardcodeados detectados por lint; avatar upload funciona con bucket `avatars`. |

---

## E-11 — MCP Server (Fase 2 únicamente)

| Campo | Contenido |
|-------|-----------|
| **Objetivo de negocio** | Exponer FastTrack a agentes AI externos (Claude, Cursor, etc.) mediante el Model Context Protocol para integración programática. |
| **Alcance (RF)** | RF-22 (8 tools MCP: create_atom, create_track, add_atom_to_cell, add_cell_to_track, create_track_with_cells_and_atoms, get_learner_progress, complete_atom, get_leaderboard) |
| **Stories** | S-22 |
| **⚠️ FASE 2 — No implementar en Fase 1** | La dependencia `@modelcontextprotocol/sdk` puede listarse en package.json pero el servidor MCP no se activa ni expone en Fase 1. |
| **Criterio de "done"** | El MCP server responde correctamente a cada tool; autenticación via Supabase service role; tests de integración con cliente MCP de ejemplo. |

---
