# `.claude/` — Claude Code

Archivos consumidos por [Claude Code](https://code.claude.com/docs/en/claude-directory) en este proyecto.

| Ruta | Rol |
|------|-----|
| `../CLAUDE.md` | Memoria de proyecto (sesión): visión VISION y punteros |
| `rules/vision-workflow.md` | Regla alineada con `.cursor/rules/vision-index.mdc` |
| `commands/*.md` | Prompts por comando; equivalen a escribir el nombre del comando en el chat |

La **fuente única de verdad** de pasos y scripts sigue siendo `commands/<nombre>.md` en la raíz del repo.

Para instalar skills en el directorio global de usuario (`~/.claude/agents/`): `node scripts/generate-skills.js --tool claude-code` (ver `AGENTS.md`).
