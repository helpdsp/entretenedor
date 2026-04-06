---
name: clarify_sprint
description: El agente lo invoca cuando el plan de un sprint específico tiene ambigüedades antes de start_sprint. La IA lee el sprint y genera preguntas de ejecución.
preconditions: planning/sprints/sprint-0N/ existe y está aprobado
triggered_by: agent (when sprint plan has ambiguities), or user explicitly
args: --sprint N
next: start_sprint --sprint N
---

## Cuándo invocar este comando

**No es un paso obligatorio del flujo principal.**

Invócalo cuando:
- Las tareas del sprint tienen criterios de aceptación ambiguos
- Los roles asignados a las tareas no están claros o hay conflictos
- Hay dependencias técnicas entre tareas que no están ordenadas
- El entorno de desarrollo o las herramientas necesarias no están disponibles
- El goal del sprint es demasiado amplio para completar en el tiempo definido

Si el plan del sprint es claro y completo, ejecuta `start_sprint --sprint N` directamente.

## Qué hace

1. Lee `planning/sprints/sprint-0N/goal.md`, `stories.md`, `tasks.md`, `qa-plan.md`
2. Llama al AI con esos archivos como contexto
3. El AI genera 3-5 preguntas de ejecución específicas al sprint
4. Presenta las preguntas al usuario de forma interactiva
5. Guarda las respuestas en `planning/clarifications/sprint-N.json`
6. El agente usa esas respuestas al ejecutar las tareas del sprint

## Ejecutar

```
node scripts/clarify-sprint.js --sprint N
```

Modo automático:

```
node scripts/clarify-sprint.js --sprint 1 --answers-file planning/clarifications/sprint-1-answers.json
```

## Resultado

- `planning/clarifications/sprint-N.json` creado con preguntas + respuestas
- Contexto disponible para el agente durante la ejecución del sprint
