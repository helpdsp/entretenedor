#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { parseArgs } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { reportToMatrix } = require("./lib/matrix-client");
const { MATRIX_CONNECTION_STATES } = require("./lib/project-context");
const { printMatrixOutcome } = require("./lib/matrix-reporting");

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "new-project";
}

function walkFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolute));
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function replaceTokens(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, "utf8");
  Object.entries(replacements).forEach(([token, value]) => {
    content = content.split(token).join(value);
  });
  fs.writeFileSync(filePath, content, "utf8");
}

function findBestMatch(sourceFiles, targetFileName, patternList) {
  const byName = sourceFiles.find(
    (filePath) => path.basename(filePath).toLowerCase() === targetFileName.toLowerCase()
  );
  if (byName) {
    return byName;
  }

  for (const pattern of patternList) {
    const matched = sourceFiles.find((filePath) => pattern.test(path.basename(filePath)));
    if (matched) {
      return matched;
    }
  }
  return null;
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const projectName = args["project-name"];
  const sourceSpecPathArg = args["spec-kit-path"];
  const matrixProjectId = args["project-id"] || "";
  const matrixWorkspaceId = args["workspace-id"] || "";
  const matrixBaseUrl = args["matrix-url"] || process.env.MATRIX_BASE_URL || "";
  const projectType = args["project-type"] || "greenfield";
  const developmentLanguage = args["development-language"] || "";

  if (!projectName || !sourceSpecPathArg) {
    console.error(
      "Usage: node scripts/bootstrap-project.js --project-name \"My Project\" --spec-kit-path \"C:/path/to/spec-kit\""
    );
    process.exit(1);
  }

  const sourceSpecPath = path.resolve(sourceSpecPathArg);
  const specInputDir = path.join(root, "spec-kit", "input");

  if (!fs.existsSync(specInputDir)) {
    console.error("Error: spec-kit/input does not exist. Run this from the project template root.");
    process.exit(1);
  }
  if (!fs.existsSync(sourceSpecPath)) {
    console.error(`Error: spec kit path not found: ${sourceSpecPath}`);
    process.exit(1);
  }

  const projectSlug = slugify(projectName);
  const replacements = {
    "__PROJECT_NAME__": projectName,
    "__PROJECT_SLUG__": projectSlug
  };

  [
    "README.md",
    "AGENTS.md",
    ".env.example",
    "agent-roles.json",
    "spec-kit/input/api-spec.yaml"
  ].forEach((relative) => replaceTokens(path.join(root, relative), replacements));

  const artifacts = [
    { target: "PRD.md", patterns: [/prd/i, /product[-_ ]requirements/i] },
    { target: "technical-spec.md", patterns: [/technical[-_ ]spec/i, /architecture/i] },
    { target: "api-spec.yaml", patterns: [/api[-_ ]spec/i, /openapi/i] },
    { target: "data-model.md", patterns: [/data[-_ ]model/i, /schema/i] },
    { target: "epics.md", patterns: [/epics?/i] },
    { target: "stories.md", patterns: [/stories?/i, /user[-_ ]stories?/i] },
    { target: "sprint-plan.md", patterns: [/sprint[-_ ]plan/i, /roadmap/i] },
    { target: "test-plan.md", patterns: [/test[-_ ]plan/i, /qa[-_ ]plan/i] },
    { target: "brief.md", patterns: [/brief/i, /summary/i] }
  ];

  const sourceFiles = walkFiles(sourceSpecPath);
  const copyResults = [];

  for (const artifact of artifacts) {
    const selected = findBestMatch(sourceFiles, artifact.target, artifact.patterns);
    const destination = path.join(specInputDir, artifact.target);
    if (selected) {
      fs.copyFileSync(selected, destination);
      copyResults.push({ target: artifact.target, status: "copied", source: selected });
    } else {
      copyResults.push({ target: artifact.target, status: "placeholder", source: "-" });
    }
  }

  const configPath = path.join(root, "config", "project.config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.projectName = projectName;
    config.projectSlug = projectSlug;
    config.initialized = true;
    config.initializedAt = new Date().toISOString();
    config.specKitPath = sourceSpecPath;
    config.projectType = projectType;
    config.developmentLanguage = developmentLanguage;
    config.matrix = config.matrix || {};
    config.matrix.baseUrl = matrixBaseUrl || config.matrix.baseUrl || "";
    config.matrix.projectId = matrixProjectId || config.matrix.projectId || "";
    config.matrix.workspaceId = matrixWorkspaceId || config.matrix.workspaceId || "";
    const hasMatrixIntent = Boolean(config.matrix.baseUrl || config.matrix.projectId || config.matrix.workspaceId);
    config.matrix.connection = {
      ...(config.matrix.connection || {}),
      status: hasMatrixIntent ? MATRIX_CONNECTION_STATES.PENDING_AUTH : MATRIX_CONNECTION_STATES.DISCONNECTED,
      authorizationToken: "",
      authorizedAt: null,
      authorizedBy: "",
      deniedAt: null,
      deniedReason: "",
      lastError: ""
    };
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }

  const reportLines = [
    "# Bootstrap report",
    "",
    `- Project name: ${projectName}`,
    `- Project slug: ${projectSlug}`,
    `- Source spec path: ${sourceSpecPath}`,
    `- Timestamp: ${new Date().toISOString()}`,
    "",
    "## Artifact sync",
    "",
    ...copyResults.map((entry) => `- ${entry.target}: ${entry.status}${entry.source !== "-" ? ` (${entry.source})` : ""}`)
  ];
  const reportPath = path.join(root, "planning", "bootstrap-report.md");
  fs.writeFileSync(reportPath, `${reportLines.join("\n")}\n`, "utf8");

  const planningScript = path.join(root, "scripts", "plan-all-sprints.js");
  const planningResult = spawnSync(
    process.execPath,
    [planningScript, "--spec-dir", specInputDir, "--mode", "local"],
    { cwd: root, encoding: "utf8" }
  );
  if (planningResult.status !== 0) {
    console.warn("Warning: local sprint planning failed. Run `generate_sprints` manually.");
    if (planningResult.stderr) {
      console.warn(planningResult.stderr.trim());
    }
  }

  const report = await reportToMatrix(root, {
    eventType: "bootstrap_completed",
    stage: "bootstrap",
    projectName,
    projectSlug,
    details: {
      sourceSpecPath,
      projectType,
      developmentLanguage,
      projectId: matrixProjectId || null,
      workspaceId: matrixWorkspaceId || null,
      copiedArtifacts: copyResults.filter((item) => item.status === "copied").length,
      placeholderArtifacts: copyResults.filter((item) => item.status === "placeholder").length
    },
    timestamp: new Date().toISOString()
  });

  console.log("Bootstrap completed.");
  printMatrixOutcome(report);
  console.log(`Project: ${projectName} (${projectSlug})`);
  console.log(`Report: ${reportPath}`);
  console.log("Next step: review planning/sprints and start implementation.");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
