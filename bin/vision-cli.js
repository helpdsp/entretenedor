#!/usr/bin/env node

/**
 * vision-cli.js
 *
 * NPX CLI for @nexus360/vision-framework
 *
 * Usage:
 *   npx @nexus360/vision-framework init [project-name]
 *   npx @nexus360/vision-framework init  # Uses current directory
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const readline = require('readline');
const os = require('os');

const CLI_VERSION = require('../package.json').version;

const AVAILABLE_IDES = [
  { id: 'cursor', name: 'Cursor', description: 'AI code editor' },
  { id: 'claude', name: 'Claude Code', description: 'Anthropic CLI' },
  { id: 'copilot', name: 'GitHub Copilot', description: 'VS Code extension' },
  { id: 'opencode', name: 'OpenCode', description: 'Open source AI tool' },
  { id: 'antigravity', name: 'Antigravity', description: 'Gemini agent' },
];

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function createReadline() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function askMultipleChoice(question, options) {
  const rl = createReadline();
  console.log(`\n${c.bold}${question}${c.reset}`);
  console.log(`${c.dim}Enter numbers separated by commas (e.g., 1,3) or "all"${c.reset}\n`);

  options.forEach((opt, index) => {
    console.log(
      `  ${c.cyan}${index + 1}.${c.reset} ${opt.name} ${c.dim}- ${opt.description}${c.reset}`,
    );
  });
  console.log(`  ${c.cyan}a.${c.reset} All of the above`);
  console.log(`  ${c.cyan}n.${c.reset} Skip IDE setup`);
  console.log('');

  const answer = await askQuestion(rl, `${c.cyan}?${c.reset} Selection: `);
  rl.close();

  const normalized = answer.trim().toLowerCase();
  if (normalized === 'a' || normalized === 'all') return options.map((o) => o.id);
  if (normalized === 'n' || normalized === 'none' || normalized === '') return [];

  return normalized
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= options.length)
    .map((i) => options[i - 1].id);
}

async function askYesNo(question, defaultValue = true) {
  const rl = createReadline();
  const prompt = defaultValue ? `${question} [Y/n] ` : `${question} [y/N] `;
  const answer = await askQuestion(rl, `${c.cyan}?${c.reset} ${prompt}`);
  rl.close();

  const normalized = answer.trim().toLowerCase();
  if (['yes', 'y', '1', 'true', 'si'].includes(normalized)) return true;
  if (['no', 'n', '0', 'false'].includes(normalized)) return false;
  return defaultValue;
}

function getPackageRoot() {
  return path.resolve(__dirname, '..');
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function transformPackageJson(content, projectName) {
  const pkg = JSON.parse(content);
  delete pkg.bin;
  pkg.name = projectName;
  pkg.private = true;
  pkg.version = '0.1.0';
  delete pkg.devDependencies;
  [
    'check:scripts',
    'test:local',
    'test:coverage',
    'lint',
    'format',
    'format:check',
    'package:zip',
  ].forEach((s) => delete pkg.scripts[s]);
  return JSON.stringify(pkg, null, 2);
}

function transformReadme(content, projectName) {
  return content.replace(/# \*\*PROJECT_NAME\*\*/g, `# **${projectName}**`);
}

