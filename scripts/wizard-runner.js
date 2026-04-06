#!/usr/bin/env node

const path = require("path");
const { spawnSync } = require("child_process");
const { parseArgs, resolvePathFromRoot } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { reportToMatrix } = require("./lib/matrix-client");
const { printMatrixOutcome } = require("./lib/matrix-reporting");

function runStep(root, scriptRelativePath, args = []) {
  const scriptPath = path.join(root, scriptRelativePath);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    stdio: "inherit",
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`Wizard step failed: ${scriptRelativePath}`);
  }
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const projectName = args["project-name"] || "Nuevo Proyecto";
  const specKitPath = args["spec-kit-path"];
  const briefPath = resolvePathFromRoot(root, args.brief, "spec-kit/input/brief.md");
  const projectId = args["project-id"] || "";
  const workspaceId = args["workspace-id"] || "";
  const matrixUrl = args["matrix-url"] || process.env.MATRIX_BASE_URL || "";
  const projectType = args["project-type"] || "greenfield";
  const developmentLanguage = args["development-language"] || "";

  if (specKitPath) {
    runStep(root, "scripts/bootstrap-project.js", [
      "--project-name",
      projectName,
      "--spec-kit-path",
      specKitPath,
      "--project-id",
      projectId,
      "--workspace-id",
      workspaceId,
      "--matrix-url",
      matrixUrl,
      "--project-type",
      projectType,
      "--development-language",
      developmentLanguage
    ]);
  } else {
    if (projectId && workspaceId) {
      runStep(root, "scripts/connect-project.js", [
        "--project-id",
        projectId,
        "--workspace-id",
        workspaceId,
        "--matrix-url",
        matrixUrl
      ]);
    } else {
      console.warn("Warning: wizard started without --project-id/--workspace-id. Matrix sync may be queued only.");
    }
    runStep(root, "scripts/generate-brief.js", ["--output", briefPath]);
    runStep(root, "scripts/generate-spec-kit.js", ["--mode", "auto", "--brief", briefPath]);
    runStep(root, "scripts/plan-all-sprints.js", ["--mode", "local"]);
    runStep(root, "scripts/approve-sprints-plan.js");
  }

  runStep(root, "scripts/finalize-planning.js");

  const report = await reportToMatrix(root, {
    eventType: "wizard_completed",
    stage: "wizard",
    details: {
      projectName,
      source: specKitPath ? "existing-spec-kit" : "brief-to-spec"
    },
    timestamp: new Date().toISOString()
  });

  console.log("Wizard completed. ZIP package is ready in dist/.");
  printMatrixOutcome(report);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
