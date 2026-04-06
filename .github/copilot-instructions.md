# GitHub Copilot Instructions — VISION Project

Este proyecto usa el framework VISION para gestión de proyectos con agentes de IA.
Los comandos del flujo se definen en `commands/` — un archivo `.md` por comando.

## Declaración de agente(s)

Antes de ejecutar cualquier comando o actividad sustancial, el agente debe abrir la respuesta con una línea `**Agente(s):** ...` usando los slugs de Agency Agents. Ver `commands/agent_declaration.md`.

## Cómo interpretar comandos del usuario

Cuando el usuario escribe un nombre de comando (ej. `generate_brief`, `start_sprint --sprint 1`),
lee el archivo `commands/<nombre_comando>.md` y sigue las instrucciones que contiene.

## Comandos disponibles

| Comando | Archivo de instrucciones |
|---|---|
| `init` | `commands/init.md` |
| `clarify_brief` *(agent-invoked)* | `commands/clarify_brief.md` |
| `generate_brief` | `commands/generate_brief.md` |
| `clarify_spec_kit` *(agent-invoked)* | `commands/clarify_spec_kit.md` |
| `generate_spec_kit` | `commands/generate_spec_kit.md` |
| `clarify_sprints` *(agent-invoked)* | `commands/clarify_sprints.md` |
| `generate_sprints` | `commands/generate_sprints.md` |
| `approve_sprints_plan` *(opcional)* | `commands/approve_sprints_plan.md` |
| `clarify_sprint --sprint N` *(agent-invoked)* | `commands/clarify_sprint.md` |
| `start_sprint --sprint N` | `commands/start_sprint.md` |
| `continue_sprint` | `commands/continue_sprint.md` |
| `next_step` | `commands/next_step.md` |
| `reset_project` | `commands/reset_project.md` |
| `update_spec_kit` | `commands/update_spec_kit.md` |
| `update_agency_agents` | `commands/update_agency_agents.md` |

## Flujo de secuencia

```
init → generate_brief → generate_spec_kit → generate_sprints
     → start_sprint --sprint N → …
```
(`start_sprint` = desarrollar el sprint **en la misma respuesta** con código; **`continue_sprint`** retoma el sprint activo con tareas pendientes; el siguiente `start_sprint` cierra el sprint previo al abrir el siguiente; `generate_sprints` ya aprueba el plan. Ver `commands/start_sprint.md` y `commands/continue_sprint.md`.)

Los comandos `clarify_*` son opcionales y los invoca el agente cuando detecta ambigüedades:
- `clarify_brief` antes de `generate_brief` (si los refdocs son ambiguos)
- `clarify_spec_kit` antes de `generate_spec_kit` (si el brief es ambiguo)
- `clarify_sprints` antes de `generate_sprints` (si el spec kit es ambiguo)
- `clarify_sprint --sprint N` antes de `start_sprint` (si el sprint tiene dudas)

Si el usuario no sabe qué sigue, ejecuta `next_step`.

## Referencias

- Roles de agente: `agent-roles.json` + `agency-agents/agents/`
- Artefactos del Spec Kit: `spec-kit/input/`
- Estado del flujo: `planning/workflow-state.json`