async function scaffoldProject(targetDir, projectName) {
  const root = getPackageRoot();

  const dirs = [
    'commands',
    'scripts',
    'scripts/lib',
    'spec-kit/input',
    'spec-kit/templates/commands',
    'agency-agents/agents/engineering',
    'agency-agents/agents/design',
    'agency-agents/agents/testing',
    'agency-agents/agents/product',
    'agency-agents/agents/project-management',
    'docs/adr',
    'docs/templates',
    'refdocs',
    'source-code',
    'planning/clarifications',
    'planning/sprints',
    'bin',
    'mcp',
    'tests',
    'status-web',
    'config',
  ];

  console.log(`${c.blue}📦 Creating project structure...${c.reset}`);
  dirs.forEach((dir) => fs.mkdirSync(path.join(targetDir, dir), { recursive: true }));

  // Copy directories
  [
    ['scripts', 'scripts'],
    ['bin', 'bin'],
    ['spec-kit/templates', 'spec-kit/templates'],
    ['docs/adr', 'docs/adr'],
    ['docs/templates', 'docs/templates'],
    ['mcp', 'mcp'],
    ['tests', 'tests'],
    ['status-web', 'status-web'],
    ['config', 'config'],
  ].forEach(([from, to]) => {
    const src = path.join(root, from);
    if (fs.existsSync(src)) {
      copyDirectory(src, path.join(targetDir, to));
      console.log(`  ${c.dim}📁 ${to}/${c.reset}`);
    }
  });

  // Template files
  const files = [
    { from: 'package.json', transform: (c) => transformPackageJson(c, projectName) },
    { from: 'README.md', transform: (c) => transformReadme(c, projectName) },
    { from: 'AGENTS.md' },
    { from: 'CLAUDE.md' },
    { from: '.env.example' },
    { from: '.gitignore' },
    { from: 'agent-roles.json' },
    { from: 'GUIA_COMPLETA_VISION.md' },
    { from: 'refdocs/README.md' },
    { from: 'spec-kit/README.md' },
    { from: 'agency-agents/README.md' },
    { from: 'docs/README.md' },
    { from: 'commands/README.md' },
  ];

  files.forEach(({ from, transform }) => {
    const src = path.join(root, from);
    const dest = path.join(targetDir, from);
    if (fs.existsSync(src)) {
      let content = fs.readFileSync(src, 'utf8');
      if (transform) content = transform(content);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, content, 'utf8');
    }
  });

  // Make bin scripts executable
  const binDir = path.join(targetDir, 'bin');
  if (fs.existsSync(binDir)) {
    fs.readdirSync(binDir).forEach((file) => {
      if (!file.endsWith('.cmd')) {
        fs.chmodSync(path.join(binDir, file), 0o755);
      }
    });
  }

  console.log(`${c.green}✅ Project scaffolded${c.reset}\n`);
}

async function runNpmInstall(targetDir) {
  console.log(`${c.blue}📦 Installing dependencies...${c.reset}`);
  const result = spawnSync('npm', ['install'], { cwd: targetDir, stdio: 'inherit' });
  if (result.status !== 0) {
    console.log(
      `${c.yellow}⚠️  npm install failed. Run manually: cd ${path.basename(targetDir)} && npm install${c.reset}`,
    );
    return false;
  }
  console.log(`${c.green}✅ Dependencies installed${c.reset}\n`);
  return true;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  match[1].split('\n').forEach((line) => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim();
  });
  return { meta, body: match[2] };
}

function getCommandFiles() {
  const commandsDir = path.join(getPackageRoot(), 'commands');
  return fs.existsSync(commandsDir)
    ? fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md') && f !== 'README.md')
    : [];
}

function getWorkspaceDir(ide) {
  const cwd = process.cwd();
  return {
    cursor: path.join(cwd, '.cursor', 'rules'),
    claude: path.join(cwd, '.claude'),
    opencode: path.join(cwd, '.opencode', 'commands'),
    copilot: path.join(cwd, '.github'),
    antigravity: path.join(cwd, '.agents', 'workflows'),
  }[ide];
}

function buildCursorIndex(files) {
  let table = '| Comando | Descripción |\n|---|---|\n';
  files.forEach((file) => {
    const name = path.basename(file, '.md');
    const { meta } = parseFrontmatter(
      fs.readFileSync(path.join(getPackageRoot(), 'commands', file), 'utf8'),
    );
    table += `| \`${name}\` | ${meta.description || 'Comando VISION'} |\n`;
  });

  return `---
description: VISION workflow commands
alwaysApply: true
---

# VISION Framework

Comandos disponibles:

${table}

## Flujo
\`\`\`
init → generate_brief → generate_spec_kit → generate_sprints → start_sprint --sprint 1
\`\`\`
`;
}

