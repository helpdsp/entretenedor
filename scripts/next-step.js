#!/usr/bin/env node

const { loadEnv } = require("./lib/env");
const { buildStatusSummary } = require("./lib/status-summary");
const { executeDirectCommand } = require("./lib/direct-commands");

function printBlockingIssues(summary) {
  const blocking = (summary.blockers || []).filter((item) => item.blocking);
  if (blocking.length === 0) {
    return;
  }

  console.log("next_step blocked.");
  blocking.forEach((item) => {
    console.log(`- ${item.message}`);
    console.log(`  Action: ${item.unblock}`);
  });
}

function main() {
  const root = process.cwd();
  loadEnv(root);
  const summary = buildStatusSummary(root);
  const next = summary.nextAction;

  if (!next || !next.name) {
    throw new Error("No next action available.");
  }

  if (next.args.includes("yes|no")) {
    throw new Error("next_step cannot guess yes/no values. Run `init --reverse-engineering yes|no`.");
  }

  if (next.blocked) {
    printBlockingIssues(summary);
    process.exit(1);
  }

  const result = executeDirectCommand(root, next.name, next.args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${result.command}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
