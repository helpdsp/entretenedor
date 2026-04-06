---
description: VISION — start_sprint (iniciar sprint N; usar con --sprint N)
---

Inicia el desarrollo del sprint según el plan.

## Instrucciones

1. **Resolver N** si el usuario no lo indicó: busca el sprint activo en `planning/workflow-state.json` / `sprint-state`, o usa el siguiente sprint `(max(completed)+1)`.

2. **Si N > 1**: verifica que en `planning/sprints/sprint-0{N-1}/tasks.md` todas las tareas están en `done` (si no, el script falla).

3. Ejecuta `node scripts/start-sprint.js --sprint N` si hace falta activar el sprint (omitir si ya está activo con el mismo N).

4. **Implementar de inmediato** leyendo `sprint-goal.md`, `stories.md`, `tasks.md`, `qa-plan.md` y el spec; marca `done` en `tasks.md` al cerrar cada tarea.

5. Si el backlog es muy grande, entrega al menos un **primer corte vertical** en la misma sesión.

**Siguiente acción:** mientras queden tareas sin `done`, usa `continue_sprint` (o seguir en la misma sesión); cuando `tasks.md` esté completo, usa `start_sprint --sprint N+1` (el script registra el cierre del sprint anterior al abrir el siguiente).
