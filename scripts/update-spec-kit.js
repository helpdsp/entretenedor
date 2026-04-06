#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { ensureDir } = require("./lib/io");

const SPEC_KIT_REPO = "https://github.com/github/spec-kit.git";
const UPSTREAM_REL = path.join("spec-kit", "upstream");
const TEMPLATES_REL = path.join("spec-kit", "templates");
const META_REL = path.join("spec-kit", "upstream.json");

// Subdirs inside upstream/templates/ that we want to copy recursively
const COPY_SUBDIRS = ["commands"];

// File extensions to copy from the templates root
const COPY_EXTS = [".md", ".json"];

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
  console.log(`Clonando ${SPEC_KIT_REPO} ...`);
  const result = spawnSync("git", ["clone", "--depth", "1", SPEC_KIT_REPO, dest], {
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
  console.log("Actualizando Spec Kit (git pull --ff-only)...");
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
  const upstreamDir = path.join(root, UPSTREAM_REL);
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: upstreamDir,
    encoding: "utf8",
    stdio: "pipe"
  });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return 0;
  }
  ensureDir(destDir);
  let count = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      count += 1;
    }
  }
  return count;
}

function syncTemplates(root) {
  const upstreamTemplates = path.join(root, UPSTREAM_REL, "templates");
  const destTemplates = path.join(root, TEMPLATES_REL);

  if (!fs.existsSync(upstreamTemplates)) {
    throw new Error(`No se encontro templates/ en el upstream clonado (${upstreamTemplates}).`);
  }

  // Wipe and recreate destination to handle deletions
  if (fs.existsSync(destTemplates)) {
    fs.rmSync(destTemplates, { recursive: true, force: true });
  }
  ensureDir(destTemplates);

  let totalFiles = 0;

  // Copy selected subdirectories (commands/, etc.)
  for (const subdir of COPY_SUBDIRS) {
    const src = path.join(upstreamTemplates, subdir);
    const dest = path.join(destTemplates, subdir);
    const copied = copyDir(src, dest);
    if (copied > 0) {
      console.log(`  ${subdir}/ — ${copied} archivos`);
      totalFiles += copied;
    }
  }

  // Copy root-level files with selected extensions
  for (const entry of fs.readdirSync(upstreamTemplates, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }
    if (!COPY_EXTS.includes(path.extname(entry.name).toLowerCase())) {
      continue;
    }
    fs.copyFileSync(
      path.join(upstreamTemplates, entry.name),
      path.join(destTemplates, entry.name)
    );
    totalFiles += 1;
  }

  return totalFiles;
}

function saveMeta(root, sha) {
  const metaPath = path.join(root, META_REL);
  ensureDir(path.dirname(metaPath));
  fs.writeFileSync(
    metaPath,
    `${JSON.stringify({ repo: SPEC_KIT_REPO, sha, updatedAt: new Date().toISOString() }, null, 2)}\n`,
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
  console.log("Copiando templates...");
  const total = syncTemplates(root);
  saveMeta(root, sha);

  const meta = readMeta(root);
  console.log(`\nSpec Kit listo. SHA: ${sha} | ${total} archivos copiados`);
  console.log(`Templates disponibles en: spec-kit/templates/`);
  if (meta) {
    console.log(`Actualizado: ${meta.updatedAt}`);
  }
}

// Export helpers for use in init-project.js
module.exports = { isUpstreamCloned, gitAvailable, readMeta };

try {
  if (require.main === module) {
    main();
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
