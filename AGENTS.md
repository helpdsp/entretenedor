# AGENTS.md — **PROJECT_NAME**

> Estos son **comandos de agente**. Se escriben en la ventana de agente del IDE
> (Cursor, Claude Code, Gemini CLI, GitHub Copilot, Antigravity, etc.), no en la terminal.

## Declaración de agente(s) (obligatorio)

En **cada actividad** del flujo (comandos VISION, clarificaciones, ejecución de scripts o edición de artefactos), el agente del IDE debe **indicar al inicio** qué rol(es) de Agency Agents está aplicando (slugs) y, si aplica, el asistente del IDE. **Norma completa, formato y tabla comando → rol:** `commands/agent_declaration.md`.

## Metadata de modelo generador (obligatorio)

Todo artefacto generado por el agente del IDE **debe incluir metadata** que identifique el modelo de IA usado. Esto aplica a:

- Archivos markdown en `spec-kit/input/` (brief, PRD, specs, epics, stories, etc.)
- Archivos en `planning/sprints/sprint-XX/` (goals, stories, tasks, qa-plan)
- Archivos de código fuente generados durante `start_sprint`
- Archivos JSON de clarificación en `planning/clarifications/`

### Formato por tipo de archivo

**Markdown (YAML frontmatter):**

```yaml
---
generated_by_model: 'claude-sonnet-4-20250514'
generated_at: '2026-01-09T12:00:00Z'
agent_roles: 'product-product-manager + engineering-technical-writer'
vision_command: 'generate_brief'
---
```

**Código fuente (JSDoc/JavaDoc/etc):**

```javascript
/**
 * @generated_by_model claude-sonnet-4-20250514
 * @generated_at 2026-01-09T12:00:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-001
 */
```

**JSON (clarifications):**

```json
{
  "generated_by_model": "claude-sonnet-4-20250514",
  "generated_at": "2026-01-09T12:00:00Z",
  "agent_roles": "product-product-manager",
  "vision_command": "clarify_brief",
  "questions": [...],
  "answers": {...}
}
```

### Campos requeridos

- `generated_by_model`: Nombre/versión del modelo de IA (ej: "gpt-4o", "claude-sonnet-4-20250514")
- `generated_at`: Timestamp ISO 8601 de la generación
- `agent_roles`: Slugs de Agency Agents aplicados en la actividad
- `vision_command`: El comando VISION que generó el archivo

### Campos opcionales según contexto

- `source_brief`: Ruta al brief fuente (para Spec Kit)
- `source_spec_kit`: Ruta a los artefactos del spec kit (para sprints)
- `sprint_number`: Número de sprint (para archivos de sprint y código)
- `task_id`: ID de tarea (para código generado durante sprints)
- `source_refdocs`: Ruta a refdocs (para clarifications)

## Compatibilidad con IDEs

Los comandos del proyecto están definidos en `commands/` — un archivo `.md` por comando.
Esta es la **fuente única de verdad**. Cada IDE lee su propio entrypoint pero todos apuntan aquí:

| IDE / Tool               | Entrypoint                                                                                                                   | Estado |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| **Cursor**               | `.cursor/rules/vision-index.mdc` (índice always-on; delega a `commands/`)                                                    | ✅     |
| **Claude Code**          | `CLAUDE.md` + `.claude/rules/vision-workflow.md` + `.claude/commands/*.md` (delegan a `commands/`); `AGENTS.md` como resumen | ✅     |
| **GitHub Copilot**       | `.github/copilot-instructions.md`                                                                                            | ✅     |
| **Antigravity**          | `generate_skills --tool antigravity` → SKILL.md globales                                                                     | ✅     |
| **Gemini CLI bare**      | Apunta a `commands/<nombre>.md` manualmente                                                                                  | ✅     |
| **Continue.dev / otros** | Apunta a `commands/<nombre>.md` manualmente                                                                                  | ✅     |

### Generar skills para Antigravity

```
node scripts/generate-skills.js --tool antigravity
```

