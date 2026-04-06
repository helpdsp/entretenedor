const fs = require("fs");
const path = require("path");
const { getProjectContext, MATRIX_CONNECTION_STATES } = require("./project-context");
const { getMatrixConfig, getQueuedReportsCount } = require("./matrix-client");
const { readWorkflowState } = require("./workflow-state");
const { getSprintTaskStatusReport } = require("./sprint-tasks");
const { getBriefPreconditions } = require("./brief-preconditions");
const { formatDirectCommand } = require("./direct-commands");
const { isClarificationsComplete } = require("./clarification-store");  // optional context, not a gate

function hasValue(text) {
  return typeof text === "string" && text.trim().length > 0;
}

function formatProjectType(reverseEngineering) {
  if (reverseEngineering === true) {
    return "yes";
  }
  if (reverseEngineering === false) {
    return "no";
  }
  return "pending";
}

function getLocalChecklist(root, briefPreconditions) {
  const envPath = path.join(root, ".env");
  const envLocalPath = path.join(root, ".env.local");
  const localAiCommand = process.env.LOCAL_IDE_AI_COMMAND || "";
  const refsDir = path.relative(root, briefPreconditions.referencesDir).replace(/\\/g, "/") || briefPreconditions.referencesDir;
  const sourceDir = path.relative(root, briefPreconditions.sourceDir).replace(/\\/g, "/") || briefPreconditions.sourceDir;
  const projectType = formatProjectType(briefPreconditions.reverseEngineering);

  return [
    {
      id: "project_type_selected",
      label: "Reverse engineering decision captured",
      done: projectType !== "pending",
      hint: "Run init --reverse-engineering yes|no."
    },
    {
      id: "refdocs_available",
      label: `Reference docs available in ${refsDir}`,
      done: briefPreconditions.referencesCount > 0,
      hint: "Add at least 1 refdoc before generate_brief."
    },
    {
      id: "source_available_if_required",
      label: briefPreconditions.sourceRequired
        ? `Source code available in ${sourceDir}`
        : "Source code required only for reverse engineering",
      done: !briefPreconditions.sourceRequired || briefPreconditions.sourceCount > 0,
      hint: briefPreconditions.sourceRequired
        ? "Add at least 1 source code file before generate_brief."
        : "No action required."
    },
    {
      id: "env_config",
      label: "Environment file present",
      done: fs.existsSync(envPath) || fs.existsSync(envLocalPath),
      hint: "Copy .env.example to .env and set local variables."
    },
    {
      id: "local_ai_command",
      label: "Local AI command configured",
      done: hasValue(localAiCommand) && localAiCommand.includes("{{INPUT_FILE}}") && localAiCommand.includes("{{OUTPUT_FILE}}"),
      hint: "Set LOCAL_IDE_AI_COMMAND with {{INPUT_FILE}} and {{OUTPUT_FILE}} placeholders."
    },
    {
      id: "spec_input_folder",
      label: "Spec input directory exists",
      done: fs.existsSync(path.join(root, "spec-kit", "input")),
      hint: "Ensure spec-kit/input exists before running planning commands."
    },
    {
      id: "planning_folder",
      label: "Planning directory exists",
      done: fs.existsSync(path.join(root, "planning")),
      hint: "Run generate_sprints to initialize planning outputs."
    },
    {
      id: "offline_queue_ready",
      label: "Offline queue directory ready",
      done: true,
      hint: "Queue is created automatically when matrix reporting fails."
    }
  ];
}

function buildNextAction(command, args, reason, blocked = false) {
  return {
    name: command,
    args: Array.isArray(args) ? args : [],
    command: formatDirectCommand(command, args),
    reason,
    blocked
  };
}

function computeNextCommand(workflow, briefPreconditions, root) {
  if (briefPreconditions.reverseEngineering === null) {
    return buildNextAction(
      "init",
      ["--reverse-engineering", "yes|no"],
      "Define project type first to unlock generate_brief.",
      true
    );
  }

  if (!workflow.brief.generated) {
    return buildNextAction(
      "generate_brief",
      [],
      briefPreconditions.ok
        ? "Generate the project brief. Run clarify_brief first if refdocs have ambiguities."
        : "Blocked until generate_brief preconditions are complete.",
      !briefPreconditions.ok
    );
  }
  if (!workflow.spec.generated) {
    return buildNextAction(
      "generate_spec_kit",
      [],
      "Generate Spec Kit artifacts. Run clarify_spec_kit first if the brief has ambiguities."
    );
  }
  if (!workflow.sprints.generated) {
    return buildNextAction(
      "generate_sprints",
      [],
      "Generate the full sprint plan. Run clarify_sprints first if the Spec Kit has ambiguities."
    );
  }
  if (workflow.sprints.active) {
    const a = workflow.sprints.active;
    const report = getSprintTaskStatusReport(root, a);
    const nextNum = a + 1;
    const hasNextPlanned = workflow.sprints.total > 0 && nextNum <= workflow.sprints.total;

    if (report.error === "missing_file" || report.error === "no_rows") {
      const rel = path.relative(root, report.path).replace(/\\/g, "/") || report.path;
      return buildNextAction(
        "continue_sprint",
        ["--sprint", String(a)],
        `Sprint ${a}: corrige \`${rel}\` (${report.error === "missing_file" ? "falta el archivo" : "sin filas de tareas"}). Luego vuelve a intentar.`,
        true
      );
    }

    if (report.ok && hasNextPlanned) {
      return buildNextAction(
        "start_sprint",
        ["--sprint", String(nextNum)],
        `Sprint ${a} tiene todas las tareas \`done\`. Ejecuta start_sprint --sprint ${nextNum} (cierra el ${a} automáticamente e inicia el siguiente).`
      );
    }
    if (report.ok && workflow.sprints.total > 0 && nextNum > workflow.sprints.total) {
      return buildNextAction(
        "planning:finalize",
        [],
        `Sprint ${a} completado (último sprint del plan).`
      );
    }

    if (!report.ok) {
      return buildNextAction(
        "continue_sprint",
        ["--sprint", String(a)],
        `Sprint ${a} incompleto (${report.pendingCount} tarea(s) sin \`done\`). Retoma el trabajo con continue_sprint; cuando todo esté \`done\`, \`start_sprint --sprint ${nextNum}\`${hasNextPlanned ? "" : " o planning:finalize si era el último sprint"}.`
      );
    }

    return buildNextAction(
      "start_sprint",
      ["--sprint", String(a)],
      `Sprint ${a} activo: usa start_sprint solo si debes re-ejecutar el script; para retomar trabajo pendiente usa continue_sprint.`
    );
  }

  const nextSprint = (workflow.sprints.completed?.length || 0) + 1;
  if (workflow.sprints.total > 0 && nextSprint <= workflow.sprints.total) {
    return buildNextAction(
      "start_sprint",
      ["--sprint", String(nextSprint)],
      `Desarrolla el sprint ${nextSprint} (el sprint anterior debe tener todas las tareas \`done\` en tasks.md).`
    );
  }

  return buildNextAction("planning:finalize", [], "Finalize planning package and generate ZIP.");
}

