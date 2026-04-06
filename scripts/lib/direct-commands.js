const path = require("path");
const { spawnSync } = require("child_process");

const DIRECT_COMMANDS = Object.freeze({
  init: {
    script: "scripts/init-project.js",
    defaultArgs: []
  },
  generate_brief: {
    script: "scripts/generate-brief.js",
    defaultArgs: []
  },
  generate_spec_kit: {
    script: "scripts/generate-spec-kit.js",
    defaultArgs: ["--mode", "matrix", "--brief", "spec-kit/input/brief.md"]
  },
  generate_sprints: {
    script: "scripts/plan-all-sprints.js",
    defaultArgs: ["--mode", "local"]
  },
  approve_sprints_plan: {
    script: "scripts/approve-sprints-plan.js",
    defaultArgs: []
  },
  start_sprint: {
    script: "scripts/start-sprint.js",
    defaultArgs: []
  },
  continue_sprint: {
    script: "scripts/continue-sprint.js",
    defaultArgs: []
  },
  reset_project: {
    script: "scripts/reset-project.js",
    defaultArgs: []
  },
  clarify_brief: {
    script: "scripts/clarify-brief.js",
    defaultArgs: []
  },
  clarify_spec_kit: {
    script: "scripts/clarify-spec-kit.js",
    defaultArgs: []
  },
  clarify_sprints: {
    script: "scripts/clarify-sprints.js",
    defaultArgs: []
  },
  clarify_sprint: {
    script: "scripts/clarify-sprint.js",
    defaultArgs: []
  },
  update_spec_kit: {
    script: "scripts/update-spec-kit.js",
    defaultArgs: []
  },
  update_agency_agents: {
    script: "scripts/update-agency-agents.js",
    defaultArgs: []
  },
  generate_skills: {
    script: "scripts/generate-skills.js",
    defaultArgs: []
  },
  "planning:finalize": {
    script: "scripts/finalize-planning.js",
    defaultArgs: []
  },
  status: {
    script: "scripts/status-report.js",
    defaultArgs: []
  },
  "status:web": {
    script: "scripts/status-web-server.js",
    defaultArgs: []
  }
});

function toCommandName(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isDirectCommand(command) {
  const normalized = toCommandName(command);
  return Object.prototype.hasOwnProperty.call(DIRECT_COMMANDS, normalized);
}

function getDirectCommand(command) {
  const normalized = toCommandName(command);
  return DIRECT_COMMANDS[normalized] || null;
}

function formatDirectCommand(command, args = []) {
  const safeArgs = Array.isArray(args) ? args.filter((value) => typeof value === "string" && value.length > 0) : [];
  const suffix = safeArgs.length > 0 ? ` ${safeArgs.join(" ")}` : "";
  return `${command}${suffix}`;
}

function executeDirectCommand(root, command, args = [], options = {}) {
  const definition = getDirectCommand(command);
  if (!definition) {
    throw new Error(`Unknown direct command: ${command}`);
  }

  const scriptPath = path.join(root, definition.script);
  const defaultArgs = Array.isArray(definition.defaultArgs) ? definition.defaultArgs : [];
  const extraArgs = Array.isArray(args) ? args : [];
  const result = spawnSync(process.execPath, [scriptPath, ...defaultArgs, ...extraArgs], {
    cwd: root,
    stdio: options.stdio || "inherit",
    encoding: "utf8"
  });

  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    signal: result.signal || null,
    command: formatDirectCommand(command, [...defaultArgs, ...extraArgs])
  };
}

module.exports = {
  DIRECT_COMMANDS,
  getDirectCommand,
  isDirectCommand,
  formatDirectCommand,
  executeDirectCommand
};
