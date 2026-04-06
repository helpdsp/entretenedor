#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseArgs, resolvePathFromRoot } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { ensureDir, readFileIfExists, writeFile } = require("./lib/io");
const { parseBullets, parseFirstHeading } = require("./lib/text");
const { reportToMatrix } = require("./lib/matrix-client");
const { printMatrixOutcome } = require("./lib/matrix-reporting");

function sprintIdFromNumber(sprintNumber) {
  return `sprint-${String(sprintNumber).padStart(2, "0")}`;
}

function pickSprintGoal(sprintPlanText, sprintNumber) {
  const bullets = parseBullets(sprintPlanText);
  if (bullets.length > 0) {
    return bullets[Math.min(sprintNumber - 1, bullets.length - 1)];
  }
  const heading = parseFirstHeading(sprintPlanText);
  if (heading) {
    return heading;
  }
  return `Sprint ${sprintNumber} execution kickoff`;
}

function getProjectContext(root) {
  const configPath = path.join(root, "config", "project.config.json");
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return {
      projectName: config.projectName || "Local Project",
      projectSlug: config.projectSlug || "local-project"
    };
  } catch (_error) {
    return { projectName: "Local Project", projectSlug: "local-project" };
  }
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const sprintNumber = Number(args.sprint || "1");
  if (!Number.isInteger(sprintNumber) || sprintNumber < 1) {
    throw new Error("--sprint must be a positive integer.");
  }

  const specDir = resolvePathFromRoot(root, args["spec-dir"], "spec-kit/input");
  const sprintFolder = sprintIdFromNumber(sprintNumber);
  const sprintDir = resolvePathFromRoot(root, args["output-dir"], `planning/sprints/${sprintFolder}`);
  ensureDir(sprintDir);
  ensureDir(path.join(root, "planning"));

  const stories = parseBullets(readFileIfExists(path.join(specDir, "stories.md")));
  const tests = parseBullets(readFileIfExists(path.join(specDir, "test-plan.md")));
  const sprintPlanText = readFileIfExists(path.join(specDir, "sprint-plan.md"));
  const sprintGoal = pickSprintGoal(sprintPlanText, sprintNumber);

  const storyStart = (sprintNumber - 1) * 8;
  const selectedStories = stories.slice(storyStart, storyStart + 8);
  const storiesForSprint = selectedStories.length > 0 ? selectedStories : ["STORY-TODO: completar stories.md"];
  const roleSequence = ["frontend", "backend", "qa", "pm", "deploy"];

  const tasks = storiesForSprint.map((story, index) => ({
    taskId: `T-${String(index + 1).padStart(3, "0")}`,
    role: roleSequence[index % roleSequence.length],
    story
  }));

  writeFile(
    path.join(sprintDir, "sprint-goal.md"),
    [`# Sprint ${sprintNumber} Goal`, "", `- ${sprintGoal}`, "", "## Source", "", "- spec-kit/input/sprint-plan.md"].join("\n")
  );

  writeFile(
    path.join(sprintDir, "stories.md"),
    [`# Sprint ${sprintNumber} Stories`, "", ...storiesForSprint.map((story) => `- ${story}`)].join("\n")
  );

  writeFile(
    path.join(sprintDir, "tasks.md"),
    [
      `# Sprint ${sprintNumber} Tasks`,
      "",
      "| Task | Story | Owner role | Status |",
      "|---|---|---|---|",
      ...tasks.map((task) => `| ${task.taskId} | ${task.story} | ${task.role} | todo |`)
    ].join("\n")
  );

  const qaBullets = tests.length > 0 ? tests.slice(0, 10) : ["Completar test-plan.md con casos reales."];
  writeFile(
    path.join(sprintDir, "qa-plan.md"),
    [`# Sprint ${sprintNumber} QA Plan`, "", ...qaBullets.map((item) => `- ${item}`)].join("\n")
  );

  const planningSprintsDir = path.join(root, "planning", "sprints");
  const sprintFolders = fs
    .readdirSync(planningSprintsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^sprint-\d+/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  writeFile(
    path.join(root, "planning", "sprint-index.md"),
    ["# Sprint index", "", ...sprintFolders.map((folder) => `- ${folder}: draft`)].join("\n")
  );

  const project = getProjectContext(root);
  const report = await reportToMatrix(root, {
    eventType: "sprint_initialized",
    stage: "planning",
    projectName: project.projectName,
    projectSlug: project.projectSlug,
    details: {
      sprint: sprintFolder,
      stories: storiesForSprint.length,
      tasks: tasks.length
    },
    timestamp: new Date().toISOString()
  });

  console.log(`Sprint files generated in ${sprintDir}`);
  printMatrixOutcome(report);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
