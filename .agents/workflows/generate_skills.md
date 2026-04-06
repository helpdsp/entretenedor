---
description: VISION — generate_skills (exportar comandos a skills Antigravity / Claude Code global)
---

Este comando no tiene `commands/generate_skills.md`; sigue **`AGENTS.md`** sección `generate_skills`.

1. Lee `commands/agent_declaration.md` y declara **Agente(s):** en la primera línea de tu respuesta.
2. Pregunta al usuario qué destino desea: `antigravity` o `claude-code` (u otro según `AGENTS.md`).
3. Ejecuta desde la raíz del proyecto: `node scripts/generate-skills.js --tool <herramienta>` (ver flags en `AGENTS.md`).
4. Informa cuántos skills se generaron y la ruta de instalación.
