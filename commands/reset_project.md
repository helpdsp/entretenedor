---
name: reset_project
description: Reinicia el proyecto eliminando artefactos generados. Conserva refdocs/ y source-code/.
preconditions: ninguna
---

## Instrucciones

### Paso 1 — Advertir

Informa explícitamente al usuario qué se va a eliminar:
- Brief, Spec Kit, plan de sprints
- Estado del workflow (`planning/workflow-state.json`)
- Respuestas de clarificación (`planning/clarifications/`)

Lo que **NO** se elimina: `refdocs/`, `source-code/`, `agency-agents/agents/`, `spec-kit/templates/`.

### Paso 2 — Pedir confirmación

Pregunta: **¿Confirmas el reset? Esta acción no se puede deshacer.**

Solo ejecutar si el usuario confirma explícitamente.

### Paso 3 — Ejecutar

```
node scripts/reset-project.js
```

### Paso 4 — Confirmar estado

```
node scripts/status-report.js
```

Informa que el proyecto volvió al estado inicial y que el siguiente paso es `init`.
