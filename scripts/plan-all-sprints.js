#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseArgs, resolvePathFromRoot } = require('./lib/args');
const { loadEnv } = require('./lib/env');
const { ensureDir, readFileIfExists, writeFile } = require('./lib/io');
const { parseBullets } = require('./lib/text');
const { runLocalIdeAiJson } = require('./lib/local-ide-ai-client');
const { reportToMatrix } = require('./lib/matrix-client');
const { getProjectContext } = require('./lib/project-context');
const {
  markSprintsGenerated,
  markSprintsApproved,
} = require('./lib/workflow-state');
const { printMatrixOutcome } = require('./lib/matrix-reporting');
const {
  readClarifications,
  isClarificationsComplete,
  SPRINTS_QUESTIONS,
} = require('./lib/clarification-store');

function sprintId(number) {
  return `sprint-${String(number).padStart(2, '0')}`;
}

function readSpecBundle(specDir) {
  return {
    prd: readFileIfExists(path.join(specDir, 'PRD.md')),
    technicalSpec: readFileIfExists(path.join(specDir, 'technical-spec.md')),
    apiSpec: readFileIfExists(path.join(specDir, 'api-spec.yaml')),
    dataModel: readFileIfExists(path.join(specDir, 'data-model.md')),
    epics: readFileIfExists(path.join(specDir, 'epics.md')),
    stories: readFileIfExists(path.join(specDir, 'stories.md')),
    sprintPlan: readFileIfExists(path.join(specDir, 'sprint-plan.md')),
    testPlan: readFileIfExists(path.join(specDir, 'test-plan.md')),
  };
}

function detectSprintCount(sprintPlanText, fallback = 3) {
  const matches = [...sprintPlanText.matchAll(/sprint[\s-]*(\d+)/gi)];
  if (matches.length === 0) {
    return fallback;
  }
  const maxNumber = matches.reduce(
    (acc, item) => Math.max(acc, Number(item[1] || '0')),
    0,
  );
  return maxNumber > 0 ? maxNumber : fallback;
}

function fallbackPlan(specBundle, explicitCount) {
  const stories = parseBullets(specBundle.stories);
  const epics = parseBullets(specBundle.epics);
  const sprintCount =
    explicitCount || detectSprintCount(specBundle.sprintPlan, 3);
  const storiesPerSprint = Math.max(1, Math.ceil(stories.length / sprintCount));
  const roles = ['frontend', 'backend', 'qa', 'pm', 'deploy'];

  const sprints = [];
  for (let i = 1; i <= sprintCount; i += 1) {
    const start = (i - 1) * storiesPerSprint;
    const selectedStories = stories.slice(start, start + storiesPerSprint);
    const fallbackStories =
      selectedStories.length > 0 ? selectedStories : [`STORY-${i}-TODO`];
    const tasks = fallbackStories.map((story, index) => ({
      id: `T-${String(index + 1).padStart(3, '0')}`,
      title: `Implementar ${story}`,
      story,
      owner_role: roles[index % roles.length],
      points: 3,
      rf: null,
      component: null,
      route: null,
      location: null,
    }));
    sprints.push({
      number: i,
      goal: `Ejecutar backlog priorizado para ${sprintId(i)}.`,
      stories: fallbackStories,
      tasks,
      qa_checks: [
        'Validar criterios de aceptacion por historia',
        'Ejecutar pruebas API y funcionales',
        'Registrar evidencia en checklist QA',
      ],
      risks: epics.slice(0, 2).map((epic) => `Dependencia asociada: ${epic}`),
    });
  }
  return { sprints };
}

function planWithLocalAi(specBundle, explicitCount, root, clarifications) {
  const targetSprintCount =
    explicitCount || detectSprintCount(specBundle.sprintPlan, 3);
  const parsed = runLocalIdeAiJson({
    root,
    taskName: 'plan-sprints',
    payload: {
      instruction:
        'Genera un plan de sprints con tareas accionables por rol. Roles permitidos: frontend, backend, qa, deploy, pm.\n\n' +
        'CRÍTICO para tareas frontend/backend:\n' +
        "- rf: extrae el RF del PRD que implementa (ej: 'RF-08', 'RF-05') desde sprint-plan.md o stories.md\n" +
        "- component: nombre específico del componente o página (ej: 'TrackDetailPage', 'NodeGraph', 'DashboardPage')\n" +
        "- route: la ruta exacta según PRD §6.4 'Navegación — URLs de la Aplicación' (ej: '/tracks/:trackId', '/dashboard') o null si es componente interno\n" +
        "- location: ruta del archivo esperada (ej: 'src/pages/TrackDetailPage.tsx', 'src/components/track/NodeGraph.tsx')\n\n" +
        "Consulta sprint-plan.md para 'Tareas clave' y PRD para §6.4. Distingue claramente Dashboard (/dashboard) de Track Detail (/tracks/:trackId).\n\n" +
        'Devuelve JSON válido con el schema indicado.',
      target_sprint_count: targetSprintCount,
      clarifications: clarifications || {},
      output_schema: {
        sprints: [
          {
            number: 'number',
            goal: 'string',
            stories: ['string'],
            tasks: [
              {
                id: 'string',
                title: 'string',
                story: 'string',
                owner_role: 'frontend|backend|qa|deploy|pm',
                points: 'number',
                rf: "string (e.g., 'RF-08', 'RF-05') - required for frontend/backend tasks",
                component:
                  "string (e.g., 'TrackDetailPage', 'NodeGraph') - required for frontend tasks",
                route:
                  "string | null (e.g., '/tracks/:trackId', '/dashboard', or null for components)",
                location:
                  "string (e.g., 'src/pages/TrackDetailPage.tsx') - suggested file path",
              },
            ],
            qa_checks: ['string'],
            risks: ['string'],
          },
        ],
      },
      spec_kit: specBundle,
    },
  });

  if (
    !parsed ||
    !Array.isArray(parsed.sprints) ||
    parsed.sprints.length === 0
  ) {
    throw new Error('Local AI did not return valid sprint plan.');
  }

  return parsed;
}

