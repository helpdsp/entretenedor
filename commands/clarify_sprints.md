---
name: clarify_sprints
description: El agente lo invoca cuando el Spec Kit tiene ambigüedades antes de generate_sprints. La IA lee los artefactos del spec kit y genera preguntas de planificación.
preconditions: spec-kit/input/ aprobado con los 8 artefactos
triggered_by: agent (when spec kit has ambiguities), or user explicitly
next: generate_sprints
---

## Cuándo invocar este comando

**No es un paso obligatorio del flujo principal.**

Invócalo cuando:

- Las stories o epics del Spec Kit son ambiguas o demasiado amplias
- No está claro cómo priorizar features entre sprints
- Hay dependencias técnicas no resueltas entre historias
- La velocidad del equipo o el número de sprints no está definido
- El criterio de "done" por sprint no está especificado

Si el Spec Kit está bien definido y el plan de sprints es claro, ejecuta `generate_sprints` directamente.

## Qué hace

1. Lee `spec-kit/input/epics.md`, `stories.md`, `sprint-plan.md`, `PRD.md`, `technical-spec.md`
2. Llama al AI con esos documentos como contexto
3. El AI genera 4-6 preguntas de planificación específicas al proyecto
4. Presenta las preguntas al usuario de forma interactiva
5. Guarda las respuestas en `planning/clarifications/sprints.json`
6. `generate_sprints` lee ese archivo e incluye las respuestas en su prompt

## Ejecutar

```
node scripts/clarify-sprints.js
```

Modo automático:

```
node scripts/clarify-sprints.js --answers-file planning/clarifications/sprints-answers.json
```

## Resultado

- `planning/clarifications/sprints.json` creado con preguntas + respuestas + metadata

**Estructura del JSON con metadata:**

```json
{
  "generated_by_model": "[IDE_AGENT_MODEL]",
  "generated_at": "[ISO_TIMESTAMP]",
  "agent_roles": "[ROL_APLICADO]",
  "vision_command": "clarify_sprints",
  "source_spec_kit": "spec-kit/input/",
  "questions": [...],
  "answers": {...}
}
```

- `generate_sprints` usará esas respuestas como contexto de planificación
