---
name: generate_brief
description: Genera el brief del proyecto a partir de los refdocs disponibles (y source-code si es reverse engineering).
preconditions: al menos 1 archivo en refdocs/
next: generate_spec_kit
---

## Instrucciones

El brief lo redacta **el agente** (tú) leyendo directamente los archivos de `refdocs/` y `source-code/`.
El script `node scripts/generate-brief.js` **solo registra el estado** del workflow cuando se usa el flag
`--agent-written`; no genera contenido por sí mismo en modo local.

---

### Paso 1 — Verificar precondiciones y leer el estado del proyecto

Lee `planning/workflow-state.json` para conocer:
- `setup.reverseEngineering` (true/false)
- `setup.referencesDir` (default: `refdocs`)
- `setup.sourceDir` (default: `source-code`)

Si `reverseEngineering` es `null`, bloquear: pedir al usuario que ejecute
`init --reverse-engineering yes` o `init --reverse-engineering no`.

---

### Paso 2 — Evaluar si se necesita clarificación

Lista los archivos en `refdocs/`. Lee al menos el primero para evaluar claridad.
Si detectas ambigüedades críticas (objetivo de negocio poco claro, audiencia no definida,
scope contradictorio), invoca primero:

```
clarify_brief
```

Si los refdocs son suficientemente claros, continúa al Paso 3.

---

### Paso 3 — Leer todos los archivos de entrada

**Lee el contenido completo** de cada archivo (no solo listarlos):

1. **Todos los archivos en `refdocs/`** (`.md`, `.txt`, `.json`, `.yaml`).
   - Excluir: `brief.md`, `brief-validation.json`.

2. **Si `reverseEngineering === true`**: leer también **todos los archivos en `source-code/`**
   (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.java`, `.cs`, `.go`, `.rs`, etc.).
   - Para proyectos grandes: priorizar archivos de entrada (index, main, app, routes, models, services).

3. **Si existe `planning/clarifications/brief.json`**: leerlo e incorporar las respuestas
   como contexto adicional.

---

### Paso 4 — Escribir el brief

Crea o sobreescribe `spec-kit/input/brief.md` con un brief ejecutivo de alta calidad basado
en el contenido leído. El brief debe tener **estas secciones obligatorias**:

```markdown
# Brief — [Nombre del Proyecto]

## Executive Summary
[2-3 párrafos: qué es el proyecto, para quién, qué problema resuelve, cuál es la propuesta de valor.]

## Context
[Contexto de negocio: por qué existe este proyecto, situación actual, motivación.]

## Goals
[Objetivos concretos y medibles del proyecto. Usar bullets.]

## Target Users / Roles
[Quiénes usan el sistema, qué rol tiene cada uno, qué necesitan.]

## Scope — In
[Funcionalidades y módulos que SÍ están incluidos en este proyecto.]

## Scope — Out / Non-goals
[Qué queda explícitamente fuera del alcance inicial.]

## Functional Requirements Summary
[Resumen de los requisitos funcionales clave, agrupados por épica si aplica.
 Si hay IDs (RF-XX), mencionarlos. Para reverse engineering: describir el comportamiento actual
 inferido del código fuente.]

## Technical Stack & Constraints
[Stack tecnológico, integraciones, restricciones no funcionales (performance, seguridad, etc.).]

## Success Criteria
[Cómo se mide el éxito. Criterios de aceptación de alto nivel.]

## Open Questions / Risks
[Puntos ambiguos, decisiones pendientes, riesgos identificados.]

## Input Sources
- refdocs: [lista de archivos leídos]
- source-code: [lista de archivos leídos, si aplica]
```

**Reglas de calidad:**
- El brief debe tener suficiente detalle para que `generate_spec_kit` pueda producir los 8 artefactos
  (PRD, technical-spec, api-spec, data-model, epics, stories, sprint-plan, test-plan).
- No copiar bloques enteros de los refdocs — sintetizar y estructurar.
- En modo **reverse engineering**: describir el sistema existente (arquitectura, módulos, entidades,
  flujos principales) como "estado actual" y dejar espacio para objetivos de refactoring/extensión.
- Longitud mínima recomendada: 400 palabras. No hay máximo, pero priorizar precisión sobre extensión.

---

### Paso 5 — Registrar estado del workflow

Una vez escrito `spec-kit/input/brief.md`, ejecuta el script con el flag `--agent-written`
para registrar el evento en el workflow **sin sobreescribir** el archivo:

```bash
node scripts/generate-brief.js --agent-written
```

Si el script falla con un error de precondiciones (e.g., `reverse_engineering_not_defined`),
resuelve el bloqueante antes de continuar.

---

### Paso 6 — Verificar y reportar

1. Confirma que `spec-kit/input/brief.md` fue creado y tiene contenido.
2. Muestra un **resumen del brief** al usuario (Executive Summary + Goals + Scope).
3. Pregunta si quiere editar algo antes de continuar.

Siguiente acción: `generate_spec_kit`
(la aprobación del brief queda implícita al generar el Spec Kit)
