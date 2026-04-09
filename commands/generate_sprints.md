---
name: generate_sprints
description: Genera el plan completo de sprints a partir del Spec Kit generado; al completar marca el spec como aprobado en el workflow (aprobación implícita).
preconditions: `generate_spec_kit` ejecutado; 8 artefactos en `spec-kit/input/`
next: start_sprint --sprint 1
---

## Instrucciones

### Paso 1 — Evaluar si se necesita clarificación

Lee `spec-kit/input/epics.md` y `stories.md`. Si las historias son ambiguas,
la priorización no es clara o el número de sprints no está definido, invoca primero:

```
clarify_sprints
```

Si el Spec Kit es claro y el plan de sprints está bien definido, continúa directamente al Paso 2.

### Paso 2 — Verificar precondiciones

- [ ] Los 8 artefactos del Spec Kit están presentes en `spec-kit/input/`
- [ ] Al ejecutar este comando con éxito, el estado del workflow marca `spec.approved` (no hace falta un paso de aprobación aparte)

### Paso 3 — Ejecutar

```
node scripts/plan-all-sprints.js --mode local
```

Si `planning/clarifications/sprints.json` existe, el script lo usa como contexto adicional
para la planificación.

### Paso 4 — Verificar y reportar

Confirma que se crearon carpetas en `planning/sprints/sprint-XX/`.
Muestra al usuario: número de sprints, goals, total de stories y tareas.

**Metadata obligatoria en cada archivo de sprint:**
Todos los archivos generados (`sprint-goal.md`, `stories.md`, `tasks.md`, `qa-plan.md`)
deben incluir al inicio un bloque YAML frontmatter con:

- `generated_by_model`: Modelo de IA usado
- `generated_at`: Timestamp ISO 8601
- `agent_roles`: Roles de Agency Agents aplicados
- `vision_command`: "generate_sprints"
- `sprint_number`: Número del sprint (ej: 1, 2, 3)
- `source_spec_kit`: Ruta a los artefactos del spec kit (ej: "spec-kit/input/")

**Formato de tasks.md mejorado:** Las tareas ahora incluyen contexto arquitectónico:

- **RF**: Requisito Funcional del PRD (ej: RF-08)
- **Component**: Componente/página específico (ej: TrackDetailPage, NodeGraph)
- **Route**: Ruta del PRD §6.4 (ej: /tracks/:trackId, /dashboard) o "—" si es componente interno
- **Location**: Ruta sugerida del archivo (ej: src/pages/TrackDetailPage.tsx)

Si el script reporta warnings sobre tareas sin contexto arquitectónico, revisa `sprint-plan.md`
y el PRD §6.4 para asegurar que cada tarea frontend/backend tenga RF, component, y route definidos.

Siguiente acción: `start_sprint --sprint 1`
