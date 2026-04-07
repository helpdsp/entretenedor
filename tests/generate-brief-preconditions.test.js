const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const GENERATE_BRIEF_SCRIPT = path.join(
  __dirname,
  '..',
  'scripts',
  'generate-brief.js',
);
const {
  writeClarifications,
  BRIEF_QUESTIONS,
} = require('../scripts/lib/clarification-store');

function createTempProject() {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'vision-brief-preconditions-'),
  );
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
      connection: {
        status: 'disconnected',
        authorizationToken: '',
      },
    },
  };

  fs.writeFileSync(
    path.join(root, 'config', 'project.config.json'),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8',
  );
  return root;
}

function writeWorkflowState(root, reverseEngineering) {
  const state = {
    version: 1,
    setup: {
      reverseEngineering,
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
  };

  fs.writeFileSync(
    path.join(root, 'planning', 'workflow-state.json'),
    `${JSON.stringify(state, null, 2)}\n`,
    'utf8',
  );
}

function runGenerateBrief(root) {
  return spawnSync(process.execPath, [GENERATE_BRIEF_SCRIPT], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_PATH: path.join(__dirname, '..', 'node_modules'),
      LOCAL_IDE_AI_COMMAND: '',
    },
  });
}

test('generate_brief is blocked when no refdocs exist', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root, false);
    const answers = {};
    for (const q of BRIEF_QUESTIONS) {
      answers[q.id] = q.options[0];
    }
    writeClarifications(root, 'brief', answers);
    const result = runGenerateBrief(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /generate_brief blocked\./i);
    assert.match(result.stderr, /No reference documents found/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('generate_brief is blocked when reverse engineering is enabled but source code is missing', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root, true);
    fs.writeFileSync(
      path.join(root, 'refdocs', 'context.md'),
      '# Context\n',
      'utf8',
    );
    const answers = {};
    for (const q of BRIEF_QUESTIONS) {
      answers[q.id] = q.options[0];
    }
    writeClarifications(root, 'brief', answers);
    const result = runGenerateBrief(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /generate_brief blocked\./i);
    assert.match(
      result.stderr,
      /Reverse engineering mode requires source files/i,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('generate_brief succeeds when preconditions are satisfied', () => {
  const root = createTempProject();
  try {
    writeWorkflowState(root, true);
    fs.writeFileSync(
      path.join(root, 'refdocs', 'context.md'),
      '# Context\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'source-code', 'app.ts'),
      'export const x = 1;\n',
      'utf8',
    );

    const answers = {};
    for (const q of BRIEF_QUESTIONS) {
      answers[q.id] = q.options[0];
    }
    writeClarifications(root, 'brief', answers);

    const result = runGenerateBrief(root);
    assert.equal(result.status, 0);
    assert.ok(fs.existsSync(path.join(root, 'spec-kit', 'input', 'brief.md')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
