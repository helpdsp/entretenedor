# Spec Kit

Templates oficiales de especificación, descargados desde [github/spec-kit](https://github.com/github/spec-kit).

## Estructura

```
spec-kit/
  input/          ← artefactos generados del proyecto (brief, PRD, specs...)
  templates/      ← templates copiados desde upstream (tracked en git)
    commands/     ← prompts de agente: /specify, /plan, /implement, /analyze...
    *.md          ← plantillas de documentos
  upstream/       ← clon local de github/spec-kit (gitignored)
  upstream.json   ← sha y fecha de la última actualización
```

## Actualizar

Desde la ventana de agente del IDE:

```
update_spec_kit
```

O desde terminal:

```powershell
node scripts/update-spec-kit.js
# o
npm run update_spec_kit
```

El `init` pregunta automáticamente si quieres descargar o actualizar.

## Artefactos en input/

`generate_spec_kit` genera estos archivos en `spec-kit/input/`:

| Archivo | Contenido |
|---|---|
| `PRD.md` | Casos de uso, flujos del producto, métricas |
| `technical-spec.md` | Stack recomendado, arquitectura, decisiones |
| `api-spec.yaml` | Definición de endpoints y contratos |
| `data-model.md` | Modelo de datos y relaciones |
| `epics.md` | Épicas del producto |
| `stories.md` | User stories con criterios de aceptación |
| `sprint-plan.md` | Distribución de stories por sprint |
| `test-plan.md` | Estrategia QA por capa |

Todos los artefactos deben estar presentes antes de `generate_sprints` (la aprobación del spec queda implícita al completar ese comando).

## Comandos de agente relacionados

```
generate_spec_kit    ← genera los 8 artefactos (brief ya “aprobado” vía generate_spec_kit en el workflow)
generate_sprints     ← plan de sprints; marca el spec como aprobado en el estado del workflow
```
