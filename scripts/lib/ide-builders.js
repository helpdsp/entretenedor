#!/usr/bin/env node

/**
 * ide-builders.js
 *
 * Shared IDE builder functions for generating IDE configuration files.
 * Used by add-ide.js and generate-skills.js
 */

const fs = require('fs');
const path = require('path');

const AVAILABLE_IDES = [
  { id: 'cursor', name: 'Cursor', description: 'AI code editor' },
  { id: 'claude', name: 'Claude Code', description: 'Anthropic CLI' },
  { id: 'copilot', name: 'GitHub Copilot', description: 'VS Code extension' },
  { id: 'opencode', name: 'OpenCode', description: 'Open source AI tool' },
  { id: 'antigravity', name: 'Antigravity', description: 'Gemini agent' },
];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim();
  }
  return { meta, body: match[2] };
}

function getWorkspaceDir(root, ide) {
  const dirs = {
    cursor: path.join(root, '.cursor', 'rules'),
    claude: path.join(root, '.claude'),
    opencode: path.join(root, '.opencode', 'commands'),
    copilot: path.join(root, '.github'),
    antigravity: path.join(root, '.agents', 'workflows'),
  };
  return dirs[ide] || null;
}

function getAvailableIdes() {
  return AVAILABLE_IDES;
}

function isIdeSupported(ide) {
  return AVAILABLE_IDES.some((i) => i.id === ide);
}

function isIdeConfigured(root, ide) {
  const workspaceDir = getWorkspaceDir(root, ide);
  if (!workspaceDir) return false;
  return fs.existsSync(workspaceDir);
}

function buildCursorIndex(files, commandsDir) {
  let indexTable = '| Comando | Instrucciones |\n|---|---|\n';
  for (const file of files.sort()) {
    const name = path.basename(file, '.md');
    indexTable += `| \`${name}\` | \`commands/${file}\` |\n`;
  }

  const content = `---
description: VISION workflow commands — única regla Cursor; delega siempre a commands/.
alwaysApply: true
---

# VISION — Comandos del proyecto

Este proyecto usa el framework VISION. Cuando el usuario escribe un comando del flujo,
lee el archivo \`commands/<nombre>.md\` y sigue las instrucciones que contiene.

**Declaración de agente(s):** antes de cada actividad VISION o trabajo sustancial, abre con una línea \`**Agente(s):** ...\` según \`commands/agent_declaration.md\` (slugs de \`agency-agents/agents/\`).

## Flujo principal

\`\`\`
init → generate_brief → generate_spec_kit → generate_sprints
     → start_sprint --sprint N  (desarrollo; si N>1 cierra N-1 automáticamente al abrir N)
     → continue_sprint  (sprint activo con tareas pendientes; retomar tras pausa / next_step)
     → start_sprint --sprint N+1  (cuando el sprint actual tiene todas las tareas \`done\`)
\`\`\`

## Índice de comandos → archivos de instrucciones

${indexTable}

## Clarificaciones (opcionales si hay ambigüedad)

| Comando | Lee | Para |
|---|---|---|
| \`clarify_brief\` | \`refdocs/\` | \`generate_brief\` |
| \`clarify_spec_kit\` | \`spec-kit/input/brief.md\` | \`generate_spec_kit\` |
| \`clarify_sprints\` | \`spec-kit/input/*.md\` | \`generate_sprints\` |
| \`clarify_sprint --sprint N\` | \`planning/sprints/sprint-0N/\` | \`start_sprint --sprint N\` |

## Regla de operación

Cuando el usuario escribe cualquiera de estos comandos:
1. Lee \`commands/agent_declaration.md\` y declara **Agente(s):** en la primera línea de tu respuesta para esa actividad.
2. Lee el archivo \`commands/<nombre>.md\`
3. Sigue las instrucciones al pie de la letra
4. Reporta el resultado al usuario con la siguiente acción recomendada

### \`start_sprint\` / \`continue_sprint\` (obligación extra)

Si el comando es \`start_sprint\` / "start sprint" / equivalente: **no te limites a ejecutar el script**. En la **misma respuesta** debes **empezar el desarrollo** conforme \`planning/sprints/sprint-0N/\` y el spec (código o artefactos). Ver \`commands/start_sprint.md\` (contrato obligatorio e inferencia de N si el usuario no pasó \`--sprint\`).

Si el comando es \`continue_sprint\` / "retomar sprint": igual — **implementa en la misma respuesta**; el sprint ya está activo y suele quedar trabajo en \`tasks.md\`. Ver \`commands/continue_sprint.md\`.

El estado del flujo vive en \`planning/workflow-state.json\`.
Si no sabes en qué etapa estás, ejecuta \`node scripts/next-step.js\`.
`;

  return { filename: 'vision-index.mdc', content };
}

