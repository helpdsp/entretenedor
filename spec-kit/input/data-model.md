# Data model — Local Project

> **VISION fallback:** Uses section 7 of the product PRD when a "## 7." heading is present; otherwise embeds an excerpt of the full PRD.

## Extracted from product PRD (section 7)

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
