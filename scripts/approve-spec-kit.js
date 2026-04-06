#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./lib/env");
const { reportToMatrix } = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { markSpecApproved, readWorkflowState, REQUIRED_SPEC_ARTIFACTS } = require("./lib/workflow-state");
const { printMatrixOutcome } = require("./lib/matrix-reporting");

function checkSpecArtifacts(root) {
  const specDir = path.join(root, "spec-kit", "input");
  const present = REQUIRED_SPEC_ARTIFACTS.filter((file) => {
    const filePath = path.join(specDir, file);
    return fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8").trim().length > 0;
  });
  const missing = REQUIRED_SPEC_ARTIFACTS.filter((f) => !present.includes(f));
  return { present, missing };
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const context = getProjectContext(root);
  const state = readWorkflowState(root);

  if (!state.spec.generated) {
    throw new Error("Spec Kit has not been generated yet. Run generate_spec_kit first.");
  }

  const { present, missing } = checkSpecArtifacts(root);

  if (missing.length > 0) {
    console.warn(`Warning: ${missing.length} spec artifact(s) missing or empty:`);
    missing.forEach((f) => console.warn(`  - spec-kit/input/${f}`));
    console.warn("Proceeding with approval of available artifacts.");
  }

  markSpecApproved(root, `Spec Kit approved. ${present.length}/${REQUIRED_SPEC_ARTIFACTS.length} artifacts present.`);

  const report = await reportToMatrix(root, {
    eventType: "spec_approved",
    stage: "planning",
    projectId: context.projectId || undefined,
    workspaceId: context.workspaceId || undefined,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    details: {
      artifactsPresent: present,
      artifactsMissing: missing
    },
    timestamp: new Date().toISOString()
  });

  console.log(`Spec Kit approved. ${present.length}/${REQUIRED_SPEC_ARTIFACTS.length} artifacts present.`);
  printMatrixOutcome(report);
  console.log("Next command: generate_sprints");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
