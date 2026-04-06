# VISION — Instrucciones para Claude Code

Este repositorio usa el **framework VISION**: el flujo (brief → spec kit → sprints → ejecución) se gobierna con **comandos de agente**, no con una sola narrativa suelta.

## Fuente única de verdad

| Qué | Dónde |
|-----|--------|
| Comandos del flujo (pasos, scripts, precondiciones) | `commands/<nombre>.md` |
| Resumen y tabla de comandos | `AGENTS.md` |
| Norma de declaración de roles (Agency Agents) | `commands/agent_declaration.md` |
| Estado del workflow | `planning/workflow-state.json` |
| Este archivo | Memoria de proyecto para Claude Code (sesión) |

## Cómo debes actuar

1. Cuando el usuario escriba un **comando VISION** (por nombre, o con `/` si usa slash commands del proyecto), **lee primero** el `.md` correspondiente en `commands/`.
2. **Declara agente(s)** al inicio de la actividad: ver `commands/agent_declaration.md`.
3. Ejecuta los `node scripts/...` que indique el comando **desde la raíz del proyecto**.
4. Reporta resultado y **siguiente acción** recomendada.

**`start_sprint` / `continue_sprint`:** en la misma respuesta debes **implementar** el backlog del sprint (código), no solo el script. Ver `commands/start_sprint.md` y `commands/continue_sprint.md`.

## Flujo principal

```
init → generate_brief → generate_spec_kit → generate_sprints
     → start_sprint --sprint N  (el siguiente start_sprint cierra el sprint previo al abrir el siguiente)
     → continue_sprint  (sprint activo incompleto; retomar trabajo)
```

Los comandos `clarify_*` son **opcionales**; el agente los invoca si hay ambigüedad antes de generar.

## Si no sabes en qué etapa está el proyecto

Ejecuta en terminal (raíz del repo):

```bash
node scripts/status-report.js
```

o:

```bash
node scripts/next-step.js
```

(solo cuando el siguiente paso no requiera `yes|no` interactivo sin contexto).

## Integración Claude Code en este repo

- **Reglas siempre relevantes:** `.claude/rules/vision-workflow.md`
- **Slash commands / prompts:** `.claude/commands/*.md` (invocación `/nombre-del-archivo`)
- **Cursor** usa `.cursor/rules/vision-index.mdc`; el contenido es equivalente al de la regla anterior.

Mantén `commands/` como canon; si cambia el flujo, actualiza también `.claude/` o regenera con el script del proyecto si existe.
