const fs = require("fs");
const path = require("path");
const { ensureDir, readFileIfExists } = require("./io");
const { getProjectContext, MATRIX_CONNECTION_STATES } = require("./project-context");

function getMatrixConfig(root = process.cwd()) {
  const context = getProjectContext(root);
  const matrix = context.matrix || {};
  return {
    baseUrl: (process.env.MATRIX_BASE_URL || matrix.baseUrl || "").replace(/\/$/, ""),
    apiKey: process.env.MATRIX_API_KEY || "",
    reportPath: process.env.MATRIX_REPORT_PATH || matrix.reportPath || "/api/vision/local-projects/report",
    validateBriefPath: process.env.MATRIX_VALIDATE_BRIEF_PATH || matrix.validateBriefPath || "/api/vision/briefings/validate",
    generateSpecPath: process.env.MATRIX_GENERATE_SPEC_PATH || matrix.generateSpecPath || "/api/vision/spec-kit/generate",
    authorizePath: process.env.MATRIX_AUTHORIZE_PATH || matrix.authorizePath || "/api/vision/local-projects/authorize",
    connectionStatus: matrix.connection?.status || MATRIX_CONNECTION_STATES.DISCONNECTED,
    authorizationToken: matrix.connection?.authorizationToken || "",
    projectId: matrix.projectId || "",
    workspaceId: matrix.workspaceId || "",
    projectName: context.projectName,
    projectSlug: context.projectSlug
  };
}

function getQueuePath(root) {
  return path.join(root, ".matrix", "pending-reports.ndjson");
}

