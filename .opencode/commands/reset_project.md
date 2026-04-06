---
description: VISION — reset_project (borra artefactos generados)
---

Borra artefactos generados del proyecto VISION. **Pide confirmación al usuario antes de ejecutar.**

## Instrucciones

**ADVERTENCIA:** Este comando eliminará:
- `spec-kit/input/*.md` (excepto README.md)
- `planning/sprints/` (todos los sprints generados)
- `planning/workflow-state.json`
- `planning/clarifications/*.json`

### Paso 1 — Confirmación obligatoria

Pregunta al usuario: **"¿Estás seguro de que quieres borrar todos los artefactos generados? Esta acción no se puede deshacer. Escribe 'BORRAR' para confirmar."**

No continúes a menos que el usuario escriba explícitamente "BORRAR".

### Paso 2 — Ejecutar

```bash
node scripts/reset-project.js
```

O con confirmación automática (solo si el usuario ya confirmó):
```bash
node scripts/reset-project.js --force
```

### Paso 3 — Reportar

Informa al usuario qué archivos fueron eliminados y que el proyecto está listo para reiniciar desde `init`.
