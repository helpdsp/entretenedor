#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { loadEnv } = require("./lib/env");
const { reportToMatrix } = require("./lib/matrix-client");
const { printMatrixOutcome } = require("./lib/matrix-reporting");

function getProjectContext(root) {
  const configPath = path.join(root, "config", "project.config.json");
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return {
      projectName: config.projectName || "Local Project",
      projectSlug: config.projectSlug || "local-project"
    };
  } catch (_error) {
    return {
      projectName: "Local Project",
      projectSlug: "local-project"
    };
  }
}

function collectStats(root) {
  const sprintsRoot = path.join(root, "planning", "sprints");
  if (!fs.existsSync(sprintsRoot)) {
    return { sprints: 0, stories: 0, tasks: 0 };
  }

  const sprintFolders = fs
    .readdirSync(sprintsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^sprint-\d+/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  let stories = 0;
  let tasks = 0;
  sprintFolders.forEach((folder) => {
    const storiesPath = path.join(sprintsRoot, folder, "stories.md");
    const tasksPath = path.join(sprintsRoot, folder, "tasks.md");
    if (fs.existsSync(storiesPath)) {
      const content = fs.readFileSync(storiesPath, "utf8");
      stories += content.split(/\r?\n/).filter((line) => /^[-*]\s+/.test(line.trim())).length;
    }
    if (fs.existsSync(tasksPath)) {
      const content = fs.readFileSync(tasksPath, "utf8");
      tasks += content.split(/\r?\n/).filter((line) => /^\|\s*T-\d+/.test(line.trim())).length;
    }
  });

  return {
    sprints: sprintFolders.length,
    stories,
    tasks
  };
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const project = getProjectContext(root);
  const stats = collectStats(root);

  if (stats.sprints === 0) {
    throw new Error("No sprints found in planning/sprints. Run `generate_sprints` first.");
  }

  const statusPath = path.join(root, "planning", "planning-status.json");
  fs.writeFileSync(
    statusPath,
    `${JSON.stringify(
      {
        finalizedAt: new Date().toISOString(),
        project,
        stats
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const zipScript = path.join(root, "scripts", "create-project-zip.js");
  const zipResult = spawnSync(process.execPath, [zipScript], {
    cwd: root,
    encoding: "utf8"
  });
  if (zipResult.status !== 0) {
    throw new Error(zipResult.stderr || "Failed to create ZIP package.");
  }

  const report = await reportToMatrix(root, {
    eventType: "planning_finalized",
    stage: "planning",
    projectName: project.projectName,
    projectSlug: project.projectSlug,
    details: {
      stats
    },
    timestamp: new Date().toISOString()
  });

  console.log("Planning finalized.");
  printMatrixOutcome(report);
  console.log(zipResult.stdout.trim());
  console.log("Share the ZIP with developers so they can unzip and run locally.");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
