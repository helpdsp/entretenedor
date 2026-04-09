---
name: clarify_spec_kit
description: El agente lo invoca cuando el brief tiene ambigüedades antes de generate_spec_kit. La IA lee el brief y genera preguntas contextuales.
preconditions: spec-kit/input/brief.md existe y está aprobado
triggered_by: agent (when brief has ambiguities), or user explicitly
next: generate_spec_kit
---

## Cuándo invocar este comando

**No es un paso obligatorio del flujo principal.**

Invócalo cuando:

- El brief aprobado tiene secciones ambiguas o incompletas
- No está claro el stack tecnológico requerido
- Hay dudas sobre integraciones externas, autenticación o modelo de datos
- El scope del Spec Kit no está bien delimitado (¿API? ¿DB? ¿qué endpoints?)
- Las reglas de negocio descritas en el brief son contradictorias

Si el brief es claro y detallado, puedes ejecutar `generate_spec_kit` directamente.

## Qué hace

1. Lee `spec-kit/input/brief.md`
2. Llama al AI con el brief como contexto
3. El AI genera 4-6 preguntas técnicas y de producto específicas al proyecto
4. Presenta las preguntas al usuario de forma interactiva
5. Guarda las respuestas en `planning/clarifications/spec_kit.json`
6. `generate_spec_kit` lee ese archivo e incluye las respuestas en su prompt

## Ejecutar

```
node scripts/clarify-spec-kit.js
```

Modo automático:

```
node scripts/clarify-spec-kit.js --answers-file planning/clarifications/spec_kit-answers.json
```

## Resultado

- `planning/clarifications/spec_kit.json` creado con preguntas + respuestas + metadata

**Estructura del JSON con metadata:**

```json
{
  "generated_by_model": "[IDE_AGENT_MODEL]",
  "generated_at": "[ISO_TIMESTAMP]",
  "agent_roles": "[ROL_APLICADO]",
  "vision_command": "clarify_spec_kit",
  "source_brief": "spec-kit/input/brief.md",
  "questions": [...],
  "answers": {...}
}
```

- `generate_spec_kit` usará esas respuestas como contexto adicional
