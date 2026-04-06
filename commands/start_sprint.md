---
name: start_sprint
description: Inicia el desarrollo del sprint N según el plan (código + artefactos). No es un solo script ni un resumen: el agente debe implementar en la misma sesión salvo bloqueo explícito.
preconditions: generate_sprints completado; si N>1 todas las tareas del sprint N-1 en tasks.md con Status `done`; carpeta planning/sprints/sprint-0N/ existe
args: --sprint N (opcional si se puede inferir N — ver abajo)
next: seguir implementando; cuando todo esté `done`, `start_sprint --sprint N+1` (cierra el sprint anterior automáticamente)
---

## Disparadores (equivale a este comando)

Trata como **`start_sprint`** cualquiera de estas intenciones del usuario (normaliza al mismo flujo):

- `start_sprint --sprint N` / `start sprint N` / `inicia sprint N` / `comienza el sprint N`
- **`start sprint`** o **`start_sprint`** **sin número**: el agente debe **inferir N** así:
  1. Leer `planning/workflow-state.json` y `planning/sprint-state.json`.
  2. Si hay un sprint **activo** con tareas **pendientes** en `tasks.md` (no todas `done`), el comando formal de retoma es **`continue_sprint`** (misma obligación de implementar en la sesión). Puedes ejecutar `start_sprint` con ese N solo si necesitas re-ejecutar el script de apertura; lo habitual es `continue_sprint`.
  3. Si hay activo y **todas** las tareas están `done`, el siguiente paso es **`start_sprint --sprint N+1`**, no `continue_sprint`.
  4. Si no hay activo: **N = primer sprint no completado** = `(max(completed) + 1)` o `1` si no hay completados, sin superar `sprints.total`.
  5. Si no se puede inferir sin ambigüedad, preguntar **una** vez: ¿qué sprint N?

## Contrato obligatorio para el agente del IDE

**`start_sprint` = comenzar o continuar el desarrollo del plan en esta misma conversación.**

1. **No** cierres la respuesta solo con “sprint activado” o solo con la salida del script.
2. **Sí** ejecuta `node scripts/start-sprint.js --sprint N` (si el sprint no estaba ya activo con el mismo N; si ya está activo con N, puedes omitir el script y continuar implementando).
3. **Sí** en la **misma respuesta**, después de validar precondiciones, **empieza a implementar** según:
   - `planning/sprints/sprint-0N/sprint-goal.md`
   - `stories.md`, `tasks.md`, `qa-plan.md`
   - `spec-kit/input/*` cuando haga falta (technical-spec, PRD, api-spec, data-model).
4. Entrega **cambios concretos en el repositorio** (archivos tocados, rutas, componentes). Si el backlog es enorme, implementa un **primer corte vertical** (p. ej. rutas + datos mock + un player) y deja listo el siguiente paso; no uses “el sprint es largo” como excusa para no codificar nada.

## Precondiciones (script)

- **Sprint N>1:** todas las tareas en `planning/sprints/sprint-0{N-1}/tasks.md` con **Status** `done`. Si falla, informa qué filas faltan; no inicies desarrollo del sprint N hasta resolverlo.

```
node scripts/start-sprint.js --sprint N
```

**Qué hace el script (importante):** si **N > 1**, tras validar que el sprint **N−1** tiene todas las tareas `done`, registra el sprint **N−1** como completado en el workflow y pone **activo** el sprint **N**. No existe un comando `complete_sprint`.

## Orden de trabajo recomendado

1. Leer plan del sprint y dependencias técnicas en `sprint-goal.md`.
2. Ordenar `tasks.md` por dependencias reales (no ciegamente por fila).
3. Implementar y **marcar `done`** en `tasks.md` solo cuando la tarea esté verificable.
4. `npm run gate` en `web/` cuando el sprint toque frontend (o el paquete que corresponda).

## Presentación breve al usuario

- Goal en una frase, stories clave, y **qué acabas de implementar en esta respuesta** + qué queda pendiente.

## Pasar al siguiente sprint

Cuando el sprint **actual** tenga **todas** las tareas `done` y QA alineado con `qa-plan.md`, ejecuta **`start_sprint --sprint N+1`**. El script cerrará automáticamente el sprint **N** en el estado del proyecto al abrir el **N+1**.

## Notas

- `generate_sprints` ya aprueba el plan en workflow.
- `clarify_*` solo si el plan es ambiguo para implementar.
