# Workflow: Spec Kit → Sprint ejecutable

Los comandos de este flujo se escriben en la ventana de agente del IDE.
Ver `AGENTS.md` para instrucciones detalladas de cada comando.

---

## Entradas obligatorias

- Al menos 1 refdoc en `refdocs/`.
- Si reverse engineering = `yes`: al menos 1 archivo en `source-code/`.

---

## Flujo completo

### 1. Inicialización

```
init
```

Configura el estado del proyecto. Pregunta si es reverse engineering y ofrece
descargar Spec Kit ([github/spec-kit](https://github.com/github/spec-kit)) y
Agency Agents ([msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents)).

---

### 2. Brief

> El agente invoca `clarify_brief` si los refdocs tienen ambigüedades.
> La IA lee los refdocs y genera preguntas contextuales al proyecto.

```
generate_brief
```

Lee los refdocs y las respuestas de clarificación. Genera `spec-kit/input/brief.md`.

*(Ya no hay comando `approve_brief`.)* Revisa o edita `spec-kit/input/brief.md` si hace falta; **`generate_spec_kit`** desbloquea el Spec Kit y registra la aprobación implícita del brief en el workflow.

---

### 4. Spec Kit

> El agente invoca `clarify_spec_kit` si el brief tiene ambigüedades técnicas o de producto.

```
generate_spec_kit
```

Genera en `spec-kit/input/`:

| Artefacto | Descripción |
|---|---|
| `PRD.md` | Casos de uso, flujos, métricas |
| `technical-spec.md` | Stack, arquitectura, decisiones |
| `api-spec.yaml` | Endpoints y contratos de API |
| `data-model.md` | Modelo de datos |
| `epics.md` | Épicas del producto |
| `stories.md` | User stories con criterios de aceptación |
| `sprint-plan.md` | Distribución de stories por sprint |
| `test-plan.md` | Estrategia QA por capa |

*(Ya no hay comando `approve_spec_kit`.)* Revisa los 8 artefactos si hace falta; **`generate_sprints`** registra la aprobación implícita del spec en el workflow.

---

### 5. Sprints

> El agente invoca `clarify_sprints` si el Spec Kit tiene ambigüedades de planificación.

```
generate_sprints
```

Genera carpetas en `planning/sprints/sprint-XX/` con goal, stories, tasks y qa-plan, y deja el plan **aprobado** en el workflow. `approve_sprints_plan` es opcional (re-registro manual).

---

### 6. Ejecución por sprint

> El agente invoca `clarify_sprint --sprint N` si el plan del sprint tiene ambigüedades de ejecución.

```
start_sprint --sprint 1
```

**Desarrolla** el sprint: implementación en código según `tasks.md`, roles en `agent-roles.json` y `agency-agents/agents/`. Para `start_sprint --sprint N` con N>1, el sprint N-1 debe tener todas las tareas con Status `done` en `tasks.md`.

Al terminar el sprint (todas las tareas `done` en `tasks.md`), el siguiente **`start_sprint --sprint N+1`** registra el cierre del sprint anterior y abre el siguiente.

---

### Navegación automática

```
next_step
```

Determina y ejecuta la siguiente acción disponible. Útil cuando no sabes en qué etapa estás.

---

## Regla de trazabilidad

Cada tarea de sprint debe trazar:

- Story origen (`stories.md`)
- Epic origen (`epics.md`)
- Criterio de aceptación (`PRD.md`)
- Cobertura de prueba (`test-plan.md`)
- Estado local en `planning/workflow-state.json`

---

## Validación y generación en matriz (opcional)

Solo después de autorización explícita:

```powershell
npm run connect_project -- --project-id "<PROJECT_ID>" --workspace-id "<WORKSPACE_ID>" --matrix-url "http://localhost:4000"
npm run matrix:authorize -- --authorized-by "<tu-nombre>"
npm run brief:validate
```
