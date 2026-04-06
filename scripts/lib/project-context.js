const fs = require("fs");
const path = require("path");

const MATRIX_CONNECTION_STATES = Object.freeze({
  DISCONNECTED: "disconnected",
  PENDING_AUTH: "pending_auth",
  CONNECTED: "connected",
  DENIED: "denied"
});

function getConfigPath(root) {
  return path.join(root, "config", "project.config.json");
}

function readProjectConfig(root) {
  const configPath = getConfigPath(root);
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (_error) {
    return {};
  }
}

function writeProjectConfig(root, config) {
  const configPath = getConfigPath(root);
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function toStringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMatrixConfig(config) {
  const matrix = config?.matrix || {};
  const connection = matrix.connection || {};
  const baseUrl = toStringValue(matrix.baseUrl || process.env.MATRIX_BASE_URL).replace(/\/$/, "");
  const projectId = toStringValue(matrix.projectId);
  const workspaceId = toStringValue(matrix.workspaceId);
  const authorizationToken = toStringValue(connection.authorizationToken);

  let status = toStringValue(connection.status);
  if (!Object.values(MATRIX_CONNECTION_STATES).includes(status)) {
    status = baseUrl || projectId || workspaceId
      ? MATRIX_CONNECTION_STATES.PENDING_AUTH
      : MATRIX_CONNECTION_STATES.DISCONNECTED;
  }

  if (status === MATRIX_CONNECTION_STATES.CONNECTED && (!baseUrl || !authorizationToken)) {
    status = MATRIX_CONNECTION_STATES.PENDING_AUTH;
  }

  return {
    baseUrl,
    projectId,
    workspaceId,
    connectedAt: matrix.connectedAt || null,
    reportPath: toStringValue(matrix.reportPath) || "/api/vision/local-projects/report",
    validateBriefPath: toStringValue(matrix.validateBriefPath) || "/api/vision/briefings/validate",
    generateSpecPath: toStringValue(matrix.generateSpecPath) || "/api/vision/spec-kit/generate",
    authorizePath: toStringValue(matrix.authorizePath) || "/api/vision/local-projects/authorize",
    connection: {
      status,
      authorizationToken,
      authorizedAt: connection.authorizedAt || null,
      authorizedBy: toStringValue(connection.authorizedBy),
      deniedAt: connection.deniedAt || null,
      deniedReason: toStringValue(connection.deniedReason),
      lastError: toStringValue(connection.lastError)
    }
  };
}

function getProjectContext(root) {
  const config = readProjectConfig(root);
  const matrix = normalizeMatrixConfig(config);
  const matrixMode = matrix.connection.status === MATRIX_CONNECTION_STATES.CONNECTED ? "connected" : "local-only";

  return {
    projectName: config.projectName || "Local Project",
    projectSlug: config.projectSlug || "local-project",
    projectId: matrix.projectId,
    workspaceId: matrix.workspaceId,
    matrixBaseUrl: matrix.baseUrl,
    matrixMode,
    matrix
  };
}

function isMatrixAuthorized(root) {
  const context = getProjectContext(root);
  return (
    context.matrix.connection.status === MATRIX_CONNECTION_STATES.CONNECTED &&
    Boolean(context.matrix.connection.authorizationToken) &&
    Boolean(context.matrix.baseUrl)
  );
}

function ensureMatrixConnection(root) {
  const context = getProjectContext(root);
  if (!isMatrixAuthorized(root)) {
    throw new Error(
      "Matrix connection is not authorized. Run `connect_project` and then `npm run matrix:authorize`."
    );
  }
  if (!context.projectId || !context.workspaceId) {
    throw new Error("Matrix authorization requires projectId and workspaceId. Re-run `connect_project`.");
  }
  return context;
}

function updateProjectConfig(root, updater) {
  const current = readProjectConfig(root);
  const next = updater({ ...current }) || current;
  writeProjectConfig(root, next);
  return next;
}

function updateMatrixConnection(root, patch) {
  return updateProjectConfig(root, (config) => {
    const matrix = normalizeMatrixConfig(config);
    const nextMatrix = {
      ...matrix,
      ...patch,
      connection: {
        ...matrix.connection,
        ...(patch?.connection || {})
      }
    };

    config.matrix = {
      ...config.matrix,
      ...nextMatrix,
      connection: nextMatrix.connection
    };
    return config;
  });
}

module.exports = {
  MATRIX_CONNECTION_STATES,
  getConfigPath,
  readProjectConfig,
  writeProjectConfig,
  getProjectContext,
  ensureMatrixConnection,
  normalizeMatrixConfig,
  updateProjectConfig,
  updateMatrixConnection,
  isMatrixAuthorized
};
