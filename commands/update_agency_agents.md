---
name: update_agency_agents
description: Descarga o actualiza los roles de msitarzewski/agency-agents vía git clone/pull.
preconditions: git disponible
---

## Instrucciones

### Paso 1 — Verificar git

Comprueba que `git` está disponible en el PATH.

### Paso 2 — Ejecutar

```
node scripts/update-agency-agents.js
```

### Paso 3 — Reportar

Muestra al usuario:
- Si fue primera descarga o actualización
- SHA del commit
- Cuántos agentes se copiaron a `agency-agents/agents/`

Los roles actualizados estarán disponibles para la ejecución de sprints.
