const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildStatusSummary } = require("../scripts/lib/status-summary");
const { writeClarifications } = require("../scripts/lib/clarification-store");

function createTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vision-blank-project-"));
  fs.mkdirSync(path.join(root, "config"), { recursive: true });
  fs.mkdirSync(path.join(root, "spec-kit", "input"), { recursive: true });
  fs.mkdirSync(path.join(root, "refdocs"), { recursive: true });
  fs.mkdirSync(path.join(root, "planning"), { recursive: true });

  const config = {
    projectName: "Test Project",
    projectSlug: "test-project",
    matrix: {
      baseUrl: "",
      projectId: "",
      workspaceId: "",
      reportPath: "/api/vision/local-projects/report",
      validateBriefPath: "/api/vision/briefings/validate",
      generateSpecPath: "/api/vision/spec-kit/generate",
      authorizePath: "/api/vision/local-projects/authorize",
      connection: {
        status: "disconnected",
        authorizationToken: ""
      }
    }
  };

  fs.writeFileSync(path.join(root, "config", "project.config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return root;
}

test("status summary defaults to local-only and requires project type selection first", () => {
  const root = createTempProject();

  try {
    const summary = buildStatusSummary(root);
    assert.equal(summary.mode, "local-only");
    assert.equal(summary.workflow.status, "awaiting_project_type");
    assert.equal(summary.nextAction.command, "init --reverse-engineering yes|no");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("status summary recommends generate_brief when preconditions are ready (clarify_brief is optional)", () => {
  const root = createTempProject();
  try {
    fs.writeFileSync(path.join(root, "refdocs", "requirements.md"), "# refdoc\n", "utf8");
    fs.writeFileSync(
      path.join(root, "planning", "workflow-state.json"),
      `${JSON.stringify(
        {
          version: 1,
          setup: { reverseEngineering: false, referencesDir: "refdocs", sourceDir: "source-code" },
          status: "created",
          brief: { generated: false, approved: false },
          spec: { generated: false, approved: false },
          sprints: { generated: false, approved: false, total: 0, active: null, completed: [] }
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const summary = buildStatusSummary(root);
    assert.equal(summary.nextAction.command, "generate_brief");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("status summary still recommends generate_brief after optional brief clarifications file exists", () => {
  const root = createTempProject();
  try {
    fs.writeFileSync(path.join(root, "refdocs", "requirements.md"), "# refdoc\n", "utf8");
    fs.writeFileSync(
      path.join(root, "planning", "workflow-state.json"),
      `${JSON.stringify(
        {
          version: 1,
          setup: { reverseEngineering: false, referencesDir: "refdocs", sourceDir: "source-code" },
          status: "created",
          brief: { generated: false, approved: false },
          spec: { generated: false, approved: false },
          sprints: { generated: false, approved: false, total: 0, active: null, completed: [] }
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    writeClarifications(root, "brief", { sample_question: "sample answer" });

    const summary = buildStatusSummary(root);
    assert.equal(summary.nextAction.command, "generate_brief");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("status summary recommends continue_sprint when active sprint has pending tasks", () => {
  const root = createTempProject();
  try {
    fs.mkdirSync(path.join(root, "planning", "sprints", "sprint-01"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "planning", "sprints", "sprint-01", "tasks.md"),
      [
        "| Task | Title | Status |",
        "|---|---|---|",
        "| T-001 | One | done |",
        "| T-002 | Two | todo |",
        ""
      ].join("\n"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(root, "planning", "workflow-state.json"),
      `${JSON.stringify(
        {
          version: 1,
          setup: { reverseEngineering: false, referencesDir: "refdocs", sourceDir: "source-code" },
          status: "sprint_active",
          brief: { generated: true, approved: true },
          spec: { generated: true, approved: true },
          sprints: {
            generated: true,
            approved: true,
            total: 3,
            active: 1,
            completed: []
          },
          lastAction: { command: "start_sprint", at: new Date().toISOString(), details: "" }
        },
        null,
        2
      )}\n`,
      "utf8"
    );
    fs.writeFileSync(
      path.join(root, "planning", "sprint-state.json"),
      `${JSON.stringify({ active: 1, completed: [] }, null, 2)}\n`,
      "utf8"
    );

    const summary = buildStatusSummary(root);
    assert.equal(summary.nextAction.name, "continue_sprint");
    assert.equal(summary.nextAction.args[1], "1");
    assert.equal(summary.nextAction.blocked, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("status summary advances next command after brief exists", () => {
  const root = createTempProject();
  try {
    fs.writeFileSync(path.join(root, "refdocs", "requirements.md"), "# refdoc\n", "utf8");
    fs.writeFileSync(
      path.join(root, "planning", "workflow-state.json"),
      `${JSON.stringify(
        {
          version: 1,
          setup: {
            reverseEngineering: false,
            referencesDir: "refdocs",
            sourceDir: "source-code"
          },
          status: "brief_generated",
          brief: { generated: true, approved: false },
          spec: { generated: false, approved: false },
          sprints: { generated: false, approved: false, total: 0, active: null, completed: [] },
          lastAction: { command: "generate_brief", at: new Date().toISOString(), details: "generated" }
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const summary = buildStatusSummary(root);
    assert.equal(summary.workflow.brief.generated, true);
    assert.equal(summary.nextAction.command, "generate_spec_kit");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
