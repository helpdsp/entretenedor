---
name: update_spec_kit
description: Descarga o actualiza los templates de github/spec-kit vía git clone/pull.
preconditions: git disponible
---

## Instrucciones

### Paso 1 — Verificar git

Comprueba que `git` está disponible en el PATH.

### Paso 2 — Ejecutar

```
node scripts/update-spec-kit.js
```

### Paso 3 — Reportar

Muestra al usuario:
- Si fue primera descarga (`git clone`) o actualización (`git pull`)
- SHA del commit
- Cuántos templates se copiaron a `spec-kit/templates/`

Los templates actualizados estarán disponibles para la generación de especificaciones.
