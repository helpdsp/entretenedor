#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseArgs, resolvePathFromRoot } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { ensureDir, readFileIfExists, writeFile } = require("./lib/io");
const { parseBullets } = require("./lib/text");
const { runLocalIdeAiJson } = require("./lib/local-ide-ai-client");
const { reportToMatrix } = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { markSprintsGenerated, markSprintsApproved } = require("./lib/workflow-state");
const { printMatrixOutcome } = require("./lib/matrix-reporting");
const { readClarifications } = require("./lib/clarification-store");

function sprintId(number) {
  return `sprint-${String(number).padStart(2, "0")}`;
}

function readSpecBundle(specDir) {
  return {
    prd: readFileIfExists(path.join(specDir, "PRD.md")),
    technicalSpec: readFileIfExists(path.join(specDir, "technical-spec.md")),
    apiSpec: readFileIfExists(path.join(specDir, "api-spec.yaml")),
    dataModel: readFileIfExists(path.join(specDir, "data-model.md")),
    epics: readFileIfExists(path.join(specDir, "epics.md")),
    stories: readFileIfExists(path.join(specDir, "stories.md")),
    sprintPlan: readFileIfExists(path.join(specDir, "sprint-plan.md")),
    testPlan: readFileIfExists(path.join(specDir, "test-plan.md"))
  };
}

function detectSprintCount(sprintPlanText, fallback = 3) {
  const matches = [...sprintPlanText.matchAll(/sprint[\s-]*(\d+)/gi)];
  if (matches.length === 0) {
    return fallback;
  }
  const maxNumber = matches.reduce((acc, item) => Math.max(acc, Number(item[1] || "0")), 0);
  return maxNumber > 0 ? maxNumber : fallback;
}

function fallbackPlan(specBundle, explicitCount) {
  const stories = parseBullets(specBundle.stories);
  const epics = parseBullets(specBundle.epics);
  const sprintCount = explicitCount || detectSprintCount(specBundle.sprintPlan, 3);
  const storiesPerSprint = Math.max(1, Math.ceil(stories.length / sprintCount));
  const roles = ["frontend", "backend", "qa", "pm", "deploy"];

  const sprints = [];
  for (let i = 1; i <= sprintCount; i += 1) {
    const start = (i - 1) * storiesPerSprint;
    const selectedStories = stories.slice(start, start + storiesPerSprint);
    const fallbackStories = selectedStories.length > 0 ? selectedStories : [`STORY-${i}-TODO`];
    const tasks = fallbackStories.map((story, index) => ({
      id: `T-${String(index + 1).padStart(3, "0")}`,
      title: `Implementar ${story}`,
      story,
      owner_role: roles[index % roles.length],
      points: 3
    }));
    sprints.push({
      number: i,
      goal: `Ejecutar backlog priorizado para ${sprintId(i)}.`,
      stories: fallbackStories,
      tasks,
      qa_checks: [
        "Validar criterios de aceptacion por historia",
        "Ejecutar pruebas API y funcionales",
        "Registrar evidencia en checklist QA"
      ],
      risks: epics.slice(0, 2).map((epic) => `Dependencia asociada: ${epic}`)
    });
  }
  return { sprints };
}

function planWithLocalAi(specBundle, explicitCount, root, clarifications) {
  const targetSprintCount = explicitCount || detectSprintCount(specBundle.sprintPlan, 3);
  const parsed = runLocalIdeAiJson({
    root,
    taskName: "plan-sprints",
    payload: {
      instruction:
        "Genera un plan de sprints con tareas accionables por rol. Roles permitidos: frontend, backend, qa, deploy, pm. Devuelve JSON valido con el schema indicado.",
      target_sprint_count: targetSprintCount,
      clarifications: clarifications || {},
      output_schema: {
        sprints: [
          {
            number: "number",
            goal: "string",
            stories: ["string"],
            tasks: [
              {
                id: "string",
                title: "string",
                story: "string",
                owner_role: "frontend|backend|qa|deploy|pm",
                points: "number"
              }
            ],
            qa_checks: ["string"],
            risks: ["string"]
          }
        ]
      },
      spec_kit: specBundle
    }
  });

  if (!parsed || !Array.isArray(parsed.sprints) || parsed.sprints.length === 0) {
    throw new Error("Local AI did not return valid sprint plan.");
  }

  return parsed;
}

function normalizePlan(plan) {
  const normalized = {
    sprints: []
  };

  const roles = new Set(["frontend", "backend", "qa", "deploy", "pm"]);
  const safeSprints = Array.isArray(plan.sprints) ? plan.sprints : [];

  safeSprints.forEach((sprintItem, index) => {
    const number = Number(sprintItem?.number || index + 1);
    const stories = Array.isArray(sprintItem?.stories)
      ? sprintItem.stories.filter((value) => typeof value === "string" && value.trim().length > 0)
      : [];
    const tasksRaw = Array.isArray(sprintItem?.tasks) ? sprintItem.tasks : [];
    const tasks = tasksRaw.map((task, taskIndex) => {
      const owner = roles.has(task?.owner_role) ? task.owner_role : "pm";
      return {
        id: task?.id || `T-${String(taskIndex + 1).padStart(3, "0")}`,
        title: task?.title || `Task ${taskIndex + 1}`,
        story: task?.story || stories[0] || "STORY-TODO",
        owner_role: owner,
        points: Number(task?.points || 3)
      };
    });

    normalized.sprints.push({
      number,
      goal: sprintItem?.goal || `Sprint ${number}`,
      stories: stories.length > 0 ? stories : ["STORY-TODO"],
      tasks,
      qa_checks:
        Array.isArray(sprintItem?.qa_checks) && sprintItem.qa_checks.length > 0
          ? sprintItem.qa_checks
          : ["Ejecutar checklist QA template"],
      risks:
        Array.isArray(sprintItem?.risks) && sprintItem.risks.length > 0
          ? sprintItem.risks
          : ["Sin riesgos documentados"]
    });
  });

  return normalized;
}

