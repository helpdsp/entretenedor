---
description: VISION — clarify_brief (opcional; antes de generate_brief)
---

Invocado por el agente cuando los refdocs tienen ambigüedades. La IA lee los refdocs y genera 4-6 preguntas específicas al proyecto.

## Instrucciones

1. Ejecuta: `node scripts/clarify-brief.js`
2. El script lee `refdocs/`, genera preguntas contextuales con el AI
3. Presenta las preguntas al usuario en el chat o deja que el script lo haga interactivamente
4. Guarda respuestas en `planning/clarifications/brief.json`

**Modo automático (respuestas ya conocidas):**
```
node scripts/clarify-brief.js --answers-file path/to/answers.json
```

**Siguiente acción:** `generate_brief`
