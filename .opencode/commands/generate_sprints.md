---
description: VISION — generate_sprints (generar plan completo de sprints)
---

Genera el plan completo de sprints a partir del Spec Kit generado; al completar, marca el spec como aprobado en el workflow (aprobación implícita).

## Instrucciones

### Paso 1 — Evaluar si se necesita clarificación

Lee `spec-kit/input/epics.md` y `stories.md`. Si las historias son ambiguas, la priorización no es clara o el número de sprints no está definido, invoca primero: `clarify_sprints`

Si el Spec Kit es claro y el plan de sprints está bien definido, continúa directamente al Paso 2.

### Paso 2 — Verificar precondiciones

- [ ] Los 8 artefactos del Spec Kit están presentes en `spec-kit/input/`
- [ ] Al ejecutar este comando con éxito, el estado del workflow marca `spec.approved` (no hace falta un paso de aprobación aparte)

### Paso 3 — Ejecutar

```bash
node scripts/plan-all-sprints.js --mode local
```

Si `planning/clarifications/sprints.json` existe, el script lo usa como contexto adicional para la planificación.

### Paso 4 — Verificar y reportar

Confirma que se crearon carpetas en `planning/sprints/sprint-XX/`.
Muestra al usuario: número de sprints, goals, total de stories y tareas.

Siguiente acción: `start_sprint --sprint 1`
