# Documentación base

Este directorio describe la operación local-first de `blank_project`.

## Instrucciones para el agente del IDE

- `../AGENTS.md` — manual de comandos para el agente: qué hace cada comando, precondiciones, scripts a ejecutar
- `../.cursor/rules/vision-index.mdc` — regla única de Cursor (always-on): índice del flujo y enlace a `commands/<nombre>.md` por comando

## Flujo y arquitectura

- `spec-to-sprint-workflow.md` — flujo completo: init → brief → spec → sprints → ejecución
- `wizard-flow.md` — pipeline operativo y estados del workflow
- `matrix-reporting.md` — conexión opcional a matriz, autorización explícita y cola offline
- `mcp-local-setup.md` — setup del MCP local como puente con matriz

## Templates de trabajo

- `templates/sprint-planning-template.md` — guía de planning por sprint
- `templates/qa-checklist-template.md` — checklist QA previo a merge
- `templates/release-notes-template.md` — formato de release

## Decisiones técnicas

- `adr/ADR-000-template.md` — plantilla de decisión técnica (ADR)

## Estado del proyecto

- CLI: `npm run status`
- Web local: `npm run status:web` → `http://127.0.0.1:4173` por defecto (si está ocupado, otro puerto libre; ver consola)

## Referencias externas

- Spec Kit upstream: [github/spec-kit](https://github.com/github/spec-kit)
- Agency Agents: [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents)
- Roles activos del proyecto: `../agent-roles.json`
