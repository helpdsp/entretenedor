#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const readline = require("readline");
const { parseArgs } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { updateProjectConfig, normalizeMatrixConfig, MATRIX_CONNECTION_STATES } = require("./lib/project-context");
const { resetWorkflowState, markProjectInitialized } = require("./lib/workflow-state");
const { isUpstreamCloned: isSpecKitCloned, gitAvailable, readMeta: readSpecKitMeta } = require("./update-spec-kit");
const { isUpstreamCloned: isAgencyAgentsCloned, readMeta: readAgencyMeta } = require("./update-agency-agents");
const { findAvailablePort, DEFAULT_PORT } = require("./lib/status-web-port");

function removeIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }
  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    return;
  }
  fs.rmSync(targetPath, { force: true });
}

function openInBrowser(url) {
  try {
    if (process.platform === "win32") {
      const child = spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" });
      child.unref();
      return;
    }
    if (process.platform === "darwin") {
      const child = spawn("open", [url], { detached: true, stdio: "ignore" });
      child.unref();
      return;
    }
    const child = spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
    child.unref();
  } catch (_error) {
    console.log(`Open this URL in your browser: ${url}`);
  }
}

function parseReverseEngineering(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["si", "sí", "yes", "y", "true", "1"].includes(normalized)) {
    return true;
  }
  if (["no", "n", "false", "0"].includes(normalized)) {
    return false;
  }
  return null;
}

function toStoredDir(root, inputValue, fallbackRelative) {
  const rawValue = typeof inputValue === "string" && inputValue.trim().length > 0
    ? inputValue.trim()
    : fallbackRelative;
  const absolute = path.isAbsolute(rawValue) ? rawValue : path.resolve(path.join(root, rawValue));
  const relative = path.relative(root, absolute);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative.replace(/\\/g, "/");
  }
  return absolute.replace(/\\/g, "/");
}

async function askYesNo(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(`${question} (yes/no): `, resolve));
  rl.close();
  const v = String(answer).trim().toLowerCase();
  return ["si", "sí", "yes", "y", "1"].includes(v) ? true : false;
}

async function askReverseEngineering() {
  return askYesNo("Este proyecto sera de ingenieria inversa?");
}

function runScript(root, scriptName, label) {
  const script = path.join(root, "scripts", scriptName);
  const result = spawnSync(process.execPath, [script], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    console.warn(`Warning: No se pudo actualizar ${label}. Continuando sin actualizacion.`);
  }
}