function normalizePlan(plan) {
  const normalized = {
    sprints: [],
  };

  const roles = new Set(['frontend', 'backend', 'qa', 'deploy', 'pm']);
  const safeSprints = Array.isArray(plan.sprints) ? plan.sprints : [];

  safeSprints.forEach((sprintItem, index) => {
    const number = Number(sprintItem?.number || index + 1);
    const stories = Array.isArray(sprintItem?.stories)
      ? sprintItem.stories.filter(
          (value) => typeof value === 'string' && value.trim().length > 0,
        )
      : [];
    const tasksRaw = Array.isArray(sprintItem?.tasks) ? sprintItem.tasks : [];
    const tasks = tasksRaw.map((task, taskIndex) => {
      const owner = roles.has(task?.owner_role) ? task.owner_role : 'pm';
      return {
        id: task?.id || `T-${String(taskIndex + 1).padStart(3, '0')}`,
        title: task?.title || `Task ${taskIndex + 1}`,
        story: task?.story || stories[0] || 'STORY-TODO',
        owner_role: owner,
        points: Number(task?.points || 3),
        rf: task?.rf || null,
        component: task?.component || null,
        route: task?.route || null,
        location: task?.location || null,
      };
    });

    normalized.sprints.push({
      number,
      goal: sprintItem?.goal || `Sprint ${number}`,
      stories: stories.length > 0 ? stories : ['STORY-TODO'],
      tasks,
      qa_checks:
        Array.isArray(sprintItem?.qa_checks) && sprintItem.qa_checks.length > 0
          ? sprintItem.qa_checks
          : ['Ejecutar checklist QA template'],
      risks:
        Array.isArray(sprintItem?.risks) && sprintItem.risks.length > 0
          ? sprintItem.risks
          : ['Sin riesgos documentados'],
    });
  });

  return normalized;
}

function writeSprintArtifacts(root, plan) {
  const planningDir = path.join(root, 'planning');
  const sprintsDir = path.join(planningDir, 'sprints');
  ensureDir(sprintsDir);

  plan.sprints.forEach((sprint) => {
    const folder = sprintId(sprint.number);
    const targetDir = path.join(sprintsDir, folder);
    ensureDir(targetDir);

    writeFile(
      path.join(targetDir, 'sprint-goal.md'),
      `# Sprint ${sprint.number} Goal\n\n- ${sprint.goal}\n`,
    );

    writeFile(
      path.join(targetDir, 'stories.md'),
      `# Sprint ${sprint.number} Stories\n\n${sprint.stories.map((item) => `- ${item}`).join('\n')}\n`,
    );

    const tableRows = sprint.tasks
      .map((task) => {
        const rf = task.rf || '—';
        const component = task.component || '—';
        const route = task.route || '—';
        return `| ${task.id} | ${task.title} | ${rf} | ${component} | ${route} | ${task.story} | ${task.owner_role} | ${task.points} | todo |`;
      })
      .join('\n');
    writeFile(
      path.join(targetDir, 'tasks.md'),
      [
        `# Sprint ${sprint.number} Tasks`,
        '',
        '| Task | Title | RF | Component | Route | Story | Owner role | Points | Status |',
        '|---|---|---|---|---|---|---|---|---|',
        tableRows,
      ].join('\n'),
    );

    writeFile(
      path.join(targetDir, 'qa-plan.md'),
      [
        `# Sprint ${sprint.number} QA Plan`,
        '',
        ...sprint.qa_checks.map((item) => `- ${item}`),
        '',
        '## Riesgos monitoreados',
        '',
        ...sprint.risks.map((item) => `- ${item}`),
      ].join('\n'),
    );
  });

  const sprintIndex = [
    '# Sprint index',
    '',
    ...plan.sprints.map((item) => `- ${sprintId(item.number)}: planned`),
  ];
  writeFile(path.join(planningDir, 'sprint-index.md'), sprintIndex.join('\n'));

  const allStories = plan.sprints.flatMap((item) => item.stories);
  const backlog = [
    '# Backlog base',
    '',
    '## Planned stories',
    '',
    ...allStories.map((story) => `- ${story}`),
  ];
  writeFile(path.join(planningDir, 'backlog.md'), backlog.join('\n'));
}

