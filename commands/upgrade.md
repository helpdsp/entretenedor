---
name: upgrade
description: Refresh IDE configurations for all configured IDEs. Auto-detects which IDEs are set up and re-generates their framework files with latest commands.
preconditions: VISION project with at least one IDE configured
next: none (standalone utility)
---

## Instrucciones

### Propósito

`upgrade` actualiza las configuraciones de IDE existentes cuando los comandos del framework cambian. Úsalo cuando:

- Se agregan nuevos comandos a `commands/`
- Se actualizan descripciones o instrucciones de comandos existentes
- Quieres asegurar que todas las configuraciones de IDE estén sincronizadas
- El framework se actualizó y hay nuevas funcionalidades

### Paso 1 — Ver qué IDEs serían refrescados (opcional)

Para ver qué IDEs están configurados y serían actualizados:

```bash
./bin/upgrade --list
```

Esto muestra:
- ✓ IDEs configurados (serán refrescados)
- ✗ IDEs no configurados (no hace nada con ellos)

### Paso 2 — Refrescar todas las configuraciones

```bash
./bin/upgrade
```

Este comando:
1. Detecta automáticamente qué IDEs tienen configuración existente
2. Re-genera todos los archivos de configuración con los comandos más recientes
3. Muestra un resumen de qué fue actualizado

#### Simular sin modificar archivos (dry-run):
```bash
./bin/upgrade --dry-run
```

Muestra qué IDEs serían refrescados sin modificar ningún archivo.

### Diferencia con `add_ide`

| Comando | Cuándo usar | Qué hace |
|---------|-------------|----------|
| `add_ide --ide X` | Necesitas agregar un IDE nuevo | Crea configuración para IDE X |
| `add_ide --all` | Quieres agregar TODOS los IDEs disponibles | Crea configuración para todos |
| `upgrade` | IDEs ya configurados, necesitas actualizarlos | Refresca solo los configurados |

### Ejemplo de uso típico

```bash
# Tu equipo usa Cursor y Claude
./bin/add_ide --ide cursor,claude

# Semanas después, se agregan nuevos comandos al framework
# Para actualizar ambas configuraciones:
./bin/upgrade
```

### Reportar resultado

El comando muestra:
- Qué IDEs fueron detectados como configurados
- Cuántos archivos fueron refrescados por cada IDE
- Resumen de éxitos / fallos

**Ejemplo de salida:**
```
Scanning for configured IDEs...
  ✓ Found: cursor, claude, copilot

Refreshing configurations:
  ✓ cursor - 1 files refreshed
    → .cursor/rules/vision-index.mdc
  ✓ claude - 16 files refreshed
    → .claude/commands/init.md
    → ...
  ✓ copilot - 1 files refreshed
    → .github/copilot-instructions.md

Summary:
  ✓ 3 IDE(s) refreshed with latest commands
```
