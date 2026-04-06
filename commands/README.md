# commands/

Definiciones de comandos del flujo VISION, en formato IDE-agnóstico.

Cada archivo `.md` define un comando: precondiciones, pasos, script a ejecutar y output esperado.
Esta es la **fuente única de verdad** — todos los IDEs y tools leen desde aquí.

**Excepción:** `agent_declaration.md` es **meta-documentación** (norma de declaración de roles); el usuario no lo escribe como comando, pero el agente debe cumplirla en toda actividad VISION.

## Compatibilidad

| IDE / Tool | Cómo carga estos comandos |
|---|---|
| Cursor | `.cursor/rules/vision-index.mdc` (always-on) delega a estos archivos |
| Claude Code | `AGENTS.md` referencia estos archivos |
| GitHub Copilot | `.github/copilot-instructions.md` lista estos archivos |
| Antigravity | `generate_skills --tool antigravity` genera SKILL.md desde estos archivos |
| Gemini CLI / otros | Apuntar directamente a `commands/<nombre>.md` |

## Comandos disponibles

### Flujo principal

| Archivo | Comando | Fase |
|---|---|---|
| `init.md` | `init` | Setup |
| `generate_brief.md` | `generate_brief` | Brief |
| `generate_spec_kit.md` | `generate_spec_kit` | Spec |
| `generate_sprints.md` | `generate_sprints` | Sprints |
| `approve_sprints_plan.md` | `approve_sprints_plan` *(opcional)* | Sprints |
| `start_sprint.md` | `start_sprint --sprint N` | Ejecución |
| `continue_sprint.md` | `continue_sprint` | Ejecución (retomar sprint activo incompleto) |

### Clarificaciones (invocadas por el agente cuando detecta ambigüedades)

Las preguntas son generadas por la IA al vuelo leyendo el contexto del proyecto.

| Archivo | Comando | Lee | Informa a |
|---|---|---|---|
| `clarify_brief.md` | `clarify_brief` | `refdocs/` | `generate_brief` |
| `clarify_spec_kit.md` | `clarify_spec_kit` | `spec-kit/input/brief.md` | `generate_spec_kit` |
| `clarify_sprints.md` | `clarify_sprints` | `spec-kit/input/*.md` | `generate_sprints` |
| `clarify_sprint.md` | `clarify_sprint --sprint N` | `planning/sprints/sprint-0N/` | `start_sprint --sprint N` |

### Utilidades

| Archivo | Comando |
|---|---|
| `next_step.md` | `next_step` |
| `reset_project.md` | `reset_project` |
| `update_spec_kit.md` | `update_spec_kit` |
| `update_agency_agents.md` | `update_agency_agents` |

### Meta (normas transversales)

| Archivo | Uso |
|---|---|
| `agent_declaration.md` | Obligación del agente: línea `**Agente(s):**` + slugs Agency Agents al iniciar cada actividad; ver contenido del archivo. |

## Formato de cada archivo

```yaml
---
name: nombre_comando
description: Descripción en una línea.
preconditions: qué debe existir antes de ejecutar
args: --flag valor  (si aplica)
next: siguiente_comando
---

## Instrucciones
...pasos para el agente...
```

## Exportar como skills para Antigravity

```
node scripts/generate-skills.js --tool antigravity
```

Genera `SKILL.md` en `~/.gemini/antigravity/skills/vision-<comando>/`.
Activa con `@vision-generate-brief`, `@vision-start-sprint`, etc.
