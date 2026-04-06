#!/usr/bin/env node

const { parseArgs } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { reportToMatrix, requestMatrixAuthorization } = require("./lib/matrix-client");
const {
  MATRIX_CONNECTION_STATES,
  updateProjectConfig,
  updateMatrixConnection,
  getProjectContext,
  normalizeMatrixConfig
} = require("./lib/project-context");

function printReportOutcome(result) {
  if (result?.sent) {
    console.log("Matrix report sent.");
    return;
  }
  if (result?.queued) {
    console.log(`Matrix report queued (offline): ${result.error}`);
    return;
  }
  if (result?.skipped) {
    console.log(`Running local-only mode: matrix report skipped (${result.reason}).`);
  }
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const requestedBy = args["authorized-by"] || process.env.USER || process.env.USERNAME || "local-developer";
  const shouldAuthorize = String(args.authorize || "false").toLowerCase() === "true";
  const disconnect = String(args.disconnect || "false").toLowerCase() === "true";

  if (disconnect) {
    updateMatrixConnection(root, {
      connection: {
        status: MATRIX_CONNECTION_STATES.DISCONNECTED,
        authorizationToken: "",
        authorizedAt: null,
        authorizedBy: "",
        deniedAt: null,
        deniedReason: "",
        lastError: ""
      }
    });
    console.log("Matrix connection status: disconnected.");
    console.log("Workflow remains fully available in local-only mode.");
    return;
  }

  updateProjectConfig(root, (config) => {
    const matrix = normalizeMatrixConfig(config);
    const nextBaseUrl = args["matrix-url"] || process.env.MATRIX_BASE_URL || matrix.baseUrl || "";
    const nextProjectId = args["project-id"] || matrix.projectId || "";
    const nextWorkspaceId = args["workspace-id"] || matrix.workspaceId || "";
    const hasMatrixIntent = Boolean(nextBaseUrl || nextProjectId || nextWorkspaceId);
    const changedIdentity =
      String(nextBaseUrl).replace(/\/$/, "") !== matrix.baseUrl ||
      String(nextProjectId).trim() !== matrix.projectId ||
      String(nextWorkspaceId).trim() !== matrix.workspaceId;

    config.matrix = {
      ...matrix,
      baseUrl: String(nextBaseUrl).replace(/\/$/, ""),
      projectId: String(nextProjectId).trim(),
      workspaceId: String(nextWorkspaceId).trim(),
      connectedAt: new Date().toISOString(),
      connection: {
        ...matrix.connection,
        status: hasMatrixIntent ? MATRIX_CONNECTION_STATES.PENDING_AUTH : MATRIX_CONNECTION_STATES.DISCONNECTED,
        deniedAt: null,
        deniedReason: "",
        lastError: "",
        authorizationToken: hasMatrixIntent && !changedIdentity ? matrix.connection.authorizationToken : "",
        authorizedAt: hasMatrixIntent && !changedIdentity ? matrix.connection.authorizedAt : null,
        authorizedBy: hasMatrixIntent && !changedIdentity ? matrix.connection.authorizedBy : ""
      }
    };
    return config;
  });

  if (!shouldAuthorize) {
    const context = getProjectContext(root);
    if (context.matrix.connection.status === MATRIX_CONNECTION_STATES.PENDING_AUTH) {
      console.log("Matrix connection status: pending_auth.");
      console.log("No reports will be sent until explicit authorization is granted.");
      console.log("Next step: npm run matrix:authorize -- --authorized-by \"<your-name>\"");
    } else {
      console.log("Matrix connection status: disconnected (local-only mode).");
    }
    return;
  }

  try {
    const authResult = await requestMatrixAuthorization({
      root,
      requestedBy
    });

    updateMatrixConnection(root, {
      connection: {
        status: MATRIX_CONNECTION_STATES.CONNECTED,
        authorizationToken: String(authResult.authorizationToken),
        authorizedAt: authResult.authorizedAt || new Date().toISOString(),
        authorizedBy: authResult.authorizedBy || requestedBy,
        deniedAt: null,
        deniedReason: "",
        lastError: ""
      }
    });

    const context = getProjectContext(root);
    const report = await reportToMatrix(root, {
      eventType: "project_connected",
      stage: "setup",
      projectId: context.projectId || undefined,
      workspaceId: context.workspaceId || undefined,
      projectName: context.projectName,
      projectSlug: context.projectSlug,
      details: {
        environmentReady: true,
        templateDownloaded: true,
        matrixBaseUrl: context.matrixBaseUrl,
        authorizedBy: authResult.authorizedBy || requestedBy
      },
      timestamp: new Date().toISOString()
    });

    console.log("Matrix connection status: connected.");
    console.log(`authorizedAt=${authResult.authorizedAt || new Date().toISOString()}`);
    console.log(`authorizedBy=${authResult.authorizedBy || requestedBy}`);
    printReportOutcome(report);
  } catch (error) {
    updateMatrixConnection(root, {
      connection: {
        status: MATRIX_CONNECTION_STATES.DENIED,
        deniedAt: new Date().toISOString(),
        deniedReason: error.message,
        lastError: error.message
      }
    });
    throw error;
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
