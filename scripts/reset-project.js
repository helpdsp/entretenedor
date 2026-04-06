#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseArgs, resolvePathFromRoot } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { reportToMatrix } = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { resetWorkflowState, readWorkflowState, REQUIRED_SPEC_ARTIFACTS } = require("./lib/workflow-state");
const { printMatrixOutcome } = require("./lib/matrix-reporting");

function removeIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return false;
  }

  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } else {
    fs.rmSync(targetPath, { force: true });
  }
  return true;
}

function buildGeneratedSpecFiles(root) {
  const workflow = readWorkflowState(root);
  const generated = new Set(["brief.md", "brief-validation.json"]);

  if (workflow.spec?.generated) {
    const artifacts = Array.isArray(workflow.spec.artifactFiles) && workflow.spec.artifactFiles.length > 0
      ? workflow.spec.artifactFiles
      : REQUIRED_SPEC_ARTIFACTS;
    artifacts.forEach((file) => generated.add(file));
  }

  return generated;
}

function listRemovedFromSpecInput(specInputDir, generatedFiles) {
  const removed = [];
  if (!fs.existsSync(specInputDir)) {
    return removed;
  }

  const entries = fs.readdirSync(specInputDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    if (!generatedFiles.has(entry.name)) {
      continue;
    }

    const absolute = path.join(specInputDir, entry.name);
    if (removeIfExists(absolute)) {
      removed.push(entry.name);
    }
  }

  return removed;
}

function countFilesRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  let total = 0;
  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
      } else if (entry.isFile()) {
        total += 1;
      }
    }
  }
  return total;
}

function collectPreserved(_root, referencesDir, sourceDir) {
  return {
    references: countFilesRecursive(referencesDir),
    sourceCode: countFilesRecursive(sourceDir)
  };
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const context = getProjectContext(root);

  const referencesDir = resolvePathFromRoot(root, args["references-dir"], "refdocs");
  const sourceDir = resolvePathFromRoot(root, args["source-dir"], "source-code");
  const specInputDir = path.join(root, "spec-kit", "input");
  const generatedSpecFiles = buildGeneratedSpecFiles(root);

  const removed = {
    specInputFiles: listRemovedFromSpecInput(specInputDir, generatedSpecFiles),
    runtimePaths: []
  };

  const runtimePaths = [
    path.join(root, ".matrix"),
    path.join(root, ".local-ai"),
    path.join(root, "dist"),
    path.join(root, "planning", "backlog.md"),
    path.join(root, "planning", "sprint-index.md"),
    path.join(root, "planning", "planning-status.json"),
    path.join(root, "planning", "local-workflow-status.json"),
    path.join(root, "planning", "sprint-state.json"),
    path.join(root, "planning", "bootstrap-report.md"),
    path.join(root, "planning", "sprints")
  ];

  runtimePaths.forEach((targetPath) => {
    if (removeIfExists(targetPath)) {
      removed.runtimePaths.push(path.relative(root, targetPath).replace(/\\/g, "/"));
    }
  });

  fs.mkdirSync(path.join(root, "planning", "sprints"), { recursive: true });

  resetWorkflowState(root);

  const preserved = collectPreserved(root, referencesDir, sourceDir);

  const report = await reportToMatrix(root, {
    eventType: "project_reset",
    stage: "setup",
    projectId: context.projectId || undefined,
    workspaceId: context.workspaceId || undefined,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    details: {
      removed,
      preserved,
      referencesDir: path.relative(root, referencesDir).replace(/\\/g, "/"),
      sourceDir: path.relative(root, sourceDir).replace(/\\/g, "/")
    },
    timestamp: new Date().toISOString()
  });

  console.log("Project reset completed.");
  console.log("Preserved user inputs:");
  console.log(`- refdocs: ${preserved.references}`);
  console.log(`- source-code: ${preserved.sourceCode}`);
  console.log("Removed generated artifacts:");
  console.log(`- spec-kit/input files: ${removed.specInputFiles.length}`);
  console.log(`- runtime paths: ${removed.runtimePaths.length}`);
  console.log("Next step: init --reverse-engineering yes|no");
  printMatrixOutcome(report);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