function buildClaudeCommand(name, meta, body) {
  return `---
name: ${name}
description: ${meta.description || `VISION: ${name}`}
---

${body.trim()}
`;
}

function buildClaudeRule(files) {
  let table = '| Comando | Descripción |\n|---|---|\n';
  files.forEach((file) => {
    const name = path.basename(file, '.md');
    const { meta } = parseFrontmatter(
      fs.readFileSync(path.join(getPackageRoot(), 'commands', file), 'utf8'),
    );
    table += `| \`${name}\` | ${meta.description || 'Comando VISION'} |\n`;
  });

  return `---
description: VISION workflow
---

# VISION Framework

## Comandos

${table}

## Flujo de trabajo

1. \`init\` — Inicializa
2. \`generate_brief\` — Genera brief
3. \`generate_spec_kit\` — Especificaciones
4. \`generate_sprints\` — Planifica sprints
5. \`start_sprint --sprint N\` — Desarrolla
`;
}

function buildCopilotInstructions(files) {
  let table = '| Comando | Descripción |\n|---|---|\n';
  files.forEach((file) => {
    const name = path.basename(file, '.md');
    const { meta } = parseFrontmatter(
      fs.readFileSync(path.join(getPackageRoot(), 'commands', file), 'utf8'),
    );
    table += `| \`${name}\` | ${meta.description || 'Comando VISION'} |\n`;
  });

  return `# VISION Framework

${table}

## Flujo: init → generate_brief → generate_spec_kit → generate_sprints → start_sprint
`;
}

function buildOpenCodeCommand(name, meta, body) {
  return `---
description: ${meta.description || `VISION — ${name}`}
---

${body.trim()}
`;
}

async function setupWorkspaceIDE(ideId, files) {
  const workspaceDir = getWorkspaceDir(ideId);
  if (!workspaceDir) return;

  console.log(`${c.blue}🔧 Setting up ${ideId}...${c.reset}`);

  switch (ideId) {
    case 'cursor': {
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.writeFileSync(
        path.join(workspaceDir, 'vision-index.mdc'),
        buildCursorIndex(files),
        'utf8',
      );
      break;
    }
    case 'claude': {
      const commandsDir = path.join(workspaceDir, 'commands');
      const rulesDir = path.join(workspaceDir, 'rules');
      fs.mkdirSync(commandsDir, { recursive: true });
      fs.mkdirSync(rulesDir, { recursive: true });

      files.forEach((file) => {
        const name = path.basename(file, '.md');
        const raw = fs.readFileSync(path.join(getPackageRoot(), 'commands', file), 'utf8');
        const { meta, body } = parseFrontmatter(raw);
        fs.writeFileSync(
          path.join(commandsDir, file),
          buildClaudeCommand(name, meta, body),
          'utf8',
        );
      });

      fs.writeFileSync(path.join(rulesDir, 'vision-workflow.md'), buildClaudeRule(files), 'utf8');
      break;
    }
    case 'copilot': {
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.writeFileSync(
        path.join(workspaceDir, 'copilot-instructions.md'),
        buildCopilotInstructions(files),
        'utf8',
      );
      break;
    }
    case 'opencode':
    case 'antigravity': {
      fs.mkdirSync(workspaceDir, { recursive: true });
      files.forEach((file) => {
        const name = path.basename(file, '.md');
        const raw = fs.readFileSync(path.join(getPackageRoot(), 'commands', file), 'utf8');
        const { meta, body } = parseFrontmatter(raw);
        fs.writeFileSync(
          path.join(workspaceDir, file),
          buildOpenCodeCommand(name, meta, body),
          'utf8',
        );
      });
      break;
    }
  }

  console.log(`  ${c.green}✓ ${workspaceDir}${c.reset}`);
}

