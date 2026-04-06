---
description: VISION — generate_spec_kit (generar 8 artefactos de especificación)
---

Genera los artefactos del Spec Kit a partir del brief; al completar, marca el brief como aprobado en el workflow.

## Instrucciones

1. Verifica que `spec-kit/input/brief.md` existe (tras `generate_brief`; puedes editarlo antes de ejecutar este comando)
2. Ejecuta: `node scripts/generate-spec-kit.js --mode local --brief spec-kit/input/brief.md`
3. Verifica que los siguientes archivos fueron creados en `spec-kit/input/`:
   - `PRD.md`, `technical-spec.md`, `api-spec.yaml`, `data-model.md`
   - `epics.md`, `stories.md`, `sprint-plan.md`, `test-plan.md`
4. Muestra resumen de lo generado

**Siguiente acción:** `generate_sprints` (revisa o edita los artefactos del Spec Kit antes; la aprobación del spec queda implícita al ejecutar `generate_sprints`)
