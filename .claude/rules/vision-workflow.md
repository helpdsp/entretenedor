---
description: VISION — comandos del proyecto; delegar siempre a commands/
---

# VISION — Comandos del proyecto

Este proyecto usa el framework VISION. Cuando el usuario escribe un comando del flujo (por texto o vía slash command en `.claude/commands/`), **lee el archivo `commands/<nombre>.md`** y sigue las instrucciones que contiene.

**Declaración de agente(s):** antes de cada actividad VISION o trabajo sustancial, abre con una línea `**Agente(s):** ...` según `commands/agent_declaration.md` (slugs de `agency-agents/agents/`).

## Flujo principal

```
init → generate_brief → generate_spec_kit → generate_sprints
     → start_sprint --sprint N  (desarrollo; si N>1 cierra N-1 al iniciar N)
     → continue_sprint  (sprint activo con tareas pendientes)
```

## Índice de comandos → archivos de instrucciones

| Comando del usuario | Instrucciones en |
|---|---|
| `init` | `commands/init.md` |
| `generate_brief` | `commands/generate_brief.md` |
| `generate_spec_kit` | `commands/generate_spec_kit.md` |
| `generate_sprints` | `commands/generate_sprints.md` |
| `approve_sprints_plan` | `commands/approve_sprints_plan.md` (opcional) |
| `start_sprint --sprint N` | `commands/start_sprint.md` |
| `continue_sprint` | `commands/continue_sprint.md` |
| `next_step` | `commands/next_step.md` |
| `reset_project` | `commands/reset_project.md` |
| `update_spec_kit` | `commands/update_spec_kit.md` |
| `update_agency_agents` | `commands/update_agency_agents.md` |
| `generate_skills` | `node scripts/generate-skills.js` (ver `AGENTS.md`) |
| *(meta: norma de agentes)* | `commands/agent_declaration.md` |

## Clarificaciones (opcionales si hay ambigüedad)

| Comando | Lee | Para |
|---|---|---|
| `clarify_brief` | `refdocs/` | `generate_brief` |
| `clarify_spec_kit` | `spec-kit/input/brief.md` | `generate_spec_kit` |
| `clarify_sprints` | `spec-kit/input/*.md` | `generate_sprints` |
| `clarify_sprint --sprint N` | `planning/sprints/sprint-0N/` | `start_sprint --sprint N` |

## Regla de operación

Cuando el usuario escribe cualquiera de estos comandos:

1. Lee `commands/agent_declaration.md` y declara **Agente(s):** en la primera línea de tu respuesta para esa actividad.
2. Lee el archivo `commands/<nombre>.md` (o el canon indicado arriba).
3. Sigue las instrucciones al pie de la letra.
4. Reporta el resultado al usuario con la siguiente acción recomendada.

**`start_sprint` / `continue_sprint`:** no solo el script — en la misma respuesta **implementa** según `planning/sprints/sprint-0N/` y el spec (`commands/start_sprint.md`, `commands/continue_sprint.md`).

El estado del flujo vive en `planning/workflow-state.json`.
Si no sabes en qué etapa estás, ejecuta `node scripts/next-step.js` o `node scripts/status-report.js`.
