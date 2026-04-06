#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./lib/env");
const { reportToMatrix } = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { markSprintsApproved } = require("./lib/workflow-state");
const { printMatrixOutcome } = require("./lib/matrix-reporting");

function readPlanningStats(root) {
  const filePath = path.join(root, "planning", "planning-status.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("Planning status not found. Run generate_sprints first.");
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const context = getProjectContext(root);
  const planning = readPlanningStats(root);

  markSprintsApproved(root, "Sprints plan approved.");

  const report = await reportToMatrix(root, {
    eventType: "sprints_approved",
    stage: "planning",
    projectId: context.projectId || undefined,
    workspaceId: context.workspaceId || undefined,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    details: {
      stats: planning.stats || {}
    },
    timestamp: new Date().toISOString()
  });

  console.log("Sprints plan approved.");
  printMatrixOutcome(report);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
