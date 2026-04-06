const fs = require("fs");
const path = require("path");
const { ensureDir } = require("./io");

const REQUIRED_SPEC_ARTIFACTS = [
  "PRD.md",
  "technical-spec.md",
  "api-spec.yaml",
  "data-model.md",
  "epics.md",
  "stories.md",
  "sprint-plan.md",
  "test-plan.md"
];

function getWorkflowStatePath(root) {
  return path.join(root, "planning", "workflow-state.json");
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function hasFileContent(filePath) {
  return fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8").trim().length > 0;
}

function detectSpecArtifacts(root) {
  const specDir = path.join(root, "spec-kit", "input");
  const available = REQUIRED_SPEC_ARTIFACTS.filter((file) => hasFileContent(path.join(specDir, file)));
  return {
    available,
    complete: available.length === REQUIRED_SPEC_ARTIFACTS.length
  };
}

function readPlanningStatus(root) {
  return readJson(path.join(root, "planning", "planning-status.json"), {});
}

function readSprintState(root) {
  return readJson(path.join(root, "planning", "sprint-state.json"), {
    active: null,
    completed: []
  });
}

function listSprintFolders(root) {
  const sprintsRoot = path.join(root, "planning", "sprints");
  if (!fs.existsSync(sprintsRoot)) {
    return [];
  }

  return fs
    .readdirSync(sprintsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^sprint-\d+$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function getDefaultState() {
  return {
    version: 1,
    setup: {
      reverseEngineering: null,
      referencesDir: "refdocs",
      sourceDir: "source-code",
      initializedAt: null
    },
    status: "created",
    brief: {
      generated: false,
      approved: false,
      path: "spec-kit/input/brief.md",
      generatedAt: null,
      approvedAt: null
    },
    spec: {
      generated: false,
      approved: false,
      mode: "local",
      generatedAt: null,
      approvedAt: null,
      artifactFiles: []
    },
    sprints: {
      generated: false,
      approved: false,
      mode: "local",
      generatedAt: null,
      approvedAt: null,
      total: 0,
      active: null,
      completed: []
    },
    lastAction: {
      command: null,
      at: null,
      details: ""
    },
    updatedAt: null
  };
}

function computeStatus(state) {
  const hasProgress =
    Boolean(state.brief.generated) ||
    Boolean(state.brief.approved) ||
    Boolean(state.spec.generated) ||
    Boolean(state.spec.approved) ||
    Boolean(state.sprints.generated) ||
    Boolean(state.sprints.active) ||
    (Array.isArray(state.sprints.completed) && state.sprints.completed.length > 0);

  if (!hasProgress && (state.setup.reverseEngineering === null || state.setup.reverseEngineering === undefined)) {
    return "awaiting_project_type";
  }
  if (state.sprints.active) {
    return "sprint_active";
  }
  if ((state.sprints.completed || []).length > 0) {
    return "sprint_progress";
  }
  if (state.sprints.generated) {
    return "sprint_plan_generated";
  }
  if (state.spec.approved) {
    return "spec_approved";
  }
  if (state.spec.generated) {
    return "spec_generated";
  }
  if (state.brief.approved) {
    return "brief_approved";
  }
  if (state.brief.generated) {
    return "brief_generated";
  }
  return "created";
}

function normalizeState(root, inputState) {
  const base = getDefaultState();
  const state = {
    ...base,
    ...inputState,
    setup: {
      ...base.setup,
      ...(inputState?.setup || {})
    },
    brief: {
      ...base.brief,
      ...(inputState?.brief || {})
    },
    spec: {
      ...base.spec,
      ...(inputState?.spec || {})
    },
    sprints: {
      ...base.sprints,
      ...(inputState?.sprints || {})
    },
    lastAction: {
      ...base.lastAction,
      ...(inputState?.lastAction || {})
    }
  };

  const specArtifacts = detectSpecArtifacts(root);
  const planningStatus = readPlanningStatus(root);
  const sprintState = readSprintState(root);
  const sprintFolders = listSprintFolders(root);

  const reverseEngineeringRaw = state.setup.reverseEngineering;
  if (reverseEngineeringRaw === true || reverseEngineeringRaw === false) {
    state.setup.reverseEngineering = reverseEngineeringRaw;
  } else {
    state.setup.reverseEngineering = null;
  }

  if (typeof state.setup.referencesDir !== "string" || state.setup.referencesDir.trim().length === 0) {
    state.setup.referencesDir = base.setup.referencesDir;
  }
  if (typeof state.setup.sourceDir !== "string" || state.setup.sourceDir.trim().length === 0) {
    state.setup.sourceDir = base.setup.sourceDir;
  }

  state.brief.generated = Boolean(state.brief.generated);

  state.spec.generated = Boolean(state.spec.generated);
  state.spec.artifactFiles = Array.isArray(state.spec.artifactFiles)
    ? state.spec.artifactFiles
    : [];

  const planningGenerated = Boolean(planningStatus.generatedAt || planningStatus.finalizedAt || sprintFolders.length > 0);
  state.sprints.generated = Boolean(state.sprints.generated || planningGenerated);
  if (Number.isFinite(Number(planningStatus?.stats?.sprints))) {
    state.sprints.total = Math.max(state.sprints.total || 0, Number(planningStatus.stats.sprints));
  } else if (sprintFolders.length > 0) {
    state.sprints.total = Math.max(state.sprints.total || 0, sprintFolders.length);
  }

  const activeSprint = Number(sprintState.active);
  state.sprints.active = Number.isInteger(activeSprint) && activeSprint > 0 ? activeSprint : null;
  state.sprints.completed = Array.isArray(sprintState.completed)
    ? [...new Set(sprintState.completed.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
        .sort((a, b) => a - b)
    : [];

  if (state.sprints.generated) {
    state.spec.generated = true;
    state.spec.approved = true;
    state.brief.generated = true;
    state.brief.approved = true;
  } else if (state.spec.generated) {
    state.brief.generated = true;
    state.brief.approved = true;
  }

  if (state.spec.generated && state.spec.artifactFiles.length === 0 && specArtifacts.available.length > 0) {
    state.spec.artifactFiles = specArtifacts.available;
  }

  state.status = computeStatus(state);
  return state;
}

function readWorkflowState(root) {
  const filePath = getWorkflowStatePath(root);
  const parsed = readJson(filePath, getDefaultState());
  return normalizeState(root, parsed);
}

function writeWorkflowState(root, state) {
  const filePath = getWorkflowStatePath(root);
  ensureDir(path.dirname(filePath));
  const normalized = normalizeState(root, {
    ...state,
    updatedAt: new Date().toISOString()
  });
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

function updateWorkflowState(root, mutator) {
  const current = readWorkflowState(root);
  const next = mutator ? mutator(current) || current : current;
  return writeWorkflowState(root, next);
}

function markAction(root, command, details, transform) {
  return updateWorkflowState(root, (state) => {
    const next = transform ? transform(state) || state : state;
    next.lastAction = {
      command,
      details: details || "",
      at: new Date().toISOString()
    };
    return next;
  });
}

function markBriefGenerated(root, details) {
  return markAction(root, "generate_brief", details, (state) => {
    state.brief.generated = true;
    state.brief.generatedAt = new Date().toISOString();
    return state;
  });
}

function markProjectInitialized(root, setup, details) {
  return markAction(root, "init", details, (state) => {
    if (setup && Object.prototype.hasOwnProperty.call(setup, "reverseEngineering")) {
      state.setup.reverseEngineering =
        setup.reverseEngineering === true || setup.reverseEngineering === false
          ? setup.reverseEngineering
          : null;
    }

    if (setup?.referencesDir && typeof setup.referencesDir === "string") {
      state.setup.referencesDir = setup.referencesDir;
    }

    if (setup?.sourceDir && typeof setup.sourceDir === "string") {
      state.setup.sourceDir = setup.sourceDir;
    }

    state.setup.initializedAt = new Date().toISOString();
    return state;
  });
}

function markBriefApproved(root, details) {
  return markAction(root, "approve_brief", details, (state) => {
    state.brief.generated = true;
    state.brief.approved = true;
    state.brief.approvedAt = new Date().toISOString();
    return state;
  });
}

function markSpecGenerated(root, mode, artifacts, details) {
  return markAction(root, "generate_spec_kit", details, (state) => {
    state.brief.generated = true;
    state.brief.approved = true;
    if (!state.brief.approvedAt) {
      state.brief.approvedAt = new Date().toISOString();
    }
    state.spec.generated = true;
    state.spec.mode = mode || state.spec.mode || "local";
    state.spec.generatedAt = new Date().toISOString();
    state.spec.artifactFiles = Array.isArray(artifacts) ? artifacts : state.spec.artifactFiles;
    return state;
  });
}

function markSpecApproved(root, details) {
  return markAction(root, "approve_spec_kit", details, (state) => {
    state.spec.generated = true;
    state.spec.approved = true;
    state.spec.approvedAt = new Date().toISOString();
    return state;
  });
}

function markSprintsGenerated(root, mode, totalSprints, details) {
  return markAction(root, "generate_sprints", details, (state) => {
    state.spec.generated = true;
    state.spec.approved = true;
    if (!state.spec.approvedAt) {
      state.spec.approvedAt = new Date().toISOString();
    }
    state.brief.generated = true;
    state.brief.approved = true;
    state.sprints.generated = true;
    state.sprints.mode = mode || state.sprints.mode || "local";
    state.sprints.generatedAt = new Date().toISOString();
    if (Number.isInteger(totalSprints) && totalSprints > 0) {
      state.sprints.total = totalSprints;
    }
    return state;
  });
}

function markSprintsApproved(root, details) {
  return markAction(root, "approve_sprints_plan", details, (state) => {
    state.sprints.generated = true;
    state.sprints.approved = true;
    state.sprints.approvedAt = new Date().toISOString();
    return state;
  });
}

function markSprintStarted(root, sprint, details) {
  return markAction(root, "start_sprint", details, (state) => {
    state.sprints.generated = true;
    state.sprints.active = sprint;
    return state;
  });
}

function markSprintCompleted(root, sprint, details) {
  return markAction(root, "sprint_completed", details, (state) => {
    const completed = new Set(state.sprints.completed || []);
    completed.add(sprint);
    state.sprints.completed = [...completed].sort((a, b) => a - b);
    if (state.sprints.active === sprint) {
      state.sprints.active = null;
    }
    return state;
  });
}

/** Resume an already-active sprint (no change to active/completed; updates lastAction only). */
function markSprintContinued(root, sprint, details) {
  return markAction(root, "continue_sprint", details, (state) => state);
}

function resetWorkflowState(root) {
  return writeWorkflowState(root, getDefaultState());
}

module.exports = {
  REQUIRED_SPEC_ARTIFACTS,
  getDefaultState,
  readWorkflowState,
  writeWorkflowState,
  resetWorkflowState,
  markProjectInitialized,
  markBriefGenerated,
  markBriefApproved,
  markSpecGenerated,
  markSpecApproved,
  markSprintsGenerated,
  markSprintsApproved,
  markSprintStarted,
  markSprintCompleted,
  markSprintContinued
};
