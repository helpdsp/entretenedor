#!/usr/bin/env node

/**
 * generate-skills.js
 *
 * Exports commands/ as Antigravity SKILL.md files.
 * Each command/X.md becomes a skill installable at:
 *   ~/.gemini/antigravity/skills/vision-X/SKILL.md
 *
 * Usage:
 *   node scripts/generate-skills.js [--tool antigravity] [--out <dir>] [--dry-run]
 *
 * Defaults:
 *   --tool antigravity
 *   --out  ~/.gemini/antigravity/skills   (or ANTIGRAVITY_SKILLS_DIR env var)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const COMMANDS_DIR = path.join(ROOT, "commands");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    tool: "antigravity",
    out: null,
    dryRun: false,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tool" && args[i + 1]) opts.tool = args[++i];
    if (args[i] === "--out" && args[i + 1]) opts.out = args[++i];
    if (args[i] === "--dry-run") opts.dryRun = true;
  }
  return opts;
}

function defaultSkillsDir(tool) {
  if (process.env.ANTIGRAVITY_SKILLS_DIR) return process.env.ANTIGRAVITY_SKILLS_DIR;
  if (tool === "antigravity") {
    return path.join(os.homedir(), ".gemini", "antigravity", "skills");
  }
  // claude-code global agents
  if (tool === "claude-code") {
    return path.join(os.homedir(), ".claude", "agents");
  }
  throw new Error(`Tool desconocido: ${tool}. Usa --tool antigravity | claude-code`);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) meta[key.trim()] = rest.join(":").trim();
  }
  return { meta, body: match[2] };
}

function buildAntigravitySkill(name, meta, body) {
  const slug = `vision-${name.replace(/_/g, "-")}`;
  const description = meta.description || `Comando VISION: ${name}`;
  return {
    slug,
    content: `# SKILL: ${slug}\n\n**Descripcion:** ${description}\n\n**Activacion:** \`@${slug}\` o escribe \`${name}\` en el agente.\n\n---\n\n${body.trim()}\n`,
  };
}

function buildClaudeCodeAgent(name, meta, body) {
  const slug = `vision-${name.replace(/_/g, "-")}`;
  const description = meta.description || `Comando VISION: ${name}`;
  return {
    slug,
    content: `---\nname: ${slug}\ndescription: ${description}\n---\n\n${body.trim()}\n`,
  };
}

function main() {
  const opts = parseArgs();
  const skillsDir = opts.out || defaultSkillsDir(opts.tool);

  if (!fs.existsSync(COMMANDS_DIR)) {
    console.error(`Error: no se encontro el directorio commands/ en ${COMMANDS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");

  if (files.length === 0) {
    console.log("No se encontraron archivos de comando en commands/");
    return;
  }

  console.log(`\nGenerando skills para: ${opts.tool}`);
  console.log(`Destino: ${skillsDir}\n`);

  const results = [];

  for (const file of files) {
    const name = path.basename(file, ".md");
    const raw = fs.readFileSync(path.join(COMMANDS_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);

    let skill;
    if (opts.tool === "antigravity") {
      skill = buildAntigravitySkill(name, meta, body);
    } else if (opts.tool === "claude-code") {
      skill = buildClaudeCodeAgent(name, meta, body);
    } else {
      console.warn(`  [skip] ${file} — tool no soportado: ${opts.tool}`);
      continue;
    }

    const destDir = path.join(skillsDir, skill.slug);
    const destFile = path.join(destDir, "SKILL.md");

    if (opts.dryRun) {
      console.log(`  [dry-run] ${name} → ${destFile}`);
    } else {
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destFile, skill.content, "utf8");
      console.log(`  ✓ ${name} → ${destFile}`);
    }

    results.push({ name, slug: skill.slug, dest: destFile });
  }

  console.log(`\n${opts.dryRun ? "[dry-run] " : ""}${results.length} skills generados para ${opts.tool}.`);

  if (opts.tool === "antigravity" && !opts.dryRun) {
    console.log(`\nActiva cada skill con: @vision-<comando>`);
    console.log(`Ejemplo: @vision-generate-brief`);
  }
}

main();
