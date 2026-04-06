---
name: generate_spec_kit
description: Genera los 8 artefactos del Spec Kit a partir del brief y del PRD de producto consolidado. Al completar, marca el brief como aprobado en el workflow (aprobación implícita).
preconditions: `generate_brief` ejecutado y `spec-kit/input/brief.md` con contenido; PRD de producto disponible (ver Paso 2)
next: generate_sprints
---

## Instrucciones

### IA local = agente del IDE (Cursor, Claude Code, etc.)

En VISION, **la IA local no es obligatoriamente un comando en `.env`**. Quien redacta y enriquece el Spec Kit con criterio es el **agente** que ejecuta este comando en el chat del IDE: lee el brief y el PRD, puede correr el script como apoyo y **completa o sustituye** artefactos en `spec-kit/input/` cuando haga falta.

`LOCAL_IDE_AI_COMMAND` en `.env` es **opcional**: solo automatiza un CLI que lea/escriba JSON (`{{INPUT_FILE}}` / `{{OUTPUT_FILE}}`). Si no existe, el script usa **fallback** determinístico; eso no significa que falte IA local si el agente ya está actuando.

### Paso 1 — Evaluar si se necesita clarificación

Lee `spec-kit/input/brief.md` y el **PRD de producto** (ruta resuelta en Paso 2). Si hay ambigüedades que impiden generar
artefactos concretos (stack no definido, integraciones no claras, reglas de negocio contradictorias),
invoca primero:

```
clarify_spec_kit
```

Si ambos insumos son claros, continúa directamente al Paso 2.

### Paso 2 — Verificar precondiciones

- [ ] `spec-kit/input/brief.md` existe (tras `generate_brief`; puedes editarlo antes de este paso)
- [ ] Al ejecutar este comando con éxito, el estado del workflow marca `brief.approved` (no hace falta un paso de aprobación aparte)
- [ ] **PRD de producto** disponible para el script, en este orden de resolución:
  1. Ruta explícita: `--product-prd <archivo>`
  2. `spec-kit/input/product-prd.md` si existe
  3. Primer archivo en `refdocs/` cuyo nombre (minúsculas) contenga `prd` y termine en `.md` o `.txt`

Los insumos en `refdocs/` pueden ser heterogéneos (varios docs, notas de audio transcritas, descripciones de imágenes, etc.); deben **consolidarse** en un PRD de producto coherente antes o como `product-prd.md`. Si no hay PRD resuelto, el script avisa y genera solo a partir del brief (modo degradado).

### Paso 3 — Ejecutar

```
node scripts/generate-spec-kit.js --mode local --brief spec-kit/input/brief.md
```

Opcional: ` --product-prd refdocs/mi-PRD.md`

Si `planning/clarifications/spec_kit.json` existe, el script lo usa como contexto adicional.

**Fallback del script (`LOCAL_IDE_AI_COMMAND` ausente o error):** el Node sigue generando los 8 artefactos. Si el PRD incluye `### RF-XX — …`, **stories.md** recibe una historia por RF, etc. Para texto más narrativo o decisiones de arquitectura, el **agente del IDE** debe revisar y editar esos archivos (eso cuenta como IA local). Opcionalmente puedes configurar `LOCAL_IDE_AI_COMMAND` para un CLI de JSON.

### Paso 4 — Verificar artefactos

Confirma que existen en `spec-kit/input/`:
`PRD.md`, `technical-spec.md`, `api-spec.yaml`, `data-model.md`,
`epics.md`, `stories.md`, `sprint-plan.md`, `test-plan.md`

### Paso 5 — Reportar

Muestra al usuario un resumen: épicas encontradas, número de stories, alcance estimado.

Siguiente acción: `generate_sprints` (revisa artefactos antes; la aprobación del spec queda implícita al completar `generate_sprints`)
