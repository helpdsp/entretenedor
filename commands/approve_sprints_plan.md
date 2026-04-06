---
name: approve_sprints_plan
description: Opcional. El plan ya queda aprobado al ejecutar generate_sprints (plan-all-sprints.js). Usar solo para re-registrar aprobación o integraciones.
preconditions: generate_sprints completado
next: start_sprint --sprint 1
---

## Instrucciones

### Paso 1 — Contexto

`node scripts/plan-all-sprints.js` ya invoca la aprobación del plan en el workflow (`markSprintsApproved`). **No es obligatorio** ejecutar este comando para poder usar `start_sprint`.

### Paso 2 — Cuándo usarlo

- Re-aprobación manual tras editar archivos en `planning/sprints/` sin regenerar todo.
- Herramientas externas que esperen el evento de aprobación.

### Paso 3 — Registrar (si aplica)

```
node scripts/approve-sprints-plan.js
```

Siguiente acción: `start_sprint --sprint 1` (o el sprint que corresponda).
