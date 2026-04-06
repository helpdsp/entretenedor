#!/usr/bin/env node

const path = require("path");
const { spawnSync } = require("child_process");
const { loadEnv } = require("./lib/env");
const { executeDirectCommand, isDirectCommand } = require("./lib/direct-commands");

const ALIASES = Object.freeze({
  planning_finalize: "planning:finalize",
  status_web: "status:web"
});

function normalizeCommand(raw) {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  return ALIASES[trimmed] || trimmed;
}

function resolveCommand(argv) {
  const invoked = normalizeCommand(path.basename(argv[1] || "", path.extname(argv[1] || "")));
  const maybeArgs = argv.slice(2);

  if (isDirectCommand(invoked) || invoked === "next_step") {
    return { command: invoked, args: maybeArgs };
  }

  const [rawCommand, ...rest] = maybeArgs;
  const command = normalizeCommand(rawCommand);
  if (isDirectCommand(command) || command === "next_step") {
    return { command, args: rest };
  }

    throw new Error(
    "Unknown command. Use one of: init, generate_brief, generate_spec_kit, generate_sprints, approve_sprints_plan, start_sprint, continue_sprint, reset_project, clarify_brief, clarify_sprints, update_spec_kit, update_agency_agents, next_step"
  );
}

function runNextStep(root, args) {
  const nextScript = path.join(root, "scripts", "next-step.js");
  const result = spawnSync(process.execPath, [nextScript, ...args], {
    cwd: root,
    stdio: "inherit",
    encoding: "utf8"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function main() {
  const root = process.cwd();
  loadEnv(root);
  const { command, args } = resolveCommand(process.argv);

  if (command === "next_step") {
    runNextStep(root, args);
    return;
  }

  const result = executeDirectCommand(root, command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
