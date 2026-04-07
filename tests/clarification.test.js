const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  parseAnswer,
  isClarificationsComplete,
  writeClarifications,
  readClarifications,
  BRIEF_QUESTIONS,
  SPRINTS_QUESTIONS,
} = require('../scripts/lib/clarification-store');

const { buildStatusSummary } = require('../scripts/lib/status-summary');

const GENERATE_BRIEF_SCRIPT = path.join(
  __dirname,
  '..',
  'scripts',
  'generate-brief.js',
);
const PLAN_SPRINTS_SCRIPT = path.join(
  __dirname,
  '..',
  'scripts',
  'plan-all-sprints.js',
);
const CLARIFY_BRIEF_SCRIPT = path.join(
  __dirname,
  '..',
  'scripts',
  'clarify-brief.js',
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-clarification-'));
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.mkdirSync(path.join(root, 'spec-kit', 'input'), { recursive: true });
  fs.mkdirSync(path.join(root, 'refdocs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'source-code'), { recursive: true });
  fs.mkdirSync(path.join(root, 'planning'), { recursive: true });

  const config = {
    projectName: 'Test Project',
    projectSlug: 'test-project',
    matrix: {
      baseUrl: '',
      projectId: '',
      workspaceId: '',
      reportPath: '/api/vision/local-projects/report',
      validateBriefPath: '/api/vision/briefings/validate',
      generateSpecPath: '/api/vision/spec-kit/generate',
      authorizePath: '/api/vision/local-projects/authorize',
      connection: { status: 'disconnected', authorizationToken: '' },
    },
  };

  fs.writeFileSync(
    path.join(root, 'config', 'project.config.json'),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8',
  );
  return root;
}

function writeWorkflowState(root, overrides = {}) {
  const state = {
    version: 1,
    setup: {
      reverseEngineering: false,
      referencesDir: 'refdocs',
      sourceDir: 'source-code',
    },
    status: 'created',
    brief: { generated: false, approved: false },
    spec: { generated: false, approved: false },
    sprints: {
      generated: false,
      approved: false,
      total: 0,
      active: null,
      completed: [],
    },
    lastAction: { command: null, at: null, details: '' },
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
  fs.writeFileSync(
    path.join(root, 'planning', 'workflow-state.json'),
    `${JSON.stringify(state, null, 2)}\n`,
    'utf8',
  );
}

function writeBriefClarifications(root) {
  const answers = {};
  for (const q of BRIEF_QUESTIONS) {
    answers[q.id] = q.options[0];
  }
  writeClarifications(root, 'brief', answers);
}

function writeSprintsClarifications(root) {
  const answers = {};
  for (const q of SPRINTS_QUESTIONS) {
    answers[q.id] = q.options[0];
  }
  writeClarifications(root, 'sprints', answers);
}

function runScript(script, root, extraEnv = {}) {
  const projectNodeModules = path.join(__dirname, '..', 'node_modules');
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_PATH: projectNodeModules,
      LOCAL_IDE_AI_COMMAND: '',
      ...extraEnv,
    },
  });
}

// ---------------------------------------------------------------------------
// parseAnswer — numeric selection
// ---------------------------------------------------------------------------

test("parseAnswer selects first option with '1'", () => {
  const result = parseAnswer('1', ['Ejecutivo', 'Tecnico', 'Mixto']);
  assert.equal(result.valid, true);
  assert.equal(result.value, 'Ejecutivo');
});

test('parseAnswer selects last option by number', () => {
  const result = parseAnswer('3', ['A', 'B', 'C']);
  assert.equal(result.valid, true);
  assert.equal(result.value, 'C');
});

// ---------------------------------------------------------------------------
// parseAnswer — free text
// ---------------------------------------------------------------------------

test('parseAnswer accepts non-numeric input as free text', () => {
  const result = parseAnswer('Mi respuesta personalizada', ['A', 'B']);
  assert.equal(result.valid, true);
  assert.equal(result.value, 'Mi respuesta personalizada');
});

