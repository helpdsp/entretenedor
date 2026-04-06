---
name: next_step
description: Detecta la siguiente acción disponible en el flujo y la ejecuta automáticamente.
preconditions: ninguna
---

## Instrucciones

### Paso 1 — Consultar estado

```
node scripts/next-step.js
```

### Paso 2 — Interpretar output

Lee la salida del script:

- **Hay una acción recomendada sin bloqueos**: ejecútala directamente.
- **Hay bloqueos** (ej. faltan refdocs, clarificación pendiente): informa al usuario con instrucciones concretas para resolverlos.
- **Requiere input del usuario** (ej. `clarify_brief`): inicia ese flujo.

### Cuándo usar este comando

- Cuando el usuario no sabe en qué parte del flujo está.
- Al inicio de una sesión de trabajo para retomar donde se quedó.
- Como primer comando si el usuario escribe solo "continúa" o "siguiente".

Si el sprint activo tiene tareas sin `done` en `tasks.md`, la acción detectada suele ser **`continue_sprint`** (no `start_sprint`). Ejecuta el script que indique `nextAction` y luego aplica `commands/continue_sprint.md`.