function validateArchitecturalContext(plan) {
  const frontendBackendTasks = plan.sprints.flatMap((sprint) =>
    sprint.tasks
      .filter((t) => t.owner_role === 'frontend' || t.owner_role === 'backend')
      .map((t) => ({ ...t, sprint: sprint.number })),
  );

  const missingContext = frontendBackendTasks.filter(
    (t) => !t.rf || (t.owner_role === 'frontend' && !t.component),
  );

  if (missingContext.length > 0) {
    console.warn(
      `\n⚠️  Warning: ${missingContext.length} frontend/backend tasks missing architectural context:`,
    );
    missingContext.forEach((t) => {
      const missing = [];
      if (!t.rf) missing.push('RF');
      if (t.owner_role === 'frontend' && !t.component)
        missing.push('component');
      console.warn(
        `  - Sprint ${t.sprint} ${t.id}: ${t.title} [missing: ${missing.join(', ')}]`,
      );
    });
    console.warn(
      "\n💡 Tip: Review sprint-plan.md 'Tareas clave' and PRD §6.4 to ensure proper architectural context.\n",
    );
  }

  return { total: frontendBackendTasks.length, missing: missingContext.length };
}

function computeStats(plan) {
  const totalStories = plan.sprints.reduce(
    (acc, sprint) => acc + sprint.stories.length,
    0,
  );
  const totalTasks = plan.sprints.reduce(
    (acc, sprint) => acc + sprint.tasks.length,
    0,
  );
  const totalPoints = plan.sprints.reduce(
    (acc, sprint) =>
      acc +
      sprint.tasks.reduce(
        (taskAcc, task) => taskAcc + Number(task.points || 0),
        0,
      ),
    0,
  );
  return {
    sprints: plan.sprints.length,
    stories: totalStories,
    tasks: totalTasks,
    points: totalPoints,
  };
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));

  // Validate sprints clarifications are complete
  if (!isClarificationsComplete(root, 'sprints')) {
    const requiredIds = SPRINTS_QUESTIONS.map((q) => q.id).join(', ');
    console.error('generate_sprints blocked.');
    console.error(`Brief clarifications are incomplete or missing.`);
    console.error(
      `  Action: Run \`clarify_sprints\` and provide answers for: ${requiredIds}`,
    );
    process.exit(1);
  }

  const mode = String(args.mode || 'local').toLowerCase();
  const specDir = resolvePathFromRoot(root, args['spec-dir'], 'spec-kit/input');
  const explicitCount = args['sprint-count']
    ? Number(args['sprint-count'])
    : null;
  const specBundle = readSpecBundle(specDir);
  const clarificationData = readClarifications(root, 'sprints');
  const clarifications = clarificationData ? clarificationData.answers : {};

  let rawPlan;
  if (mode === 'local') {
    try {
      rawPlan = planWithLocalAi(
        specBundle,
        explicitCount,
        root,
        clarifications,
      );
    } catch (error) {
      console.warn(
        `Warning: local AI planning failed (${error.message}). Falling back to heuristic planning.`,
      );
      rawPlan = fallbackPlan(specBundle, explicitCount);
    }
  } else {
    rawPlan = fallbackPlan(specBundle, explicitCount);
  }

  const plan = normalizePlan(rawPlan);
  const validation = validateArchitecturalContext(plan);
  writeSprintArtifacts(root, plan);
  const stats = computeStats(plan);
  markSprintsGenerated(
    root,
    mode,
    stats.sprints,
    `Sprint plan generated with ${stats.sprints} sprints.`,
  );
  markSprintsApproved(root, 'Sprints auto-approved on generation.');

  const planningStatusPath = path.join(
    root,
    'planning',
    'planning-status.json',
  );
  fs.writeFileSync(
    planningStatusPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode,
        stats,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const project = getProjectContext(root);
  const report = await reportToMatrix(root, {
    eventType: 'sprints_generated',
    stage: 'planning',
    projectId: project.projectId || undefined,
    workspaceId: project.workspaceId || undefined,
    projectName: project.projectName,
    projectSlug: project.projectSlug,
    details: {
      mode,
      stats,
      totalSprints: stats.sprints,
    },
    timestamp: new Date().toISOString(),
  });

  console.log(
    `Sprints planned: ${stats.sprints} | stories: ${stats.stories} | tasks: ${stats.tasks}`,
  );
  printMatrixOutcome(report);
  console.log('Output: planning/sprints/*');
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