Instala un SKILL.md en `~/.gemini/antigravity/skills/vision-<comando>/` por cada comando.
Activa con `@vision-generate-brief`, `@vision-start-sprint`, etc.

Para Claude Code global:

```
node scripts/generate-skills.js --tool claude-code
```

Para preview sin instalar:

```
node scripts/generate-skills.js --dry-run
```

---

## Cómo usar los comandos

Escribe el nombre del comando en la ventana de agente del IDE:

```
generate_brief
```

El agente lee `commands/<nombre>.md` y sigue las instrucciones.
Los scripts Node.js en `scripts/` son la implementación subyacente.

### IA local en VISION

**La IA local es el agente del IDE** (esta ventana), no un servicio obligatorio en `.env`. Los comandos `generate_brief`, `generate_spec_kit`, `generate_sprints`, etc. esperan que **el agente** lea los insumos, ejecute scripts cuando toque y **redacte o enriquezca** los artefactos en `spec-kit/input/` y `planning/` con criterio.

**`LOCAL_IDE_AI_COMMAND`** es **opcional**: solo enchufa un **CLI** que consuma JSON (`{{INPUT_FILE}}` / `{{OUTPUT_FILE}}`). Si no está definida, los scripts usan fallbacks determinísticos; eso no significa que falte IA local si el flujo lo lleva el agente.

Para ver el estado actual del flujo:

```
node scripts/status-report.js
```

---

## Referencia de comandos

Las instrucciones completas de cada comando están en `commands/<nombre>.md`.
Las secciones siguientes son un resumen rápido — lee el archivo de comando para el detalle operativo.

---

## Flujo principal

```
init
 └─ generate_brief          ← [el agente invoca clarify_brief si los refdocs son ambiguos]
      └─ generate_spec_kit  ← [aprobación implícita del brief al completar; clarify_spec_kit si el brief es ambiguo]
           └─ generate_sprints  ← [aprobación implícita del spec; el plan de sprints queda aprobado al generar]
                └─ start_sprint --sprint N  ← desarrollo + script; si N>1 cierra automáticamente el sprint N-1 al iniciar N (requiere todas las tareas N-1 en `done`)
                     ├─ continue_sprint  ← sprint activo con tareas pendientes (retomar tras pausa; `next_step` suele proponerlo)
                     └─ (siguiente sprint) start_sprint --sprint N+1  ← cuando el sprint actual tiene todas las tareas `done`
```

Regla de secuencia: cada etapa requiere que la anterior esté completa.
Usa `next_step` para que el agente detecte automáticamente la siguiente acción disponible.

## Comandos de clarificación (opcionales, invocados por el agente)

Los comandos `clarify_*` **no son pasos obligatorios** del flujo. El agente los invoca
cuando detecta ambigüedades en el contexto antes de una generación. Si el contexto es claro,
el flujo principal avanza sin pasar por ellos.

| Comando                     | Cuándo invocar         | Lee                           | Informa a                 |
| --------------------------- | ---------------------- | ----------------------------- | ------------------------- |
| `clarify_brief`             | refdocs ambiguos       | `refdocs/`                    | `generate_brief`          |
| `clarify_spec_kit`          | brief ambiguo          | `spec-kit/input/brief.md`     | `generate_spec_kit`       |
| `clarify_sprints`           | spec kit ambiguo       | `spec-kit/input/*.md`         | `generate_sprints`        |
| `clarify_sprint --sprint N` | plan de sprint ambiguo | `planning/sprints/sprint-0N/` | `start_sprint --sprint N` |

Las preguntas son **generadas por la IA al vuelo** leyendo el contexto real del proyecto,
no son preguntas estáticas. Cada proyecto recibe preguntas adaptadas a sus documentos.

Las respuestas se guardan en `planning/clarifications/<stage>.json` y son incluidas
automáticamente por el script de generación correspondiente como contexto adicional.

---

## Comandos

---

### `init`

Inicializa el proyecto. Resetea el estado de workflow y hace las preguntas de configuración.

**El agente debe:**

