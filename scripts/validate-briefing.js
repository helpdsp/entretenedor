#!/usr/bin/env node

const { parseArgs, resolvePathFromRoot } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { readRequired } = require("./lib/io");
const { validateBriefingInMatrix, reportToMatrix } = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { printMatrixOutcome } = require("./lib/matrix-reporting");

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));

  const briefPath = resolvePathFromRoot(root, args.brief, "spec-kit/input/brief.md");
  const brief = readRequired(briefPath);
  const context = getProjectContext(root);

  const result = await validateBriefingInMatrix({
    root,
    brief,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    projectId: context.projectId,
    workspaceId: context.workspaceId
  });

  const outputPath = resolvePathFromRoot(root, args.output, "spec-kit/input/brief-validation.json");
  require("fs").writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  const report = await reportToMatrix(root, {
    eventType: "brief_validated",
    stage: "discovery",
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    details: { briefPath, outputPath },
    timestamp: new Date().toISOString()
  });

  console.log(`Brief validation saved in ${outputPath}`);
  printMatrixOutcome(report);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
