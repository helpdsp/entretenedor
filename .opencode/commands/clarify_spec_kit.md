---
description: VISION — clarify_spec_kit (opcional; antes de generate_spec_kit)
---

Invocado por el agente cuando el brief tiene ambigüedades antes de generate_spec_kit. La IA lee el brief y genera preguntas técnicas y de producto específicas al proyecto.

## Instrucciones

1. Ejecuta: `node scripts/clarify-spec-kit.js`
2. El script lee `spec-kit/input/brief.md`, genera preguntas con el AI
3. Guarda respuestas en `planning/clarifications/spec_kit.json`

**Siguiente acción:** `generate_spec_kit`
