#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { ensureDir } = require("./lib/io");

const AGENCY_REPO = "https://github.com/msitarzewski/agency-agents.git";
const UPSTREAM_REL = path.join("agency-agents", "upstream");
const AGENTS_REL = path.join("agency-agents", "agents");
const META_REL = path.join("agency-agents", "upstream.json");

// Directories to SKIP when copying agent categories
const SKIP_DIRS = new Set([".git", ".github", "scripts", "examples"]);

function gitAvailable() {
  const result = spawnSync("git", ["--version"], { encoding: "utf8", stdio: "pipe" });
  return result.status === 0;
}

function isUpstreamCloned(root) {
  return fs.existsSync(path.join(root, UPSTREAM_REL, ".git"));
}

function gitClone(root) {
  const dest = path.join(root, UPSTREAM_REL);
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  console.log(`Clonando ${AGENCY_REPO} ...`);
  const result = spawnSync("git", ["clone", "--depth", "1", AGENCY_REPO, dest], {
    cwd: root,
    stdio: "inherit",
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error("git clone fallo. Verifica conexion a internet y que git este instalado.");
  }
}

function gitPull(root) {
  const upstreamDir = path.join(root, UPSTREAM_REL);
  console.log("Actualizando Agency Agents (git pull --ff-only)...");
  const result = spawnSync("git", ["pull", "--ff-only"], {
    cwd: upstreamDir,
    stdio: "inherit",
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error("git pull fallo. Verifica conexion a internet.");
  }
}

function getGitSha(root) {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: path.join(root, UPSTREAM_REL),
    encoding: "utf8",
    stdio: "pipe"
  });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return 0;
  }
  ensureDir(dest);
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      count += 1;
    }
  }
  return count;
}

function syncAgents(root) {
  const upstreamDir = path.join(root, UPSTREAM_REL);
  const destDir = path.join(root, AGENTS_REL);

  if (!fs.existsSync(upstreamDir)) {
    throw new Error(`No se encontro el upstream clonado en ${upstreamDir}.`);
  }

  // Wipe and recreate to handle upstream deletions
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  ensureDir(destDir);

  let totalAgents = 0;
  const categories = [];

  for (const entry of fs.readdirSync(upstreamDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const src = path.join(upstreamDir, entry.name);
    const dest = path.join(destDir, entry.name);
    const copied = copyDir(src, dest);
    if (copied > 0) {
      categories.push(`  ${entry.name}/ — ${copied} agentes`);
      totalAgents += copied;
    }
  }

  categories.forEach((line) => console.log(line));
  return totalAgents;
}

function saveMeta(root, sha) {
  const metaPath = path.join(root, META_REL);
  ensureDir(path.dirname(metaPath));
  fs.writeFileSync(
    metaPath,
    `${JSON.stringify({ repo: AGENCY_REPO, sha, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8"
  );
}

function readMeta(root) {
  const metaPath = path.join(root, META_REL);
  if (!fs.existsSync(metaPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (_) {
    return null;
  }
}

function main() {
  const root = process.cwd();

  if (!gitAvailable()) {
    throw new Error("git no esta disponible en PATH. Instala git para usar esta funcion.");
  }

  const cloned = isUpstreamCloned(root);

  if (cloned) {
    gitPull(root);
  } else {
    gitClone(root);
  }

  const sha = getGitSha(root);
  console.log("Copiando agentes...");
  const total = syncAgents(root);
  saveMeta(root, sha);

  const meta = readMeta(root);
  console.log(`\nAgency Agents listo. SHA: ${sha} | ${total} archivos copiados`);
  console.log(`Agentes disponibles en: agency-agents/agents/`);
  if (meta) {
    console.log(`Actualizado: ${meta.updatedAt}`);
  }
}

module.exports = { isUpstreamCloned, gitAvailable, readMeta };

try {
  if (require.main === module) {
    main();
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
