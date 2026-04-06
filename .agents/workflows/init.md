---
name: init
description: Inicializa el proyecto VISION. Configura el estado, pregunta si es reverse engineering, y ofrece descargar Spec Kit y Agency Agents.
preconditions: ninguna
next: generate_brief
---

## Instrucciones

### Paso 1 — Preguntar al usuario (si no lo indicó en su mensaje)

Antes de ejecutar el script, recopila estas respuestas:

1. **¿Es reverse engineering?** (¿el proyecto parte de código existente?)
   - `yes` → requerirá archivos en `source-code/`
   - `no` → solo necesita refdocs

2. **¿Descargar/actualizar Spec Kit?** (`yes|no`)
   - Solo si git está disponible en el sistema

3. **¿Descargar/actualizar Agency Agents?** (`yes|no`)
   - Solo si git está disponible en el sistema

Si el usuario no respondió, pregunta una por una antes de ejecutar el script.

### Paso 2 — Ejecutar con los flags correctos

**Siempre pasa los flags** para evitar prompts interactivos del script
(los agentes de IDE no son terminales TTY):

```bash
node scripts/init-project.js --reverse-engineering yes|no --update-spec-kit yes|no --update-agency-agents yes|no
```

Ejemplos:
```bash
# Proyecto nuevo, sin reverse engineering, sin descargas
node scripts/init-project.js --reverse-engineering no --update-spec-kit no --update-agency-agents no

# Reverse engineering, actualizar todo
node scripts/init-project.js --reverse-engineering yes --update-spec-kit yes --update-agency-agents yes
```

Si el usuario solo escribe `init` sin aclarar reverse engineering, pregunta antes de ejecutar.

### Paso 3 — Reportar resultado

Muestra al usuario:
- Modo de proyecto: reverse engineering `yes|no`
- Estado del workflow: `created`
- Siguiente acción recomendada

**Siguiente acción:** `generate_brief`
(asegúrate de que hay archivos en `refdocs/` antes de continuar;
 y en `source-code/` si es reverse engineering)
