const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { reportToMatrix, getMatrixConfig, resolveMatrixEligibility } = require("../scripts/lib/matrix-client");

function createTempProject(status) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vision-matrix-client-"));
  fs.mkdirSync(path.join(root, "config"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "config", "project.config.json"),
    `${JSON.stringify(
      {
        projectName: "Matrix Test",
        projectSlug: "matrix-test",
        matrix: {
          baseUrl: "http://localhost:4000",
          projectId: "p-123",
          workspaceId: "w-123",
          reportPath: "/api/vision/local-projects/report",
          connection: {
            status,
            authorizationToken: status === "connected" ? "token-123" : ""
          }
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  return root;
}

test("reportToMatrix skips cleanly when authorization is pending", async () => {
  const root = createTempProject("pending_auth");

  try {
    const config = getMatrixConfig(root);
    const eligibility = resolveMatrixEligibility(config);
    assert.equal(eligibility.ok, false);
    assert.equal(eligibility.reason, "pending_auth");

    const result = await reportToMatrix(root, { eventType: "brief_generated" });
    assert.equal(result.sent, false);
    assert.equal(result.skipped, true);
    assert.equal(result.reason, "pending_auth");

    const queuePath = path.join(root, ".matrix", "pending-reports.ndjson");
    assert.equal(fs.existsSync(queuePath), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
