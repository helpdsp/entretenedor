---
description: VISION — generate_skills (exportar comandos a skills Antigravity / Claude Code global)
---

Exporta los comandos VISION como skills instalables para Antigravity o Claude Code global.

## Instrucciones

### Paso 1 — Preguntar destino

Pregunta al usuario qué destino desea:
- `antigravity` → instala skills en `~/.gemini/antigravity/skills/`
- `claude-code` → instala skills en `~/.claude/commands/`

### Paso 2 — Ejecutar

```bash
# Para Antigravity
node scripts/generate-skills.js --tool antigravity

# Para Claude Code global
node scripts/generate-skills.js --tool claude-code
```

Para preview sin instalar:
```bash
node scripts/generate-skills.js --dry-run
```

### Paso 3 — Reportar

Informa cuántos skills se generaron y la ruta de instalación.

**Referencia completa:** Ver `AGENTS.md` sección `generate_skills`.
