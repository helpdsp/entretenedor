# **PROJECT_NAME**

Plantilla local-first para ejecutar el flujo VISION completo (brief → spec → sprints → ejecución)
sin depender de matriz.

Basado en:

- **Spec Kit** — [github/spec-kit](https://github.com/github/spec-kit): templates de especificación
- **Agency Agents** — [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents): roles de agente por especialidad

---

## Quick Start (3 pasos)

### 1. Clonar y preparar

```bash
git clone https://github.com/Nexus360-tech/vision.git mi-proyecto
cd mi-proyecto
npm install
```

### 2. Configurar tu IDE

Genera los archivos de configuración para tu IDE específico:

```bash
# Generar configuración para todos los IDEs (cursor, claude, opencode, copilot, antigravity)
npm run setup:ide
```

| IDE                | Archivos generados                     |
| ------------------ | -------------------------------------- |
| **Cursor**         | `.cursor/rules/vision-index.mdc`       |
| **Claude Code**    | `.claude/commands/` + `.claude/rules/` |
| **GitHub Copilot** | `.github/copilot-instructions.md`      |
| **OpenCode**       | `.opencode/commands/`                  |
| **Antigravity**    | `.agents/workflows/`                   |

**Nota:** Estos archivos son locales (no se suben a git) y se regeneran cuando lo necesites.

### 3. Ejecutar `init` y comenzar

Escribe el comando `init` en tu agente IDE (Cursor, Claude, Copilot, etc.):

```
init
```

El agente te preguntará:

- ¿Es reverse engineering? (¿partes de código existente?)
- ¿Descargar Spec Kit y Agency Agents? (recomendado: **sí**)

Una vez completado:

1. Coloca tus documentos en `refdocs/`
2. Ejecuta `generate_brief` en tu IDE
3. Sigue el flujo: `generate_spec_kit` → `generate_sprints` → `start_sprint --sprint 1`

**Declaración de agentes:** en cada actividad del flujo, el agente debe indicar qué rol(es) de [Agency Agents](https://github.com/msitarzewski/agency-agents) está aplicando; la norma y el formato están en `commands/agent_declaration.md`.

```
generate_brief
```

El agente interpreta el comando, verifica precondiciones, ejecuta los scripts Node.js necesarios
y reporta el resultado en el chat.

Para ejecutar desde terminal (opcional, modo developer):

```bash
node scripts/generate-brief.js
# o usando los wrappers de bin/
bin/generate_brief
```

---

## Flujo completo (desde el agente del IDE)

Escribe cada comando en la ventana del agente cuando el anterior esté completo:

```
init
clarify_brief
generate_brief
generate_spec_kit
clarify_sprints
generate_sprints
start_sprint --sprint 1
start_sprint --sprint 2
```

Regla de secuencia: cada etapa requiere que la anterior esté lista. `generate_sprints` aprueba el plan en el workflow; **`start_sprint` significa desarrollar** el sprint (implementar `tasks.md`). Si el sprint ya está activo y aún hay tareas pendientes, el siguiente paso formal es **`continue_sprint`**. Para `start_sprint --sprint N` con N>1, el sprint N-1 debe tener **todas** las tareas en `tasks.md` con Status `done`.

Si no sabes en qué parte estás:

```
next_step
```

Para ver el flujo completo con instrucciones por comando: leer `AGENTS.md`.

---

## Sesiones de clarificación

Antes de `generate_brief` y `generate_sprints` se requiere una sesión de clarificación.
El agente te hace las preguntas directamente en el chat:

**`clarify_brief`** — tono, audiencia, alcance y prioridad del brief.

**`clarify_sprints`** — duración de sprint, cantidad, roles activos y criterio de éxito.

Las respuestas se guardan en:

- `planning/clarifications/brief.json`
- `planning/clarifications/sprints.json`

Modo no interactivo (para agentes automáticos):

```powershell
node scripts/clarify-brief.js --answers-file path/to/answers.json
```

Ejemplo de `answers.json` para `clarify_brief`:

```json
{
  "brief_tone": "Ejecutivo",
  "brief_audience": "CEO / Stakeholders",
  "brief_scope": "MVP + roadmap",
  "brief_priority": "Velocidad de entrega"
}
```

---

## Spec Kit

Los templates oficiales de [github/spec-kit](https://github.com/github/spec-kit) se descargan al correr `init` (si respondes "sí" a la pregunta).
También se pueden actualizar con:

```
update_spec_kit
```

Estructura local:

```
spec-kit/
  input/        ← artefactos generados del proyecto (PRD, specs, stories...)
  templates/    ← templates copiados desde upstream (tracked en git)
  upstream/     ← clon local de git (gitignored)
  upstream.json ← sha y fecha de la última actualización
```

Los artefactos que genera `generate_spec_kit` en `spec-kit/input/`:

| Archivo             | Contenido                                |
| ------------------- | ---------------------------------------- |
| `PRD.md`            | Casos de uso, flujos, métricas           |
| `technical-spec.md` | Stack, arquitectura, decisiones          |
| `api-spec.yaml`     | Definición de endpoints                  |
| `data-model.md`     | Modelo de datos                          |
| `epics.md`          | Épicas del producto                      |
| `stories.md`        | User stories con criterios de aceptación |
| `sprint-plan.md`    | Distribución de stories por sprint       |
| `test-plan.md`      | Estrategia QA por capa                   |

---

## Agency Agents

Los roles de agente del proyecto vienen de [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents).
Se descargan al correr `init` (si respondes "sí" a la pregunta). También se pueden actualizar con:

```
update_agency_agents
```

Estructura local:

```
agency-agents/
  agents/       ← definiciones de roles copiadas desde upstream (tracked en git)
    engineering/
    design/
    testing/
    product/
    project-management/
  upstream/     ← clon local de git (gitignored)
  upstream.json ← sha y fecha de la última actualización
```

Los roles activos por defecto se definen en `agent-roles.json`:

| Área     | Rol principal                               |
| -------- | ------------------------------------------- |
| Frontend | `engineering-frontend-developer`            |
| Backend  | `engineering-backend-architect`             |
| QA       | `testing-reality-checker`                   |
| Deploy   | `engineering-devops-automator`              |
| PM       | `project-management-senior-project-manager` |

---

## Estructura de archivos clave

```
refdocs/                    ← insumos del usuario (no modificar)
source-code/                ← código fuente si reverse engineering
spec-kit/input/             ← artefactos generados del Spec Kit
agency-agents/agents/       ← roles de agente por especialidad
planning/
  workflow-state.json       ← estado del flujo
  clarifications/           ← respuestas de sesiones de clarificación
  sprints/sprint-XX/        ← tareas, stories, QA por sprint
AGENTS.md                   ← instrucciones para el agente del IDE
commands/                   ← definiciones de comandos (fuente de verdad)
agent-roles.json            ← mapeo de roles por área
```

**Nota:** Los archivos de configuración IDE (`.cursor/`, `.claude/`, `.github/copilot-instructions.md`, etc.) se generan localmente y no se incluyen en git.

---

## Estado y diagnóstico

Desde la terminal:

```powershell
npm run status
```

Dashboard web local:

```powershell
npm run status:web
# → http://127.0.0.1:4173 por defecto; si el puerto está ocupado, el servidor elige el siguiente libre (4174, …) y lo muestra en consola
```

---

## Flujo conectado a matriz (opcional)

```bash
npm run connect_project -- --project-id "<ID>" --workspace-id "<WS>" --matrix-url "http://localhost:4000"
npm run matrix:authorize -- --authorized-by "<tu-nombre>"
# Si matriz no responde, los reportes se encolan en .matrix/pending-reports.ndjson
npm run matrix:sync
```

---

## Compatibilidad desde terminal

Todos los comandos tienen equivalente `npm run` para uso desde terminal:

```bash
npm run clarify_brief
npm run generate_brief
npm run generate_spec_kit
npm run clarify_sprints
npm run generate_sprints
npm run approve_sprints_plan   # opcional; generate_sprints ya aprueba el plan
npm run start_sprint -- --sprint N
npm run reset_project
npm run update_spec_kit
npm run update_agency_agents
```

Y como wrappers directos en `bin/`:

```bash
bin/generate_brief
bin/start_sprint --sprint 1
```

---

## MCP local

```powershell
npm run mcp:matrix
```

Herramientas MCP disponibles: `matrix_healthcheck`, `matrix_connect_project`,
`matrix_authorize_project`, `matrix_validate_briefing`, `matrix_generate_spec_kit`,
`matrix_report_stats`, `matrix_sync_pending_reports`.

---

## Referencias

- Documentación completa: `GUIA_COMPLETA_VISION.md`
- Comandos del agente: `AGENTS.md`
- Estructura de comandos: `commands/README.md`