1. Ejecutar `node scripts/init-project.js`
2. Responder la pregunta de ingeniería inversa: ¿el proyecto parte de código existente?
3. Ofrecer descargar/actualizar Spec Kit y Agency Agents si git está disponible
4. Reportar el estado inicial y la siguiente acción recomendada

**Flags útiles (pasa al script):**

- `--reverse-engineering yes|no` — responde sin prompt interactivo
- `--update-spec-kit yes|no` — descarga/actualiza Spec Kit sin prompt
- `--update-agency-agents yes|no` — descarga/actualiza Agency Agents sin prompt
- `--no-prompt` — modo completamente no interactivo

**Precondiciones:** ninguna. Siempre ejecutable.

---

### `clarify_brief`

**Invocado por el agente** cuando los refdocs tienen ambigüedades.
La IA lee los refdocs y genera 4-6 preguntas específicas al proyecto.

**El agente debe:**

1. Ejecutar: `node scripts/clarify-brief.js`
2. El script lee `refdocs/`, llama al AI para generar preguntas contextuales
3. Presentar las preguntas al usuario en el chat o dejar que el script lo haga interactivamente
4. Guardar respuestas en `planning/clarifications/brief.json`

**Modo automático (respuestas ya conocidas):**

```
node scripts/clarify-brief.js --answers-file path/to/answers.json
```

Ver `commands/clarify_brief.md` para instrucciones completas.

**Siguiente acción:** `generate_brief`

---

### `generate_brief`

Genera el brief del proyecto a partir de los refdocs disponibles en `refdocs/`.

**El agente debe:**

1. Verificar precondiciones:
   - `planning/clarifications/brief.json` existe y está completo
   - Al menos 1 archivo en `refdocs/`
   - Si reverse engineering = yes: al menos 1 archivo en `source-code/`
2. Ejecutar: `node scripts/generate-brief.js`
3. Confirmar que `spec-kit/input/brief.md` fue creado
4. Mostrar el contenido del brief al usuario para revisión

**Si falla:** leer el mensaje de error — indica qué precondición falta.

**Siguiente acción:** `generate_spec_kit` (revisa o edita `spec-kit/input/brief.md` antes; la aprobación queda implícita al ejecutar `generate_spec_kit`)

---

### `generate_spec_kit`

Genera los artefactos del Spec Kit a partir del brief y del PRD; al completar, marca el brief como aprobado en el workflow.

**El agente debe:**

1. Verificar que `spec-kit/input/brief.md` existe (tras `generate_brief`; puedes editarlo antes de ejecutar este comando)
2. Ejecutar: `node scripts/generate-spec-kit.js --mode local --brief spec-kit/input/brief.md`
3. Verificar que los siguientes archivos fueron creados en `spec-kit/input/`:
   - `PRD.md`, `technical-spec.md`, `api-spec.yaml`, `data-model.md`
   - `epics.md`, `stories.md`, `sprint-plan.md`, `test-plan.md`
4. Mostrar resumen de lo generado

**Siguiente acción:** `generate_sprints` (revisa o edita los artefactos del Spec Kit antes; la aprobación del spec queda implícita al ejecutar `generate_sprints`)

---

### `clarify_spec_kit`

**Invocado por el agente** cuando el brief tiene ambigüedades antes de generate_spec_kit.
La IA lee el brief y genera preguntas técnicas y de producto específicas al proyecto.

**El agente debe:**

1. Ejecutar: `node scripts/clarify-spec-kit.js`
2. El script lee `spec-kit/input/brief.md`, genera preguntas con el AI
3. Guardar respuestas en `planning/clarifications/spec_kit.json`

Ver `commands/clarify_spec_kit.md` para instrucciones completas.

**Siguiente acción:** `generate_spec_kit`

---

### `clarify_sprints`

**Invocado por el agente** cuando el Spec Kit tiene ambigüedades antes de generate_sprints.
La IA lee los artefactos del spec kit y genera preguntas de planificación.

**El agente debe:**

1. Ejecutar: `node scripts/clarify-sprints.js`
2. El script lee los artefactos de `spec-kit/input/`, genera preguntas con el AI
3. Guardar respuestas en `planning/clarifications/sprints.json`