function computeBlockers(workflow, matrix, briefPreconditions) {
  const blockers = [];

  briefPreconditions.blockers.forEach((blocker) => {
    blockers.push({
      code: blocker.code,
      message: blocker.message,
      unblock: blocker.action,
      blocking: true
    });
  });

  if (matrix.connectionStatus === MATRIX_CONNECTION_STATES.PENDING_AUTH) {
    blockers.push({
      code: "matrix_pending_auth",
      message: "Matrix connection configured but not authorized.",
      unblock: "Run `npm run matrix:authorize -- --authorized-by \"<your-name>\"` or continue in local-only mode.",
      blocking: false
    });
  }

  if (matrix.connectionStatus === MATRIX_CONNECTION_STATES.DENIED) {
    blockers.push({
      code: "matrix_denied",
      message: "Matrix authorization was denied.",
      unblock: "Review MATRIX_API_KEY/projectId/workspaceId and retry authorization.",
      blocking: false
    });
  }

  if (matrix.connectionStatus === MATRIX_CONNECTION_STATES.CONNECTED && !matrix.apiKey) {
    blockers.push({
      code: "matrix_missing_api_key",
      message: "Matrix is marked as connected but MATRIX_API_KEY is not configured.",
      unblock: "Set MATRIX_API_KEY in .env to enable report delivery.",
      blocking: false
    });
  }

  return blockers;
}

function buildStatusSummary(root) {
  const project = getProjectContext(root);
  const matrix = getMatrixConfig(root);
  const workflow = readWorkflowState(root);
  const briefPreconditions = getBriefPreconditions(root);
  const queuedReports = getQueuedReportsCount(root);
  const checklist = getLocalChecklist(root, briefPreconditions);
  const nextAction = computeNextCommand(workflow, briefPreconditions, root);
  const blockers = computeBlockers(workflow, matrix, briefPreconditions);
  const clarifications = {
    brief: isClarificationsComplete(root, "brief"),
    spec_kit: isClarificationsComplete(root, "spec_kit"),
    sprints: isClarificationsComplete(root, "sprints")
  };

  return {
    generatedAt: new Date().toISOString(),
    project: {
      name: project.projectName,
      slug: project.projectSlug
    },
    mode: matrix.connectionStatus === MATRIX_CONNECTION_STATES.CONNECTED ? "connected-to-matrix" : "local-only",
    workflow,
    clarifications,
    briefPreconditions: {
      question: briefPreconditions.question,
      reverseEngineering: briefPreconditions.reverseEngineering,
      referencesDir: path.relative(root, briefPreconditions.referencesDir).replace(/\\/g, "/") || briefPreconditions.referencesDir,
      sourceDir: path.relative(root, briefPreconditions.sourceDir).replace(/\\/g, "/") || briefPreconditions.sourceDir,
      referencesCount: briefPreconditions.referencesCount,
      sourceCount: briefPreconditions.sourceCount,
      sourceRequired: briefPreconditions.sourceRequired,
      ready: briefPreconditions.ok
    },
    setupChecklist: checklist,
    matrix: {
      status: matrix.connectionStatus,
      apiKeyConfigured: Boolean(matrix.apiKey),
      baseUrl: matrix.baseUrl || null,
      projectId: matrix.projectId || null,
      workspaceId: matrix.workspaceId || null,
      authorizedAt: project.matrix.connection?.authorizedAt || null,
      authorizedBy: project.matrix.connection?.authorizedBy || null,
      deniedAt: project.matrix.connection?.deniedAt || null,
      deniedReason: project.matrix.connection?.deniedReason || null,
      queuedReports
    },
    nextAction,
    blockers
  };
}

module.exports = {
  buildStatusSummary
};