function writeSprintArtifacts(root, plan) {
  const planningDir = path.join(root, "planning");
  const sprintsDir = path.join(planningDir, "sprints");
  ensureDir(sprintsDir);

  plan.sprints.forEach((sprint) => {
    const folder = sprintId(sprint.number);
    const targetDir = path.join(sprintsDir, folder);
    ensureDir(targetDir);

    writeFile(
      path.join(targetDir, "sprint-goal.md"),
      `# Sprint ${sprint.number} Goal\n\n- ${sprint.goal}\n`
    );

    writeFile(
      path.join(targetDir, "stories.md"),
      `# Sprint ${sprint.number} Stories\n\n${sprint.stories.map((item) => `- ${item}`).join("\n")}\n`
    );

    const tableRows = sprint.tasks
      .map((task) => `| ${task.id} | ${task.title} | ${task.story} | ${task.owner_role} | ${task.points} | todo |`)
      .join("\n");
    writeFile(
      path.join(targetDir, "tasks.md"),
      [
        `# Sprint ${sprint.number} Tasks`,
        "",
        "| Task | Title | Story | Owner role | Points | Status |",
        "|---|---|---|---|---|---|",
        tableRows
      ].join("\n")
    );

    writeFile(
      path.join(targetDir, "qa-plan.md"),
      [
        `# Sprint ${sprint.number} QA Plan`,
        "",
        ...sprint.qa_checks.map((item) => `- ${item}`),
        "",
        "## Riesgos monitoreados",
        "",
        ...sprint.risks.map((item) => `- ${item}`)
      ].join("\n")
    );
  });

  const sprintIndex = ["# Sprint index", "", ...plan.sprints.map((item) => `- ${sprintId(item.number)}: planned`)];
  writeFile(path.join(planningDir, "sprint-index.md"), sprintIndex.join("\n"));

  const allStories = plan.sprints.flatMap((item) => item.stories);
  const backlog = [
    "# Backlog base",
    "",
    "## Planned stories",
    "",
    ...allStories.map((story) => `- ${story}`)
  ];
  writeFile(path.join(planningDir, "backlog.md"), backlog.join("\n"));
}

function computeStats(plan) {
  const totalStories = plan.sprints.reduce((acc, sprint) => acc + sprint.stories.length, 0);
  const totalTasks = plan.sprints.reduce((acc, sprint) => acc + sprint.tasks.length, 0);
  const totalPoints = plan.sprints.reduce(
    (acc, sprint) => acc + sprint.tasks.reduce((taskAcc, task) => taskAcc + Number(task.points || 0), 0),
    0
  );
  return {
    sprints: plan.sprints.length,
    stories: totalStories,
    tasks: totalTasks,
    points: totalPoints
  };
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));

  const mode = String(args.mode || "local").toLowerCase();
  const specDir = resolvePathFromRoot(root, args["spec-dir"], "spec-kit/input");
  const explicitCount = args["sprint-count"] ? Number(args["sprint-count"]) : null;
  const specBundle = readSpecBundle(specDir);
  const clarificationData = readClarifications(root, "sprints");
  const clarifications = clarificationData ? clarificationData.answers : {};

  let rawPlan;
  if (mode === "local") {
    try {
      rawPlan = planWithLocalAi(specBundle, explicitCount, root, clarifications);
    } catch (error) {
      console.warn(`Warning: local AI planning failed (${error.message}). Falling back to heuristic planning.`);
      rawPlan = fallbackPlan(specBundle, explicitCount);
    }
  } else {
    rawPlan = fallbackPlan(specBundle, explicitCount);
  }

  const plan = normalizePlan(rawPlan);
  writeSprintArtifacts(root, plan);
  const stats = computeStats(plan);
  markSprintsGenerated(root, mode, stats.sprints, `Sprint plan generated with ${stats.sprints} sprints.`);
  markSprintsApproved(root, "Sprints auto-approved on generation.");

  const planningStatusPath = path.join(root, "planning", "planning-status.json");
  fs.writeFileSync(
    planningStatusPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode,
        stats
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const project = getProjectContext(root);
  const report = await reportToMatrix(root, {
    eventType: "sprints_generated",
    stage: "planning",
    projectId: project.projectId || undefined,
    workspaceId: project.workspaceId || undefined,
    projectName: project.projectName,
    projectSlug: project.projectSlug,
    details: {
      mode,
      stats,
      totalSprints: stats.sprints
    },
    timestamp: new Date().toISOString()
  });

  console.log(`Sprints planned: ${stats.sprints} | stories: ${stats.stories} | tasks: ${stats.tasks}`);
  printMatrixOutcome(report);
  console.log("Output: planning/sprints/*");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
