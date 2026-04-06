#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function collectJsFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(absolutePath);
    }
  }
  return files;
}

function main() {
  const root = process.cwd();
  const scriptsDir = path.join(root, "scripts");
  const files = collectJsFiles(scriptsDir);

  for (const filePath of files) {
    const result = spawnSync(process.execPath, ["--check", filePath], {
      cwd: root,
      stdio: "inherit"
    });
    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
  }

  console.log(`Checked ${files.length} script files.`);
}

main();
