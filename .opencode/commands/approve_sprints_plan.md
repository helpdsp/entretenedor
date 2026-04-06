---
description: VISION — approve_sprints_plan (aprobación del plan de sprints)
---

Aprueba el plan de sprints generado. Nota: `generate_sprints` ya registra el plan como aprobado en el workflow, por lo que este comando es opcional/legado.

## Instrucciones

1. Verifica que existan carpetas en `planning/sprints/sprint-XX/`
2. Ejecuta: `node scripts/approve-sprints-plan.js` (si es necesario re-registrar la aprobación manualmente)
3. El estado del workflow se actualiza con `sprintsPlan.approved: true`

**Siguiente acción:** `start_sprint --sprint 1`