Ver `commands/clarify_sprints.md` para instrucciones completas.

**Siguiente acción:** `generate_sprints`

---

### `clarify_sprint --sprint N`

**Invocado por el agente** cuando un sprint específico tiene ambigüedades antes de start_sprint.
La IA lee el plan del sprint y genera preguntas de ejecución.

**El agente debe:**

1. Ejecutar: `node scripts/clarify-sprint.js --sprint N`
2. El script lee `planning/sprints/sprint-0N/`, genera preguntas con el AI
3. Guardar respuestas en `planning/clarifications/sprint-N.json`

Ver `commands/clarify_sprint.md` para instrucciones completas.

**Siguiente acción:** `start_sprint --sprint N`

---

### `generate_sprints`

Genera el plan completo de sprints a partir del Spec Kit generado; al completar, marca el spec como aprobado en el workflow (aprobación implícita).

**El agente debe:**

1. Verificar precondiciones:
   - `spec-kit/input/` con los 8 artefactos del Spec Kit (`generate_spec_kit` ejecutado)
   - `planning/clarifications/sprints.json` solo si aplicaste `clarify_sprints` y el flujo lo exige
2. Ejecutar: `node scripts/plan-all-sprints.js --mode local`
3. Verificar que se crearon carpetas en `planning/sprints/sprint-XX/`
4. Mostrar resumen: N sprints, M stories, K tareas

**Siguiente acción:** `start_sprint --sprint 1` (desarrollo del primer sprint)

---

### `approve_sprints_plan` (opcional / legado)

`generate_sprints` (`plan-all-sprints.js`) ya registra el plan como aprobado en el workflow. No es un paso obligatorio.

Usa este comando solo si necesitas re-registrar la aprobación manualmente o integraciones externas:

```
node scripts/approve-sprints-plan.js
```

**Siguiente acción:** `start_sprint --sprint 1`

---

### `start_sprint` / `start sprint` / `--sprint N`

**Inicia el desarrollo del sprint según el plan** — en la **misma respuesta** el agente debe **escribir código** (o artefactos equivalentes), no limitarse al script ni a un resumen.

**El agente debe:**

1. Resolver **N** si el usuario no lo dijo: sprint activo en `workflow-state` / `sprint-state`, o siguiente sprint `(max(completed)+1)`. Detalle en `commands/start_sprint.md`.
2. Si **N > 1**: en `planning/sprints/sprint-0{N-1}/tasks.md` todas las tareas en `done` (si no, el script falla).
3. Ejecutar `node scripts/start-sprint.js --sprint N` si hace falta activar el sprint (omitir si ya está activo con el mismo N).
4. **Implementar de inmediato** leyendo `sprint-goal.md`, `stories.md`, `tasks.md`, `qa-plan.md` y el spec; marcar `done` en `tasks.md` al cerrar cada tarea.
5. Si el backlog es muy grande, entregar al menos un **primer corte vertical** en la misma sesión.

**Siguiente acción:** mientras queden tareas sin `done`, **`continue_sprint`** (o seguir en la misma sesión); cuando `tasks.md` esté completo, **`start_sprint --sprint N+1`** (el script registra el cierre del sprint anterior al abrir el siguiente). No existe comando `complete_sprint`.

---

### `continue_sprint` / `continue sprint`

**Retoma el sprint ya activo** cuando hay tareas pendientes en `tasks.md` (p. ej. nueva sesión o `next_step`).

**El agente debe:**

1. Ejecutar `node scripts/continue-sprint.js --sprint N` (N = sprint activo; el argumento es opcional si solo hay un activo).
2. **Implementar en la misma respuesta** como en `start_sprint` (mismo contrato de código).

Ver `commands/continue_sprint.md`.

---

### `next_step`

Determina y ejecuta automáticamente la siguiente acción disponible en el flujo.

**El agente debe:**

