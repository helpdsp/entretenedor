---
name: clarify_brief
description: El agente lo invoca cuando los refdocs tienen ambigüedades antes de generate_brief. La IA lee los refdocs y genera preguntas contextuales (incl. UX) y se anexan preguntas UX fijas opcionales desde config.
preconditions: al menos 1 archivo en refdocs/
triggered_by: agent (when refdocs are ambiguous), or user explicitly
next: generate_brief
---

## Cuándo invocar este comando

**No es un paso obligatorio del flujo principal.**

Invócalo cuando:
- Los refdocs son ambiguos, incompletos o contradictorios
- No está claro el objetivo de negocio, la audiencia o el alcance
- Hay dudas sobre si el proyecto es reverse engineering o nuevo
- El usuario no especificó preferencias de tono o alcance del brief
- Quieres **decisiones de UX con opciones** (theming/skins, responsive, estilo visual, densidad de UI, accesibilidad) antes del brief

Si los refdocs son claros y completos, puedes ejecutar `generate_brief` directamente.

## Qué hace

1. Lee todos los archivos en `refdocs/`
2. Llama al AI (`LOCAL_IDE_AI_COMMAND`) con los documentos como contexto
3. El AI genera 4-6 preguntas específicas al proyecto (no genéricas), incluyendo **al menos una dimensión de experiencia de usuario / interfaz** cuando aplique (theming, dispositivos, estilo, densidad, accesibilidad)
4. **Concatena** preguntas UX fijas definidas en `config/ux-clarification.json` (ids que ya existan en las preguntas de la IA no se duplican). Así se cubren de forma estable temas como skins o claro/oscuro, responsive vs escritorio, estilo visual, complejidad de UI y objetivo a11y
5. Presenta todas las preguntas al usuario de forma interactiva (número de opción o respuesta libre con `0`)
6. Guarda las respuestas en `planning/clarifications/brief.json`
7. `generate_brief` lee ese archivo e incluye las respuestas en su prompt

### Personalizar las preguntas UX fijas

Edita `config/ux-clarification.json`: array de objetos `{ "id", "prompt", "options" }`. Si el archivo falta o es inválido, se usan valores por defecto embebidos en `scripts/lib/fixed-ux-questions.js`.

## Ejecutar

```
node scripts/clarify-brief.js
```

Modo automático (respuestas ya conocidas):

```
node scripts/clarify-brief.js --answers-file planning/clarifications/brief-answers.json
```

## Resultado

- `planning/clarifications/brief.json` creado con preguntas + respuestas
- `generate_brief` usará esas respuestas como contexto adicional para la IA

## Después del brief

Para refinar implementación UI en el Spec Kit, usa `clarify_spec_kit` si hace falta; `generate_spec_kit` (modo local) incorpora `planning/clarifications/spec_kit.json` en la generación del PRD, historias y planes de prueba.