async function initCommand(projectNameArg) {
  console.log(`${c.cyan}
╔══════════════════════════════════════════════════╗
║     VISION Framework - Project Setup             ║
╚══════════════════════════════════════════════════╝
${c.reset}`);

  // Determine project name (for package.json, etc.)
  let projectName = projectNameArg;
  if (!projectName) {
    const rl = createReadline();
    const defaultName = path.basename(process.cwd());
    const answer = await askQuestion(rl, `${c.cyan}?${c.reset} Project name [${defaultName}]: `);
    rl.close();
    projectName = answer.trim() || defaultName;
  }

  projectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

  // Always use current directory
  const targetDir = process.cwd();

  console.log(`\n${c.bold}Project:${c.reset} ${projectName}`);
  console.log(`${c.bold}Location:${c.reset} ${targetDir}\n`);

  // Confirm if directory is not empty
  const entries = fs.readdirSync(targetDir).filter((e) => !e.startsWith('.'));
  if (entries.length > 0) {
    const rl = createReadline();
    const confirm = await askQuestion(
      rl,
      `${c.yellow}⚠️  Directory not empty. Continue? [y/N]${c.reset} `,
    );
    rl.close();
    if (!['y', 'yes'].includes(confirm.trim().toLowerCase())) {
      console.log('Cancelled.');
      process.exit(0);
    }
    console.log('');
  }

  // Scaffold project in current directory
  await scaffoldProject(targetDir, projectName);

  // Install dependencies
  await runNpmInstall(targetDir);

  // Ask which IDEs to setup
  const selectedIdes = await askMultipleChoice(
    'Which IDE(s) do you want to configure?',
    AVAILABLE_IDES,
  );

  if (selectedIdes.length > 0) {
    console.log(`\n${c.bold}Generating IDE configs...${c.reset}`);
    const files = getCommandFiles();
    for (const ideId of selectedIdes) {
      await setupWorkspaceIDE(ideId, files);
    }
  }

  // Download optional resources
  const root = getPackageRoot();
  const downloadSpecKit = await askYesNo('Download Spec Kit templates?', true);
  if (downloadSpecKit) {
    spawnSync(process.execPath, [path.join(root, 'scripts', 'update-spec-kit.js')], {
      cwd: root,
      stdio: 'inherit',
    });
  }

  const downloadAgency = await askYesNo('Download Agency Agents?', true);
  if (downloadAgency) {
    spawnSync(process.execPath, [path.join(root, 'scripts', 'update-agency-agents.js')], {
      cwd: targetDir,
      stdio: 'inherit',
    });
  }

  // Success message
  console.log(`\n${c.green}${'═'.repeat(50)}${c.reset}`);
  console.log(`${c.green}  ✅ Project "${projectName}" ready!${c.reset}`);
  console.log(`${c.green}${'═'.repeat(50)}${c.reset}\n`);

  console.log(`${c.bold}Start:${c.reset}`);
  console.log(`  1. Open in your IDE`);
  console.log(`  2. Type ${c.cyan}/init${c.reset} in agent chat`);
  console.log(
    `  3. Add docs to ${c.cyan}refdocs/${c.reset}, then ${c.cyan}/generate_brief${c.reset}\n`,
  );
}

function showHelp() {
  console.log(`
VISION Framework CLI v${CLI_VERSION}

Usage:
  npx @nexus360/vision-framework init [project-name]

Examples:
  npx @nexus360/vision-framework init my-app
  npx @nexus360/vision-framework init    # Uses current directory name

This creates a complete VISION project with:
  - All scripts and framework files
  - refdocs/, source-code/, planning/ directories
  - IDE configuration for your chosen editor
  - npm dependencies installed

After setup:
  1. Type 'init' in your IDE's AI chat
  2. Follow the VISION workflow
`);
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(CLI_VERSION);
    process.exit(0);
  }

  if (args[0] === 'init') {
    return { command: 'init', projectName: args[1] };
  }

  // Default to init if no command specified
  return { command: 'init', projectName: args[0] };
}

async function main() {
  const opts = parseArgs();

  if (opts.command === 'init') {
    await initCommand(opts.projectName);
  } else {
    console.error(`Unknown command: ${opts.command}`);
    console.log('Run with --help for usage information');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
