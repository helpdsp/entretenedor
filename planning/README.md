# Planning

Contiene el estado del workflow y los artefactos ejecutables por sprint.

## Estructura

```
planning/
  workflow-state.json       ← estado central del flujo (no editar manualmente)
  local-workflow-status.json ← snapshot generado: nextAction + resumen (npm run sync_workflow_status)
  clarifications/
    brief.json              ← respuestas de clarify_brief
    sprints.json            ← respuestas de clarify_sprints
  sprints/
    sprint-01/
      goal.md               ← objetivo del sprint
      stories.md            ← user stories asignadas
      tasks.md              ← tareas con owner_role
      qa-plan.md            ← criterios de aceptación y QA gate
    sprint-02/
      ...
  sprint-index.md           ← índice de todos los sprints generados
  backlog.md                ← backlog base generado desde el Spec Kit
```

## Comandos relacionados

Desde la ventana de agente del IDE:

```
clarify_sprints         ← recopila preferencias antes de generar sprints (opcional)
generate_sprints        ← genera el plan completo de sprints (aprueba el plan en workflow)
start_sprint --sprint 1 ← desarrolla el sprint 1; el siguiente `start_sprint --sprint 2` cierra el 1 al abrir el 2 (requiere todas las tareas `done` del sprint previo)
continue_sprint         ← retoma el sprint activo si quedan tareas sin `done` en `tasks.md`
next_step               ← detecta y ejecuta la siguiente acción disponible (a menudo `continue_sprint` o `start_sprint`)
```

Desde terminal (diagnóstico):

```powershell
node scripts/status-report.js
npm run status
npm run sync_workflow_status   ← actualiza local-workflow-status.json con nextAction actual
```

Empaquetar el planning completo en ZIP:

```powershell
npm run planning:finalize
# → dist/<project-slug>-planning-kit.zip
```
