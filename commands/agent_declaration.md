---
name: agent_declaration
description: Meta-regla obligatoria — el agente debe declarar qué rol(es) de Agency Agents aplica al iniciar cada actividad VISION.
preconditions: ninguna (norma transversal)
next: (no aplica — documentación)
---

## Instrucciones para el agente del IDE

### Obligación

**Antes de ejecutar cualquier paso** de un comando VISION (`init`, `generate_brief`, `generate_spec_kit`, `generate_sprints`, `approve_sprints_plan`, `start_sprint`, `continue_sprint`, `next_step`, `reset_project`, `update_spec_kit`, `update_agency_agents`, `generate_skills`) **o** cualquier actividad sustancial en su nombre (correr scripts, editar `spec-kit/`, `planning/`, análisis multi-paso, clarificaciones `clarify_*`), el agente debe **abrir su respuesta con una sola línea** en este formato:

```markdown
**Agente(s):** `slug-1` + `slug-2` (breve motivo opcional)
```

- Usa los **slugs** de [Agency Agents](https://github.com/msitarzewski/agency-agents) tal como aparecen en `agency-agents/agents/` y en `agent-roles.json` (p. ej. `product-product-manager`, `engineering-software-architect`).
- Si aplicas un solo rol, usa solo un slug entre backticks.
- Si el IDE no expone subagentes y operas como asistente general, indica **`IDE Agent`** **más** el slug del rol que estás **simulando** para esa tarea (ej. `IDE Agent` + `product-product-manager`).
- Si la actividad cruza varias áreas, lista **todos** los roles relevantes (no más de 4 salvo excepción justificada).

### Tabla orientativa (comando → rol(es) sugerido(s))

| Actividad / comando | Rol(es) sugerido(s) |
|---|---|
| `init`, `reset_project` | `project-management-studio-operations-manager`, `engineering-devops-automator` |
| `clarify_brief` | `product-product-manager`, `design-ux-researcher` |
| `generate_brief` | `product-product-manager`, `engineering-technical-writer` |
| `clarify_spec_kit` | `engineering-software-architect`, `product-product-manager` |
| `generate_spec_kit` | `engineering-software-architect`, `engineering-backend-architect`, `engineering-frontend-developer`, `engineering-ai-engineer` (según alcance del spec) |
| `clarify_sprints` | `product-sprint-prioritizer`, `project-management-project-shepherd` |
| `generate_sprints` | `product-sprint-prioritizer`, `project-management-project-shepherd`, `engineering-technical-writer` |
| `approve_sprints_plan` (opcional) | `product-sprint-prioritizer`, `project-management-project-shepherd` |
| `clarify_sprint` | `project-management-senior-project-manager`, rol del área del sprint (`engineering-frontend-developer`, etc.) |
| `start_sprint` | `project-management-senior-project-manager` + `engineering-frontend-developer` / `engineering-backend-architect` según tasks — **obligatorio implementar código en la misma sesión**; el cierre del sprint anterior ocurre al ejecutar `start_sprint` del siguiente sprint (no hay `complete_sprint`) |
| `continue_sprint` | Igual que `start_sprint` — retoma sprint activo con tareas pendientes; **obligatorio implementar en la misma sesión** |
| `next_step` | `project-management-project-shepherd` |
| `update_spec_kit`, `update_agency_agents` | `engineering-devops-automator` |
| `generate_skills` | `engineering-devops-automator`, `engineering-technical-writer` |

La tabla es **orientativa**: ajusta los slugs al contenido real (por ejemplo, si el sprint es solo backend, prioriza `engineering-backend-architect`).

### Cuándo repetir la declaración

- **Nueva actividad** en el mismo hilo (nuevo comando del usuario o nuevo bloque de trabajo): **vuelve a declarar** al inicio de esa respuesta.
- **Misma actividad**, varios mensajes seguidos: no repitas en cada mensaje; basta la primera vez **para ese bloque**.

---

*Este archivo no es un comando que el usuario escriba en el chat; es la fuente de verdad para la norma de declaración de agentes.*
