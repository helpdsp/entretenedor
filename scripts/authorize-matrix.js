#!/usr/bin/env node

const { parseArgs } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { requestMatrixAuthorization, reportToMatrix } = require("./lib/matrix-client");
const {
  MATRIX_CONNECTION_STATES,
  updateMatrixConnection,
  updateProjectConfig,
  normalizeMatrixConfig,
  getProjectContext
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
  const authorizedBy = args["authorized-by"] || process.env.USER || process.env.USERNAME || "local-developer";
  const projectIdArg = String(args["project-id"] || "").trim();
  const workspaceIdArg = String(args["workspace-id"] || "").trim();

  if (projectIdArg || workspaceIdArg) {
    updateProjectConfig(root, (config) => {
      const matrix = normalizeMatrixConfig(config);
      config.matrix = {
        ...matrix,
        projectId: projectIdArg || matrix.projectId,
        workspaceId: workspaceIdArg || matrix.workspaceId,
        connection: {
          ...matrix.connection,
          status: MATRIX_CONNECTION_STATES.PENDING_AUTH
        }
      };
      return config;
    });
  }

  try {
    const authResult = await requestMatrixAuthorization({
      root,
      requestedBy: authorizedBy,
      projectId: projectIdArg || undefined,
      workspaceId: workspaceIdArg || undefined
    });

    updateMatrixConnection(root, {
      connection: {
        status: MATRIX_CONNECTION_STATES.CONNECTED,
        authorizationToken: String(authResult.authorizationToken),
        authorizedAt: authResult.authorizedAt || new Date().toISOString(),
        authorizedBy: authResult.authorizedBy || authorizedBy,
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
        matrixBaseUrl: context.matrixBaseUrl,
        authorizedBy: authResult.authorizedBy || authorizedBy
      },
      timestamp: new Date().toISOString()
    });

    console.log("Matrix authorization granted.");
    console.log(`authorizedAt=${authResult.authorizedAt || new Date().toISOString()}`);
    console.log(`authorizedBy=${authResult.authorizedBy || authorizedBy}`);
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
