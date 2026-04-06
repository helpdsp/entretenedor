---
description: VISION — clarify_sprint (opcional; antes de start_sprint con --sprint N)
---

Invocado por el agente cuando un sprint específico tiene ambigüedades antes de start_sprint.

## Instrucciones

1. Ejecuta: `node scripts/clarify-sprint.js --sprint N`
2. El script lee `planning/sprints/sprint-0N/`, genera preguntas con el AI
3. Guarda respuestas en `planning/clarifications/sprint-N.json`

**Siguiente acción:** `start_sprint --sprint N`