function buildClaudeWorkspace(files, commandsDir) {
  const results = [];

  // Generate command files
  for (const file of files) {
    const name = path.basename(file, '.md');
    const raw = fs.readFileSync(path.join(commandsDir, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const description = meta.description || `Comando VISION: ${name}`;

    const content = `---\nname: ${name}\ndescription: ${description}\n---\n\n${body.trim()}\n`;
    results.push({ type: 'command', filename: file, content });
  }

  // Generate rules file
  let indexTable = '| Comando del usuario | Instrucciones en |\n|---|---|\n';
  for (const file of files.sort()) {
    const name = path.basename(file, '.md');
    indexTable += `| \`${name}\` | \`commands/${file}\` |\n`;
  }

  const rulesContent = `---
description: VISION — comandos del proyecto; delegar siempre a commands/
---

# VISION — Comandos del proyecto

Este proyecto usa el framework VISION. Cuando el usuario escribe un comando del flujo (por texto o vía slash command en \`.claude/commands/\`), **lee el archivo \`commands/<nombre>.md\`** y sigue las instrucciones que contiene.

**Declaración de agente(s):** antes de cada actividad VISION o trabajo sustancial, abre con una línea \`**Agente(s):** ...\` según \`commands/agent_declaration.md\` (slugs de \`agency-agents/agents/\`).

## Flujo principal

\`\`\`
init → generate_brief → generate_spec_kit → generate_sprints
     → start_sprint --sprint N  (desarrollo; si N>1 cierra N-1 al iniciar N)
     → continue_sprint  (sprint activo con tareas pendientes)
\`\`\`

## Índice de comandos → archivos de instrucciones

${indexTable}

## Clarificaciones (opcionales si hay ambigüedad)

| Comando | Lee | Para |
|---|---|---|
| \`clarify_brief\` | \`refdocs/\` | \`generate_brief\` |
| \`clarify_spec_kit\` | \`spec-kit/input/brief.md\` | \`generate_spec_kit\` |
| \`clarify_sprints\` | \`spec-kit/input/*.md\` | \`generate_sprints\` |
| \`clarify_sprint --sprint N\` | \`planning/sprints/sprint-0N/\` | \`start_sprint --sprint N\` |

## Regla de operación

Cuando el usuario escribe cualquiera de estos comandos:

1. Lee \`commands/agent_declaration.md\` y declara **Agente(s):** en la primera línea de tu respuesta para esa actividad.
2. Lee el archivo \`commands/<nombre>.md\` (o el canon indicado arriba).
3. Sigue las instrucciones al pie de la letra.
4. Reporta el resultado al usuario con la siguiente acción recomendada.

**\`start_sprint\` / \`continue_sprint\`:** no solo el script — en la misma respuesta **implementa** según \`planning/sprints/sprint-0N/\` y el spec (\`commands/start_sprint.md\`, \`commands/continue_sprint.md\`).

El estado del flujo vive en \`planning/workflow-state.json\`.
Si no sabes en qué etapa estás, ejecuta \`node scripts/next-step.js\` o \`node scripts/status-report.js\`.
`;

  results.push({
    type: 'rule',
    filename: 'vision-workflow.md',
    content: rulesContent,
  });

  return results;
}

function buildOpenCodeCommands(files, commandsDir) {
  const results = [];

  for (const file of files) {
    const name = path.basename(file, '.md');
    const raw = fs.readFileSync(path.join(commandsDir, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const description = meta.description || `VISION — ${name}`;

    const content = `---\ndescription: ${description}\n---\n\n${body.trim()}\n`;
    results.push({ filename: file, content });
  }

  return results;
}

function buildCopilotInstructions(files, commandsDir) {
  let indexTable = '| Comando | Archivo de instrucciones |\n|---|---|\n';
  for (const file of files.sort()) {
    const name = path.basename(file, '.md');
    indexTable += `| \`${name}\` | \`commands/${file}\` |\n`;
  }

  const content = `# GitHub Copilot Instructions — VISION Project

Este proyecto usa el framework VISION para gestión de proyectos con agentes de IA.
Los comandos del flujo se definen en \`commands/\` — un archivo \`.md\` por comando.

## Declaración de agente(s)

Antes de ejecutar cualquier comando o actividad sustancial, el agente debe abrir la respuesta con una línea \`**Agente(s):** ...\` usando los slugs de Agency Agents. Ver \`commands/agent_declaration.md\`.

## Cómo interpretar comandos del usuario

Cuando el usuario escribe un nombre de comando (ej. \`generate_brief\`, \`start_sprint --sprint 1\`),
lee el archivo \`commands/<nombre_comando>.md\` y sigue las instrucciones que contiene.

## Comandos disponibles

${indexTable}

## Flujo de secuencia

\`\`\`
init → generate_brief → generate_spec_kit → generate_sprints
     → start_sprint --sprint N → …
\`\`\`
(\`start_sprint\` = desarrollar el sprint **en la misma respuesta** con código; \`\`\`\`continue_sprint\`\`\`\` retoma el sprint activo con tareas pendientes; el siguiente \`start_sprint\` cierra el sprint previo al abrir el siguiente; \`generate_sprints\` ya aprueba el plan. Ver \`commands/start_sprint.md\` y \`commands/continue_sprint.md\`.)

Los comandos \`clarify_*\` son opcionales y los invoca el agente cuando detecta ambigüedades:
- \`clarify_brief\` antes de \`generate_brief\` (si los refdocs son ambiguos)
- \`clarify_spec_kit\` antes de \`generate_spec_kit\` (si el brief es ambiguo)
- \`clarify_sprints\` antes de \`generate_sprints\` (si el spec kit es ambiguo)
- \`clarify_sprint --sprint N\` antes de \`start_sprint\` (si el sprint tiene dudas)

Si el usuario no sabe qué sigue, ejecuta \`next_step\`.

## Referencias

- Roles de agente: \`agent-roles.json\` + \`agency-agents/agents/\`
- Artefactos del Spec Kit: \`spec-kit/input/\`
- Estado del flujo: \`planning/workflow-state.json\`
`;

  return { filename: 'copilot-instructions.md', content };
}

function generateIdeFiles(root, ide, files, commandsDir, dryRun) {
  const workspaceDir = getWorkspaceDir(root, ide);
  if (!workspaceDir) {
    return { count: 0, ide, error: `IDE no soportado: ${ide}` };
  }

  let results = [];

  switch (ide) {
    case 'cursor':
      results = [buildCursorIndex(files, commandsDir)];
      break;
    case 'claude':
      results = buildClaudeWorkspace(files, commandsDir);
      break;
    case 'opencode':
      results = buildOpenCodeCommands(files, commandsDir);
      break;
    case 'copilot':
      results = [buildCopilotInstructions(files, commandsDir)];
      break;
    case 'antigravity':
      results = buildOpenCodeCommands(files, commandsDir);
      break;
    default:
      return { count: 0, ide };
  }

  const written = [];

  for (const item of results) {
    let destDir;
    if (ide === 'claude') {
      destDir =
        item.type === 'rule'
          ? path.join(workspaceDir, 'rules')
          : path.join(workspaceDir, 'commands');
    } else {
      destDir = workspaceDir;
    }

    const destFile = path.join(destDir, item.filename);

    if (dryRun) {
      written.push({ type: 'dry-run', file: destFile });
    } else {
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destFile, item.content, 'utf8');
      written.push({ type: 'created', file: destFile });
    }
  }

  return { count: written.length, ide, files: written, workspaceDir };
}

module.exports = {
  parseFrontmatter,
  getWorkspaceDir,
  getAvailableIdes,
  isIdeSupported,
  isIdeConfigured,
  buildCursorIndex,
  buildClaudeWorkspace,
  buildOpenCodeCommands,
  buildCopilotInstructions,
  generateIdeFiles,
};