test('parseAnswer trims whitespace from free text', () => {
  const result = parseAnswer('  hola mundo  ', ['A', 'B']);
  assert.equal(result.valid, true);
  assert.equal(result.value, 'hola mundo');
});

// ---------------------------------------------------------------------------
// parseAnswer — invalid input
// ---------------------------------------------------------------------------

test('parseAnswer rejects out-of-range number', () => {
  const result = parseAnswer('5', ['A', 'B', 'C']);
  assert.equal(result.valid, false);
  assert.ok(typeof result.reason === 'string' && result.reason.length > 0);
});

test('parseAnswer rejects empty string', () => {
  const result = parseAnswer('', ['A', 'B']);
  assert.equal(result.valid, false);
});

test('parseAnswer rejects whitespace-only input', () => {
  const result = parseAnswer('   ', ['A', 'B']);
  assert.equal(result.valid, false);
});

// ---------------------------------------------------------------------------
// parseAnswer — 0 → needsFreeText
// ---------------------------------------------------------------------------

test("parseAnswer '0' returns needsFreeText flag", () => {
  const result = parseAnswer('0', ['A', 'B', 'C']);
  assert.equal(result.valid, true);
  assert.equal(result.needsFreeText, true);
  assert.equal(result.value, undefined);
});

// ---------------------------------------------------------------------------
// isClarificationsComplete
// ---------------------------------------------------------------------------