function resetRuntime(root) {
  const runtimePaths = [
    path.join(root, ".matrix"),
    path.join(root, ".local-ai"),
    path.join(root, "planning", "backlog.md"),
    path.join(root, "planning", "sprint-index.md"),
    path.join(root, "planning", "planning-status.json"),
    path.join(root, "planning", "sprint-state.json"),
    path.join(root, "planning", "workflow-state.json"),
    path.join(root, "planning", "sprints")
  ];

  runtimePaths.forEach((targetPath) => removeIfExists(targetPath));
  fs.mkdirSync(path.join(root, "planning", "sprints"), { recursive: true });

  updateProjectConfig(root, (config) => {
    const matrix = normalizeMatrixConfig(config);
    config.matrix = {
      ...matrix,
      projectId: "",
      workspaceId: "",
      connectedAt: null,
      connection: {
        ...matrix.connection,
        status: MATRIX_CONNECTION_STATES.DISCONNECTED,
        authorizationToken: "",
        authorizedAt: null,
        authorizedBy: "",
        deniedAt: null,
        deniedReason: "",
        lastError: ""
      }
    };
    return config;
  });

  resetWorkflowState(root);
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const preferredStatusPort = Number(args.port || process.env.STATUS_WEB_PORT || String(DEFAULT_PORT));
  const statusScript = path.join(root, "scripts", "status-web-server.js");
  const referencesDir = toStoredDir(root, args["references-dir"], "refdocs");
  const sourceDir = toStoredDir(root, args["source-dir"], "source-code");
  const promptDisabled = String(args["no-prompt"] || "false").toLowerCase() === "true";

  resetRuntime(root);
  fs.mkdirSync(path.resolve(root, referencesDir), { recursive: true });
  fs.mkdirSync(path.resolve(root, sourceDir), { recursive: true });

  let reverseEngineering = parseReverseEngineering(args["reverse-engineering"]);
  console.log("Pregunta inicial: Este proyecto sera de ingenieria inversa?");

  if (reverseEngineering === null && !promptDisabled && process.stdin.isTTY) {
    reverseEngineering = await askReverseEngineering();
  }

  markProjectInitialized(
    root,
    { reverseEngineering, referencesDir, sourceDir },
    reverseEngineering === null
      ? "Initialization pending reverse engineering decision."
      : `Reverse engineering mode set to ${reverseEngineering ? "yes" : "no"}.`
  );

  // --- Spec Kit update prompt ---
  const gitOk = gitAvailable();

  const specKitArg = args["update-spec-kit"];
  let updateSpecKit = specKitArg !== undefined
    ? ["si", "sí", "yes", "y", "1", "true"].includes(String(specKitArg).trim().toLowerCase())
    : null;

  if (updateSpecKit === null && !promptDisabled && process.stdin.isTTY) {
    if (gitOk) {
      const cloned = isSpecKitCloned(root);
      const meta = cloned ? readSpecKitMeta(root) : null;
      const action = cloned ? "actualizar (git pull)" : "descargar";
      const hint = meta ? ` (ultima actualizacion: ${meta.updatedAt.slice(0, 10)})` : "";
      console.log(`\nSpec Kit upstream: github/spec-kit${hint}`);
      updateSpecKit = await askYesNo(`¿Quieres ${action} el Spec Kit?`);
    } else {
      console.log("Spec Kit: git no disponible en PATH, se omite.");
      updateSpecKit = false;
    }
  }

  if (updateSpecKit === true) {
    runScript(root, "update-spec-kit.js", "Spec Kit");
  }

  // --- Agency Agents update prompt ---
  const agencyArg = args["update-agency-agents"];
  let updateAgency = agencyArg !== undefined
    ? ["si", "sí", "yes", "y", "1", "true"].includes(String(agencyArg).trim().toLowerCase())
    : null;

  if (updateAgency === null && !promptDisabled && process.stdin.isTTY) {
    if (gitOk) {
      const cloned = isAgencyAgentsCloned(root);
      const meta = cloned ? readAgencyMeta(root) : null;
      const action = cloned ? "actualizar (git pull)" : "descargar";
      const hint = meta ? ` (ultima actualizacion: ${meta.updatedAt.slice(0, 10)})` : "";
      console.log(`\nAgency Agents upstream: msitarzewski/agency-agents${hint}`);
      updateAgency = await askYesNo(`¿Quieres ${action} Agency Agents?`);
    } else {
      console.log("Agency Agents: git no disponible en PATH, se omite.");
      updateAgency = false;
    }
  }

  if (updateAgency === true) {
    runScript(root, "update-agency-agents.js", "Agency Agents");
  }
  // --- fin Agency Agents ---

  console.log("\nProject runtime reset completed.");
  console.log("Mode initialized: local-only.");
  if (reverseEngineering === true) {
    console.log("Reverse engineering: YES.");
    console.log(`Required before generate_brief: add source code files to ${sourceDir} and add at least 1 refdoc in ${referencesDir}.`);
  } else if (reverseEngineering === false) {
    console.log("Reverse engineering: NO.");
    console.log(`Required before generate_brief: add at least 1 refdoc in ${referencesDir}.`);
  } else {
    console.log("Reverse engineering: PENDING.");
    console.log("Define it with: init --reverse-engineering yes|no");
  }
  console.log("First instruction: run `generate_brief` when preconditions are ready.");

  let statusPort = null;
  let statusUrl = null;
  try {
    statusPort = await findAvailablePort(preferredStatusPort);
    statusUrl = `http://127.0.0.1:${statusPort}`;
    if (statusPort !== preferredStatusPort) {
      console.log(`Status web: port ${preferredStatusPort} busy, using ${statusPort} instead.`);
    }
  } catch (error) {
    console.warn(`Status web: ${error.message} — skipping local status server and browser.`);
  }

  if (statusPort !== null) {
    const server = spawn(process.execPath, [statusScript, "--port", String(statusPort), "--strict-port"], {
      cwd: root,
      stdio: "inherit"
    });

    setTimeout(() => {
      openInBrowser(statusUrl);
    }, 800);

    const shutdown = () => {
      if (!server.killed) {
        server.kill("SIGINT");
      }
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
