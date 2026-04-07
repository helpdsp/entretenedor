const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RESET_PROJECT_SCRIPT = path.join(
  __dirname,
  '..',
  'scripts',
  'reset-project.js',
);

function createTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-reset-project-'));
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.mkdirSync(path.join(root, 'spec-kit', 'input'), { recursive: true });
  fs.mkdirSync(path.join(root, 'refdocs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'source-code'), { recursive: true });
  fs.mkdirSync(path.join(root, 'planning', 'sprints', 'sprint-01'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, '.matrix'), { recursive: true });
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

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

test('reset_project removes generated artifacts and preserves refdocs/source code', () => {
  const root = createTempProject();

  try {
    fs.writeFileSync(
      path.join(root, 'refdocs', 'context.md'),
      '# user refdoc\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'spec-kit', 'input', 'brief.md'),
      '# generated brief\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'spec-kit', 'input', 'PRD.md'),
      '# generated PRD\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'source-code', 'app.ts'),
      'export const x = 1;\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'planning', 'sprint-index.md'),
      '# generated\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'planning', 'sprints', 'sprint-01', 'tasks.md'),
      '# tasks\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, '.matrix', 'pending-reports.ndjson'),
      '{}\n',
      'utf8',
    );
    fs.writeFileSync(path.join(root, 'dist', 'artifact.zip'), 'zip\n', 'utf8');
    fs.writeFileSync(
      path.join(root, 'planning', 'workflow-state.json'),
      `${JSON.stringify(
        {
          version: 1,
          setup: {
            reverseEngineering: true,
            referencesDir: 'refdocs',
            sourceDir: 'source-code',
          },
          status: 'spec_generated',
          brief: { generated: true, approved: true },
          spec: { generated: true, approved: false, artifactFiles: ['PRD.md'] },
          sprints: {
            generated: false,
            approved: false,
            total: 0,
            active: null,
            completed: [],
          },
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const result = spawnSync(process.execPath, [RESET_PROJECT_SCRIPT], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_PATH: path.join(__dirname, '..', 'node_modules'),
      },
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);

    assert.equal(fs.existsSync(path.join(root, 'refdocs', 'context.md')), true);
    assert.equal(fs.existsSync(path.join(root, 'source-code', 'app.ts')), true);

    assert.equal(
      fs.existsSync(path.join(root, 'spec-kit', 'input', 'brief.md')),
      false,
    );
    assert.equal(
      fs.existsSync(path.join(root, 'spec-kit', 'input', 'PRD.md')),
      false,
    );
    assert.equal(
      fs.existsSync(path.join(root, 'planning', 'sprint-index.md')),
      false,
    );
    assert.equal(fs.existsSync(path.join(root, 'dist')), false);
    assert.equal(fs.existsSync(path.join(root, '.matrix')), false);

    const sprintsDir = path.join(root, 'planning', 'sprints');
    assert.equal(fs.existsSync(sprintsDir), true);
    assert.deepEqual(fs.readdirSync(sprintsDir), []);

    const workflowStatePath = path.join(
      root,
      'planning',
      'workflow-state.json',
    );
    assert.equal(fs.existsSync(workflowStatePath), true);
    const workflow = JSON.parse(fs.readFileSync(workflowStatePath, 'utf8'));
    assert.equal(workflow.status, 'awaiting_project_type');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