function getQueuedReportsCount(root) {
  const queuePath = getQueuePath(root);
  if (!fs.existsSync(queuePath)) {
    return 0;
  }
  return readFileIfExists(queuePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function appendQueue(root, payload) {
  const queuePath = getQueuePath(root);
  ensureDir(path.dirname(queuePath));
  fs.appendFileSync(queuePath, `${JSON.stringify(payload)}\n`, "utf8");
}

function resolveMatrixEligibility(config) {
  if (config.connectionStatus !== MATRIX_CONNECTION_STATES.CONNECTED) {
    return {
      ok: false,
      reason: config.connectionStatus === MATRIX_CONNECTION_STATES.PENDING_AUTH
        ? "pending_auth"
        : config.connectionStatus === MATRIX_CONNECTION_STATES.DENIED
          ? "authorization_denied"
          : "disconnected"
    };
  }

  if (!config.baseUrl) {
    return { ok: false, reason: "missing_base_url" };
  }
  if (!config.apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }
  if (!config.authorizationToken) {
    return { ok: false, reason: "missing_authorization_token" };
  }

  return { ok: true };
}

function buildHeaders(config) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  if (config.authorizationToken) {
    headers["x-vision-connection-token"] = config.authorizationToken;
  }

  return headers;
}

async function postMatrix(config, routePath, payload) {
  if (!config.baseUrl) {
    throw new Error("MATRIX_BASE_URL is not configured.");
  }

  const response = await fetch(`${config.baseUrl}${routePath}`, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify(payload)
  });
  const responseText = await response.text();
  let body;
  try {
    body = responseText ? JSON.parse(responseText) : {};
  } catch (_error) {
    body = { raw: responseText };
  }
  if (!response.ok) {
    throw new Error(`Matrix API error ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function postMatrixRoute(root, routePath, payload) {
  const config = getMatrixConfig(root);
  const eligibility = resolveMatrixEligibility(config);

  if (!eligibility.ok) {
    return { sent: false, skipped: true, reason: eligibility.reason };
  }

  try {
    const result = await postMatrix(config, routePath, payload);
    return { sent: true, result };
  } catch (error) {
    appendQueue(root, {
      queuedAt: new Date().toISOString(),
      routePath,
      payload,
      error: error.message
    });
    return { sent: false, queued: true, error: error.message };
  }
}

async function reportToMatrix(root, payload) {
  const config = getMatrixConfig(root);
  const eligibility = resolveMatrixEligibility(config);

  if (!eligibility.ok) {
    return {
      sent: false,
      skipped: true,
      reason: eligibility.reason
    };
  }

  try {
    const result = await postMatrix(config, config.reportPath, payload);
    return { sent: true, result };
  } catch (error) {
    appendQueue(root, {
      queuedAt: new Date().toISOString(),
      routePath: config.reportPath,
      payload,
      error: error.message
    });
    return { sent: false, queued: true, error: error.message };
  }
}

async function syncPendingReports(root) {
  const queuePath = getQueuePath(root);
  if (!fs.existsSync(queuePath)) {
    return { synced: 0, remaining: 0 };
  }

  const config = getMatrixConfig(root);
  const eligibility = resolveMatrixEligibility(config);
  if (!eligibility.ok) {
    return { synced: 0, remaining: getQueuedReportsCount(root), skipped: true, reason: eligibility.reason };
  }

  const lines = readFileIfExists(queuePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pending = lines.map((line) => JSON.parse(line));
  const failed = [];
  let synced = 0;

  for (const item of pending) {
    try {
      await postMatrix(config, item.routePath || config.reportPath, item.payload);
      synced += 1;
    } catch (_error) {
      failed.push(item);
    }
  }

  if (failed.length === 0) {
    fs.rmSync(queuePath, { force: true });
  } else {
    fs.writeFileSync(queuePath, `${failed.map((item) => JSON.stringify(item)).join("\n")}\n`, "utf8");
  }

  return { synced, remaining: failed.length };
}

async function validateBriefingInMatrix({ root, brief, projectName, projectSlug, projectId, workspaceId }) {
  const config = getMatrixConfig(root);
  const eligibility = resolveMatrixEligibility(config);
  if (!eligibility.ok) {
    throw new Error(`Matrix validation requires authorized connection (${eligibility.reason}).`);
  }

  const payload = {
    projectName,
    projectSlug,
    brief,
    projectId,
    workspaceId
  };
  return postMatrix(config, config.validateBriefPath, payload);
}

async function generateSpecInMatrix({
  root,
  brief,
  product_prd: productPrd,
  projectName,
  projectSlug,
  projectId,
  workspaceId
}) {
  const config = getMatrixConfig(root);
  const eligibility = resolveMatrixEligibility(config);
  if (!eligibility.ok) {
    throw new Error(`Matrix spec generation requires authorized connection (${eligibility.reason}).`);
  }

  const payload = {
    projectName,
    projectSlug,
    brief,
    product_prd: productPrd || "",
    projectId,
    workspaceId
  };
  return postMatrix(config, config.generateSpecPath, payload);
}

async function requestMatrixAuthorization({
  root,
  requestedBy,
  projectId,
  workspaceId
}) {
  const config = getMatrixConfig(root);
  if (!config.baseUrl) {
    throw new Error("MATRIX_BASE_URL is not configured.");
  }
  if (!config.apiKey) {
    throw new Error("MATRIX_API_KEY is required to authorize matrix connection.");
  }

  const resolvedProjectId = projectId || config.projectId;
  const resolvedWorkspaceId = workspaceId || config.workspaceId;
  if (!resolvedProjectId || !resolvedWorkspaceId) {
    throw new Error("projectId and workspaceId are required before authorization.");
  }

  const response = await fetch(`${config.baseUrl}${config.authorizePath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      projectId: resolvedProjectId,
      workspaceId: resolvedWorkspaceId,
      projectName: config.projectName,
      projectSlug: config.projectSlug,
      requestedBy: requestedBy || process.env.USER || process.env.USERNAME || "local-developer"
    })
  });

  const responseText = await response.text();
  let body;
  try {
    body = responseText ? JSON.parse(responseText) : {};
  } catch (_error) {
    body = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`Matrix authorization error ${response.status}: ${JSON.stringify(body)}`);
  }

  if (!body.authorizationToken) {
    throw new Error("Matrix authorization response missing authorizationToken.");
  }

  return body;
}

module.exports = {
  reportToMatrix,
  postMatrixRoute,
  syncPendingReports,
  validateBriefingInMatrix,
  generateSpecInMatrix,
  requestMatrixAuthorization,
  getQueuedReportsCount,
  getMatrixConfig,
  resolveMatrixEligibility
};
