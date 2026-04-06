---
name: continue_sprint
description: Retoma el sprint activo cuando quedan tareas sin `done` (p. ej. nueva sesión o next_step). El agente debe implementar en la misma sesión.
preconditions: hay sprint activo en workflow; planning/sprints/sprint-0N/tasks.md con al menos una tarea sin Status `done`
args: --sprint N (opcional; por defecto el sprint activo)
next: seguir implementando; cuando todo esté `done`, `start_sprint --sprint N+1`
---

## Disparadores

Equivale a **`continue_sprint`**:

- `continue_sprint --sprint N` / `continue sprint` / `retoma el sprint` / `sigue el sprint`

**Sin `--sprint`:** usa el sprint **activo** en `planning/workflow-state.json` (o `planning/sprint-state.json`).

## Contrato para el agente del IDE

**`continue_sprint` = retomar el desarrollo del sprint ya abierto en esta conversación** (no abre un sprint nuevo ni cierra el anterior).

1. Ejecuta `node scripts/continue-sprint.js --sprint N` (si el sprint activo es N; omite `--sprint` si el script puede inferirlo).
2. En la **misma respuesta**, continúa implementando según `sprint-goal.md`, `tasks.md`, `stories.md`, `qa-plan.md` y el spec.
3. No cierres solo con la salida del script: entrega código o cambios concretos.

## Diferencia con `start_sprint`

| Situación | Comando |
|----------|---------|
| Primer arranque del sprint N o pasar a N+1 (previo con todo `done`) | `start_sprint --sprint N` |
| Sprint N ya activo y **aún** hay tareas sin `done` en `tasks.md` | `continue_sprint` |

`next_step` y `status-report` proponen **`continue_sprint`** cuando el sprint activo está incompleto.

## Script

```
node scripts/continue-sprint.js --sprint N
```

Registra `continue_sprint` en el workflow y, si aplica, evento Matrix `sprint_continued`. Si todas las tareas ya están `done`, el script indica usar `start_sprint --sprint N+1` o `planning:finalize`.

## Presentación al usuario

Resumen del goal, tareas pendientes y qué implementas en esta respuesta.
