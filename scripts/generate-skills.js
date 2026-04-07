#!/usr/bin/env node

/**
 * generate-skills.js
 *
 * Exports commands/ as IDE configuration files or global agent skills.
 *
 * Modes:
 *   1. Workspace IDE files (--ide cursor|claude|opencode|copilot)
 *      Generates files in .cursor/, .claude/, .opencode/, .github/
 *   2. Global agent skills (--tool antigravity|claude-code)
 *      Generates files in ~/.gemini/antigravity/skills/ or ~/.claude/agents/
 *
 * Usage:
 *   node scripts/generate-skills.js --ide cursor [--dry-run]
 *   node scripts/generate-skills.js --ide claude [--dry-run]
 *   node scripts/generate-skills.js --ide opencode [--dry-run]
 *   node scripts/generate-skills.js --ide copilot [--dry-run]
 *   node scripts/generate-skills.js [--tool antigravity] [--out <dir>] [--dry-run]
 *
 * Defaults:
 *   --tool antigravity (when no --ide specified)
 *   --out  ~/.gemini/antigravity/skills   (or ANTIGRAVITY_SKILLS_DIR env var)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  parseFrontmatter,
  getWorkspaceDir,
  buildCursorIndex,
  buildClaudeWorkspace,
  buildOpenCodeCommands,
  buildCopilotInstructions,
  generateIdeFiles,
} = require('./lib/ide-builders');

const ROOT = path.resolve(__dirname, '..');
const COMMANDS_DIR = path.join(ROOT, 'commands');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    tool: 'antigravity',
    ide: [],
    out: null,
    dryRun: false,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tool' && args[i + 1]) opts.tool = args[++i];
    if (args[i] === '--ide' && args[i + 1]) {
      // Collect all IDE values until next flag
      while (args[i + 1] && !args[i + 1].startsWith('--')) {
        opts.ide.push(args[++i]);
      }
    }
    if (args[i] === '--out' && args[i + 1]) opts.out = args[++i];
    if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

function defaultSkillsDir(tool) {
  if (process.env.ANTIGRAVITY_SKILLS_DIR) return process.env.ANTIGRAVITY_SKILLS_DIR;
  if (tool === 'antigravity') {
    return path.join(os.homedir(), '.gemini', 'antigravity', 'skills');
  }
  // claude-code global agents
  if (tool === 'claude-code') {
    return path.join(os.homedir(), '.claude', 'agents');
  }
  throw new Error(`Tool desconocido: ${tool}. Usa --tool antigravity | claude-code`);
}

// ============================================================================
// Global Agent Skills Builders (for ~/.gemini/, ~/.claude/)
// ============================================================================

function buildAntigravitySkill(name, meta, body) {
  const slug = `vision-${name.replace(/_/g, '-')}`;
  const description = meta.description || `Comando VISION: ${name}`;
  return {
    slug,
    content: `# SKILL: ${slug}\n\n**Descripcion:** ${description}\n\n**Activacion:** \`@${slug}\` o escribe \`${name}\` en el agente.\n\n---\n\n${body.trim()}\n`,
  };
}

function buildClaudeCodeAgent(name, meta, body) {
  const slug = `vision-${name.replace(/_/g, '-')}`;
  const description = meta.description || `Comando VISION: ${name}`;
  return {
    slug,
    content: `---\nname: ${slug}\ndescription: ${description}\n---\n\n${body.trim()}\n`,
  };
}

function main() {
  const opts = parseArgs();

  if (!fs.existsSync(COMMANDS_DIR)) {
    console.error(`Error: no se encontro el directorio commands/ en ${COMMANDS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');

  if (files.length === 0) {
    console.log('No se encontraron archivos de comando en commands/');
    return;
  }

  // Mode 1: IDE workspace files (--ide cursor|claude|opencode|copilot)
  if (opts.ide.length > 0) {
    console.log(`\nGenerando archivos de IDE en workspace: ${opts.ide.join(', ')}\n`);

    const allResults = [];
    for (const ide of opts.ide) {
      const result = generateIdeFiles(ide, files, COMMANDS_DIR, opts.dryRun);
      allResults.push(result);
    }

    const totalFiles = allResults.reduce((sum, r) => sum + r.count, 0);
    console.log(
      `\n${opts.dryRun ? '[dry-run] ' : ''}${totalFiles} archivos generados para ${allResults.length} IDE(s).`,
    );
    return;
  }

  // Mode 2: Global agent skills (--tool antigravity|claude-code)
  const skillsDir = opts.out || defaultSkillsDir(opts.tool);

  console.log(`\nGenerando skills para: ${opts.tool}`);
  console.log(`Destino: ${skillsDir}\n`);

  const results = [];

  for (const file of files) {
    const name = path.basename(file, '.md');
    const raw = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);

    let skill;
    if (opts.tool === 'antigravity') {
      skill = buildAntigravitySkill(name, meta, body);
    } else if (opts.tool === 'claude-code') {
      skill = buildClaudeCodeAgent(name, meta, body);
    } else {
      console.warn(`  [skip] ${file} — tool no soportado: ${opts.tool}`);
      continue;
    }

    const destDir = path.join(skillsDir, skill.slug);
    const destFile = path.join(destDir, 'SKILL.md');

    if (opts.dryRun) {
      console.log(`  [dry-run] ${name} → ${destFile}`);
    } else {
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destFile, skill.content, 'utf8');
      console.log(`  ✓ ${name} → ${destFile}`);
    }

    results.push({ name, slug: skill.slug, dest: destFile });
  }

  console.log(
    `\n${opts.dryRun ? '[dry-run] ' : ''}${results.length} skills generados para ${opts.tool}.`,
  );

  if (opts.tool === 'antigravity' && !opts.dryRun) {
    console.log(`\nActiva cada skill con: @vision-<comando>`);
    console.log(`Ejemplo: @vision-generate-brief`);
  }
}

main();
