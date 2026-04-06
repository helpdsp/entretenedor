#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseArgs } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { reportToMatrix } = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { markSprintStarted, markSprintCompleted } = require("./lib/workflow-state");
const { printMatrixOutcome } = require("./lib/matrix-reporting");
const { sprintFolderName, assertAllSprintTasksDone } = require("./lib/sprint-tasks");

function readState(root) {
  const filePath = path.join(root, "planning", "sprint-state.json");
  if (!fs.existsSync(filePath)) {
    return { completed: [], active: null };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeState(root, state) {
  const filePath = path.join(root, "planning", "sprint-state.json");
  fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const context = getProjectContext(root);
  const sprint = Number(args.sprint || "1");

  if (!Number.isInteger(sprint) || sprint < 1) {
    throw new Error("--sprint must be a positive integer.");
  }

  let state = readState(root);
  const sprintDir = path.join(root, "planning", "sprints", sprintFolderName(sprint));
  if (!fs.existsSync(sprintDir)) {
    throw new Error(`Sprint folder not found: planning/sprints/${sprintFolderName(sprint)}`);
  }

  // Sprint 1: no hay sprint previo. Sprint N>1: todas las tareas del sprint N-1 en tasks.md deben ser `done`;
  // entonces se registra el sprint N-1 como completado y se abre el sprint N (sin comando aparte).
  if (sprint > 1) {
    assertAllSprintTasksDone(
      root,
      sprint - 1,
      `No se puede iniciar el sprint ${sprint} hasta que todas las tareas del sprint ${sprint - 1} estén \`done\` en tasks.md`
    );
    if (!state.completed.includes(sprint - 1)) {
      state.completed.push(sprint - 1);
    }
    state.completed = [...new Set(state.completed)].sort((a, b) => a - b);
    writeState(root, state);
    markSprintCompleted(
      root,
      sprint - 1,
      `Sprint ${sprint - 1} cerrado automáticamente al iniciar sprint ${sprint}.`
    );
    state = readState(root);
  }

  state.active = sprint;
  writeState(root, state);
  markSprintStarted(root, sprint, `Sprint ${sprint} started.`);

  const report = await reportToMatrix(root, {
    eventType: "sprint_started",
    stage: "execution",
    projectId: context.projectId || undefined,
    workspaceId: context.workspaceId || undefined,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    details: {
      sprint
    },
    timestamp: new Date().toISOString()
  });

  console.log(`Sprint ${sprint} started.`);
  printMatrixOutcome(report);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
