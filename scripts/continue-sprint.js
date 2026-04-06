#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseArgs } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { reportToMatrix } = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { markSprintContinued, readWorkflowState } = require("./lib/workflow-state");
const { printMatrixOutcome } = require("./lib/matrix-reporting");
const { sprintFolderName, getSprintTaskStatusReport } = require("./lib/sprint-tasks");

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const context = getProjectContext(root);
  const workflow = readWorkflowState(root);
  const active = workflow.sprints.active;

  let sprint = args.sprint !== undefined && args.sprint !== true ? Number(args.sprint) : active;

  if (!Number.isInteger(sprint) || sprint < 1) {
    throw new Error(
      "No hay sprint activo en el workflow o --sprint inválido. Indica --sprint N o ejecuta start_sprint primero."
    );
  }

  if (active !== sprint) {
    throw new Error(
      `El sprint ${sprint} no es el activo (activo: ${active ?? "ninguno"}). Para abrir un sprint usa start_sprint; continue_sprint solo retoma el sprint ya abierto con tareas pendientes.`
    );
  }

  const sprintDir = path.join(root, "planning", "sprints", sprintFolderName(sprint));
  if (!fs.existsSync(sprintDir)) {
    throw new Error(`Sprint folder not found: planning/sprints/${sprintFolderName(sprint)}`);
  }

  const report = getSprintTaskStatusReport(root, sprint);
  if (report.error === "missing_file") {
    throw new Error(`No se encontró ${path.relative(root, report.path) || report.path}.`);
  }
  if (report.error === "no_rows") {
    throw new Error(`No hay filas de tareas en ${path.relative(root, report.path) || report.path}.`);
  }

  if (report.ok) {
    const nextNum = sprint + 1;
    const hasNext = workflow.sprints.total > 0 && nextNum <= workflow.sprints.total;
    console.log(`Sprint ${sprint}: todas las tareas están \`done\`.`);
    if (hasNext) {
      console.log(`Siguiente: start_sprint --sprint ${nextNum}`);
    } else {
      console.log("Siguiente: planning:finalize (último sprint del plan).");
    }
    return;
  }

  markSprintContinued(root, sprint, `Sprint ${sprint} continued (resume).`);

  const goalPath = path.join(sprintDir, "sprint-goal.md");
  if (fs.existsSync(goalPath)) {
    const lines = fs.readFileSync(goalPath, "utf8").split(/\r?\n/);
    const excerpt = lines.slice(0, 14).join("\n");
    console.log("\n--- sprint-goal.md (extract) ---\n");
    console.log(excerpt);
    console.log("");
  }

  console.log(`Tareas pendientes (no \`done\`): ${report.pendingCount}`);
  console.log(`Archivo: ${path.relative(root, report.path).replace(/\\/g, "/") || report.path}`);
  console.log(`\nRetoma la implementación en esta sesión según tasks.md, stories.md y qa-plan.md.`);

  const matrixReport = await reportToMatrix(root, {
    eventType: "sprint_continued",
    stage: "execution",
    projectId: context.projectId || undefined,
    workspaceId: context.workspaceId || undefined,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    details: {
      sprint,
      pendingCount: report.pendingCount
    },
    timestamp: new Date().toISOString()
  });

  printMatrixOutcome(matrixReport);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