1. Ejecutar: `node scripts/next-step.js`
2. Si hay bloqueos: reportarlos al usuario con las acciones para resolverlos
3. Si la siguiente acción requiere input del usuario (ej. `clarify_brief`): pedirlo

**Uso recomendado:** cuando no sabes en qué parte del flujo estás.

---

### `reset_project`

Reinicia el proyecto eliminando artefactos generados. Conserva `refdocs/` y `source-code/`.

**El agente debe:**

1. Advertir al usuario que se eliminarán: brief, spec, sprints, estado de workflow
2. Pedir confirmación explícita antes de ejecutar
3. Ejecutar: `node scripts/reset-project.js`
4. Confirmar que el estado volvió a `created`

---

### `update_spec_kit`

Descarga o actualiza el Spec Kit oficial de `github/spec-kit` vía git.

**El agente debe:**

1. Verificar que git está disponible
2. Ejecutar: `node scripts/update-spec-kit.js`
3. Reportar el SHA y cuántos templates se copiaron a `spec-kit/templates/`

---

### `update_agency_agents`

Descarga o actualiza Agency Agents de `msitarzewski/agency-agents` vía git.

**El agente debe:**

1. Verificar que git está disponible
2. Ejecutar: `node scripts/update-agency-agents.js`
3. Reportar el SHA y cuántos agentes se copiaron a `agency-agents/agents/`

---

### `generate_skills`

Exporta los comandos de `commands/` como SKILL.md instalables para Antigravity u otros tools.

**El agente debe:**

1. Preguntar al usuario qué tool destino quiere: `antigravity` o `claude-code`
2. Ejecutar: `node scripts/generate-skills.js --tool <tool>`
3. Reportar cuántos skills fueron instalados y en qué directorio
4. Para Antigravity: indicar que se activan con `@vision-<comando>` (incluye `@vision-agent-declaration` para la norma de declaración de roles)

**Flags disponibles:**

- `--tool antigravity` — instala en `~/.gemini/antigravity/skills/`
- `--tool claude-code` — instala en `~/.claude/agents/`
- `--out <dir>` — directorio destino personalizado
- `--dry-run` — muestra qué haría sin instalar nada

---

## Roles y delegación

Cuando el agente necesita ejecutar trabajo especializado dentro de un sprint,
delega al rol apropiado según el área:

| Área               | Rol principal                               | Cuándo activar                    |
| ------------------ | ------------------------------------------- | --------------------------------- |
| UI / componentes   | `engineering-frontend-developer`            | Tareas con `owner_role: frontend` |
| API / dominio / DB | `engineering-backend-architect`             | Tareas con `owner_role: backend`  |
| QA / evidencia     | `testing-reality-checker`                   | Gate de calidad al cerrar sprint  |
| CI/CD / infra      | `engineering-devops-automator`              | Tareas con `owner_role: deploy`   |
| Coordinación       | `project-management-senior-project-manager` | Bloqueos, reportes, planificación |

Los archivos de definición de cada rol están en `agency-agents/agents/<categoria>/`.

---

## Estructura de archivos clave

```
refdocs/                        ← insumos del usuario (no modificar)
source-code/                    ← código fuente si reverse engineering
spec-kit/
  input/                        ← artefactos generados (brief, PRD, specs...)
  templates/                    ← templates de github/spec-kit
agency-agents/
  agents/                       ← definiciones de roles de msitarzewski/agency-agents
planning/
  workflow-state.json           ← estado del flujo
  clarifications/               ← respuestas de sesiones de clarificación
  sprints/sprint-XX/            ← tareas, stories, qa por sprint
```

---

## Regla de oro

Ningún `start_sprint` (desarrollo) para el sprint N>1 sin:

1. `spec-kit/input/*` completo (tras `generate_spec_kit`; al generar sprints queda el plan aprobado en workflow)
2. `planning/sprints/sprint-XX/` generado
3. Clarificaciones `brief.json` / `sprints.json` según exija tu flujo de generación
4. **Sprint N-1:** en `planning/sprints/sprint-0{N-1}/tasks.md` todas las tareas con Status `done` antes de poder ejecutar `start_sprint --sprint N`
