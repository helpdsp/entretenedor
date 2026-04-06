#!/usr/bin/env node

/**
 * Sincroniza un snapshot del estado del flujo y la nextAction en planning/local-workflow-status.json
 * (derivado de buildStatusSummary — misma fuente que status-report / status:web).
 */

const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./lib/env");
const { buildStatusSummary } = require("./lib/status-summary");
const { getSprintTaskStatusReport } = require("./lib/sprint-tasks");

const OUT_REL = path.join("planning", "local-workflow-status.json");

function main() {
  const root = process.cwd();
  loadEnv(root);
  const summary = buildStatusSummary(root);

  const wf = summary.workflow || {};
  const active = wf.sprints?.active;
  let activeSprintTasks = null;
  if (Number.isInteger(active) && active > 0) {
    const report = getSprintTaskStatusReport(root, active);
    activeSprintTasks = {
      ok: report.ok,
      pendingCount: report.pendingCount ?? null,
      path: report.path ? path.relative(root, report.path).replace(/\\/g, "/") : null,
      error: report.error || null
    };
  }

  const payload = {
    generatedAt: summary.generatedAt,
    project: summary.project,
    mode: summary.mode,
    workflow: {
      status: wf.status,
      brief: wf.brief,
      spec: wf.spec,
      sprints: wf.sprints,
      lastAction: wf.lastAction
    },
    nextAction: summary.nextAction,
    blockers: summary.blockers || [],
    activeSprintTasks
  };

  const outPath = path.join(root, OUT_REL);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUT_REL}`);
  console.log(`nextAction: ${summary.nextAction?.command || summary.nextAction?.name || "?"}`);
  if (summary.nextAction?.blocked) {
    console.log("(blocked — see reason in file and status-report)");
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
