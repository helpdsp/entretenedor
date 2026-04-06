---
description: VISION — next_step (siguiente acción del workflow)
---

Detecta automáticamente la siguiente acción disponible en el flujo VISION.

## Instrucciones

1. Ejecuta: `node scripts/status-report.js` para ver el estado actual del proyecto.
2. Analiza el estado del workflow en `planning/workflow-state.json`:
   - Si no existe workflow → siguiente: `init`
   - Si existe workflow pero no brief → siguiente: `generate_brief`
   - Si existe brief pero no spec kit → siguiente: `generate_spec_kit`
   - Si existe spec kit pero no sprints → siguiente: `generate_sprints`
   - Si existen sprints pero ninguno activo → siguiente: `start_sprint --sprint 1`
   - Si hay sprint activo con tareas pendientes → siguiente: `continue_sprint`
   - Si sprint activo completado → siguiente: `start_sprint --sprint N+1`
3. Informa al usuario la siguiente acción recomendada y ofrece ejecutarla.
