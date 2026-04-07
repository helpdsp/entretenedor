---
name: add_ide
description: Add IDE support to an existing VISION project. Generates IDE configuration files for Cursor, Claude, Copilot, OpenCode, or Antigravity.
preconditions: VISION project initialized with commands/ directory
next: none (standalone utility)
---

## Instrucciones

### Propósito

`add_ide` permite agregar soporte para nuevos IDEs a un proyecto VISION existente. Úsalo cuando:

- Inicializaste el proyecto sin configurar un IDE específico
- Quieres agregar soporte para un IDE adicional (ej. el equipo usa Cursor y Claude)
- Necesitas regenerar los archivos de configuración de un IDE

### Paso 1 — Listar IDEs disponibles (opcional)

Para ver qué IDEs están disponibles y cuáles ya están configurados:

```bash
./bin/add_ide --list
```

Esto muestra:
- ✓ IDEs ya configurados (con ruta)
- ✗ IDEs no configurados (con ruta propuesta)

### Paso 2 — Agregar IDE(s)

#### Agregar un solo IDE:
```bash
./bin/add_ide --ide cursor
```

#### Agregar múltiples IDEs (forma 1 - separados por coma):
```bash
./bin/add_ide --ide cursor,claude
```

#### Agregar múltiples IDEs (forma 2 - múltiples flags):
```bash
./bin/add_ide --ide cursor --ide claude
```

#### Agregar todos los IDEs disponibles:
```bash
./bin/add_ide --all
```

### Paso 3 — Opciones adicionales

#### Simular sin crear archivos (dry-run):
```bash
./bin/add_ide --ide cursor --dry-run
```

#### Sobrescribir configuración existente:
```bash
./bin/add_ide --ide cursor --force
```

### IDEs soportados

| IDE | Archivos generados | Ubicación |
|-----|-------------------|-----------|
| `cursor` | `vision-index.mdc` | `.cursor/rules/` |
| `claude` | Per-command `.md` + `vision-workflow.md` | `.claude/commands/` + `.claude/rules/` |
| `copilot` | `copilot-instructions.md` | `.github/` |
| `opencode` | Per-command `.md` | `.opencode/commands/` |
| `antigravity` | Per-command `.md` | `.agents/workflows/` |

### Comportamiento por defecto

- **Si el IDE ya está configurado:** Se omite (a menos que uses `--force`)
- **Dry-run:** Muestra qué archivos se crearían sin escribirlos
- **Sin argumentos:** Muestra ayuda

### Reportar resultado

Muestra al usuario:
- Cuántos archivos se crearon (o se crearían en dry-run)
- Rutas de los archivos generados
- Resumen de éxitos / omisiones / errores

**Ejemplo de salida:**
```
✓ cursor - 1 files created
  → .cursor/rules/vision-index.mdc
✓ claude - 16 files created
  → .claude/commands/init.md
  → .claude/commands/generate_brief.md
  ...
  → .claude/rules/vision-workflow.md

Summary:
  ✓ 2 IDE(s) added
```