test('isClarificationsComplete returns false when file is missing', () => {
  const root = createTempProject();
  try {
    assert.equal(isClarificationsComplete(root, 'brief'), false);
    assert.equal(isClarificationsComplete(root, 'sprints'), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('isClarificationsComplete returns false when answers are incomplete', () => {
  const root = createTempProject();
  try {
    writeClarifications(root, 'brief', { brief_tone: 'Ejecutivo' });
    assert.equal(isClarificationsComplete(root, 'brief'), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('isClarificationsComplete returns false when an answer is empty string', () => {
  const root = createTempProject();
  try {
    const answers = {};
    for (const q of BRIEF_QUESTIONS) {
      answers[q.id] = q.options[0];
    }
    answers[BRIEF_QUESTIONS[0].id] = '';
    writeClarifications(root, 'brief', answers);
    assert.equal(isClarificationsComplete(root, 'brief'), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('isClarificationsComplete returns true when all questions answered', () => {
  const root = createTempProject();
  try {
    writeBriefClarifications(root);
    assert.equal(isClarificationsComplete(root, 'brief'), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('isClarificationsComplete works for sprints stage', () => {
  const root = createTempProject();
  try {
    writeSprintsClarifications(root);
    assert.equal(isClarificationsComplete(root, 'sprints'), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// generate_brief blocked when clarifications missing
// ---------------------------------------------------------------------------

test('generate_brief is blocked when brief clarifications are missing', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root);
    fs.writeFileSync(
      path.join(root, 'refdocs', 'context.md'),
      '# Context\n',
      'utf8',
    );
    const result = runScript(GENERATE_BRIEF_SCRIPT, root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /generate_brief blocked\./i);
    assert.match(result.stderr, /clarify_brief/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('generate_brief succeeds when clarifications are complete', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root);
    fs.writeFileSync(
      path.join(root, 'refdocs', 'context.md'),
      '# Context\n',
      'utf8',
    );
    writeBriefClarifications(root);
    const result = runScript(GENERATE_BRIEF_SCRIPT, root);
    assert.equal(result.status, 0);
    assert.ok(fs.existsSync(path.join(root, 'spec-kit', 'input', 'brief.md')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// generate_sprints blocked when clarifications missing
// ---------------------------------------------------------------------------

test('generate_sprints is blocked when sprints clarifications are missing', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root, {
      status: 'spec_approved',
      brief: { generated: true, approved: true },
      spec: { generated: true, approved: true },
      sprints: {
        generated: false,
        approved: false,
        total: 0,
        active: null,
        completed: [],
      },
    });
    const result = runScript(PLAN_SPRINTS_SCRIPT, root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /generate_sprints blocked\./i);
    assert.match(result.stderr, /clarify_sprints/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// nextAction points to clarify_* when clarifications are missing
// ---------------------------------------------------------------------------

test('nextAction is generate_brief (blocked) when brief clarifications are missing', () => {
  const root = createTempProject();
  try {
    fs.writeFileSync(
      path.join(root, 'refdocs', 'requirements.md'),
      '# refdoc\n',
      'utf8',
    );
    writeWorkflowState(root);
    const summary = buildStatusSummary(root);
    assert.equal(summary.nextAction.name, 'generate_brief');
    assert.equal(summary.nextAction.blocked, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('nextAction is generate_brief when brief clarifications are complete', () => {
  const root = createTempProject();
  try {
    fs.writeFileSync(
      path.join(root, 'refdocs', 'requirements.md'),
      '# refdoc\n',
      'utf8',
    );
    writeWorkflowState(root);
    writeBriefClarifications(root);
    const summary = buildStatusSummary(root);
    assert.equal(summary.nextAction.name, 'generate_brief');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('nextAction is generate_sprints (blocked) when sprints clarifications are missing', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root, {
      status: 'spec_approved',
      brief: { generated: true, approved: true },
      spec: { generated: true, approved: true },
      sprints: {
        generated: false,
        approved: false,
        total: 0,
        active: null,
        completed: [],
      },
    });
    const summary = buildStatusSummary(root);
    assert.equal(summary.nextAction.name, 'generate_sprints');
    assert.equal(summary.nextAction.blocked, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('nextAction is generate_sprints when sprints clarifications are complete', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root, {
      status: 'spec_approved',
      brief: { generated: true, approved: true },
      spec: { generated: true, approved: true },
      sprints: {
        generated: false,
        approved: false,
        total: 0,
        active: null,
        completed: [],
      },
    });
    writeSprintsClarifications(root);
    const summary = buildStatusSummary(root);
    assert.equal(summary.nextAction.name, 'generate_sprints');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// clarification status in summary
// ---------------------------------------------------------------------------

test('buildStatusSummary includes clarifications status', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root);
    const summary = buildStatusSummary(root);
    assert.ok(typeof summary.clarifications === 'object');
    assert.ok(
      Object.prototype.hasOwnProperty.call(summary.clarifications, 'brief'),
    );
    assert.ok(
      Object.prototype.hasOwnProperty.call(summary.clarifications, 'sprints'),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// clarify_brief --answers-file (non-interactive agent mode)
// ---------------------------------------------------------------------------

test('clarify_brief --answers-file saves valid clarifications', () => {
  const root = createTempProject();
  try {
    const answersObj = {};
    for (const q of BRIEF_QUESTIONS) {
      answersObj[q.id] = q.options[0];
    }
    const answersFile = path.join(root, 'answers.json');
    fs.writeFileSync(answersFile, JSON.stringify(answersObj), 'utf8');

    const result = spawnSync(
      process.execPath,
      [CLARIFY_BRIEF_SCRIPT, '--answers-file', answersFile],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env },
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(isClarificationsComplete(root, 'brief'), true);

    const saved = readClarifications(root, 'brief');
    assert.ok(saved && saved.answers);
    assert.equal(saved.answers.brief_tone, BRIEF_QUESTIONS[0].options[0]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('clarify_brief --answers-file fails when a question is missing', () => {
  const root = createTempProject();
  try {
    const answersFile = path.join(root, 'answers.json');
    fs.writeFileSync(
      answersFile,
      JSON.stringify({ brief_tone: 'Ejecutivo' }),
      'utf8',
    );

    const result = spawnSync(
      process.execPath,
      [CLARIFY_BRIEF_SCRIPT, '--answers-file', answersFile],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env },
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing answer/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
