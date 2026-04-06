---
description: VISION — clarify_sprints (opcional; antes de generate_sprints)
---

Invocado por el agente cuando el Spec Kit tiene ambigüedades antes de generate_sprints. La IA lee los artefactos del spec kit y genera preguntas de planificación.

## Instrucciones

1. Ejecuta: `node scripts/clarify-sprints.js`
2. El script lee los artefactos de `spec-kit/input/`, genera preguntas con el AI
3. Guarda respuestas en `planning/clarifications/sprints.json`

**Siguiente acción:** `generate_sprints`
