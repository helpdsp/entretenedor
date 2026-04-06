#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const require = createRequire(import.meta.url);
const { loadEnv } = require("../scripts/lib/env");
const {
  getMatrixConfig,
  getQueuedReportsCount,
  reportToMatrix,
  requestMatrixAuthorization,
  syncPendingReports,
  validateBriefingInMatrix,
  generateSpecInMatrix
} = require("../scripts/lib/matrix-client");
const { readRequired } = require("../scripts/lib/io");
const {
  MATRIX_CONNECTION_STATES,
  getProjectContext,
  updateProjectConfig,
  updateMatrixConnection,
  normalizeMatrixConfig
} = require("../scripts/lib/project-context");

const root = process.cwd();
loadEnv(root);

function resolveContext() {
  return getProjectContext(root);
}

function toolResult(text) {
  return {
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}

function writeSpecArtifacts(outputDir, spec) {
  const outputMap = [
    { key: "prd", file: "PRD.md" },
    { key: "technical_spec", file: "technical-spec.md" },
    { key: "api_spec_yaml", file: "api-spec.yaml" },
    { key: "data_model", file: "data-model.md" },
    { key: "epics", file: "epics.md" },
    { key: "stories", file: "stories.md" },
    { key: "sprint_plan", file: "sprint-plan.md" },
    { key: "test_plan", file: "test-plan.md" }
  ];
  fs.mkdirSync(outputDir, { recursive: true });
  outputMap.forEach(({ key, file }) => {
    const value = spec?.[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Matrix response missing key: ${key}`);
    }
    fs.writeFileSync(path.join(outputDir, file), `${value.trim()}\n`, "utf8");
  });
}

const server = new Server(
  {
    name: "matrix-local-bridge",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "matrix_healthcheck",
      description: "Checks matrix connection configuration for local developers.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "matrix_validate_briefing",
      description: "Sends a local brief to matrix for validation.",
      inputSchema: {
        type: "object",
        properties: {
          brief_path: { type: "string" }
        },
        required: ["brief_path"]
      }
    },
    {
      name: "matrix_generate_spec_kit",
      description: "Requests Spec Kit generation in matrix (OpenRouter runs on matrix side).",
      inputSchema: {
        type: "object",
        properties: {
          brief_path: { type: "string" },
          output_dir: { type: "string" }
        },
        required: ["brief_path"]
      }
    },
    {
      name: "matrix_connect_project",
      description: "Sets matrix project/workspace context and marks connection as pending authorization.",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          workspace_id: { type: "string" }
        },
        required: ["project_id", "workspace_id"]
      }
    },
    {
      name: "matrix_authorize_project",
      description: "Performs explicit matrix authorization handshake and stores connection token locally.",
      inputSchema: {
        type: "object",
        properties: {
          requested_by: { type: "string" },
          project_id: { type: "string" },
          workspace_id: { type: "string" }
        }
      }
    },
    {
      name: "matrix_report_stats",
      description: "Reports planning or sprint metrics from local project to matrix.",
      inputSchema: {
        type: "object",
        properties: {
          stage: { type: "string" },
          stats: { type: "object" }
        },
        required: ["stage", "stats"]
      }
    },
    {
      name: "matrix_sync_pending_reports",
      description: "Pushes pending queued local reports to matrix.",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = request.params.name;
  const args = request.params.arguments || {};
  const project = resolveContext();

  if (tool === "matrix_healthcheck") {
    const config = getMatrixConfig();
    const summary = {
      matrix_base_url_configured: Boolean(config.baseUrl),
      connection_status: config.connectionStatus,
      has_authorization_token: Boolean(config.authorizationToken),
      queued_reports: getQueuedReportsCount(root),
      report_path: config.reportPath,
      validate_brief_path: config.validateBriefPath,
      generate_spec_path: config.generateSpecPath
    };
    return toolResult(JSON.stringify(summary, null, 2));
  }

  if (tool === "matrix_validate_briefing") {
    const briefPath = path.resolve(String(args.brief_path));
    const brief = readRequired(briefPath);
    const result = await validateBriefingInMatrix({
      root,
      brief,
      projectName: project.projectName,
      projectSlug: project.projectSlug,
      projectId: project.projectId,
      workspaceId: project.workspaceId
    });
    return toolResult(JSON.stringify(result, null, 2));
  }

  if (tool === "matrix_generate_spec_kit") {
    const briefPath = path.resolve(String(args.brief_path));
    const outputDir = path.resolve(
      String(args.output_dir || path.join(root, "spec-kit", "input"))
    );
    const brief = readRequired(briefPath);
    const result = await generateSpecInMatrix({
      root,
      brief,
      projectName: project.projectName,
      projectSlug: project.projectSlug,
      projectId: project.projectId,
      workspaceId: project.workspaceId
    });
    writeSpecArtifacts(outputDir, result);
    return toolResult(`Spec Kit saved in ${outputDir}`);
  }

  if (tool === "matrix_connect_project") {
    const projectId = String(args.project_id || "");
    const workspaceId = String(args.workspace_id || "");
    if (!projectId || !workspaceId) {
      throw new Error("project_id and workspace_id are required.");
    }
    updateProjectConfig(root, (config) => {
      const matrix = normalizeMatrixConfig(config);
      config.matrix = {
        ...matrix,
        projectId,
        workspaceId,
        connection: {
          ...matrix.connection,
          status: MATRIX_CONNECTION_STATES.PENDING_AUTH,
          deniedAt: null,
          deniedReason: "",
          lastError: ""
        }
      };
      return config;
    });

    return toolResult(
      JSON.stringify(
        {
          ok: true,
          project_id: projectId,
          workspace_id: workspaceId,
          connection_status: "pending_auth",
          next_step: "Run matrix_authorize_project to enable matrix reporting."
        },
        null,
        2
      )
    );
  }

  if (tool === "matrix_authorize_project") {
    try {
      const authResult = await requestMatrixAuthorization({
        root,
        requestedBy: String(args.requested_by || "mcp-agent"),
        projectId: String(args.project_id || ""),
        workspaceId: String(args.workspace_id || "")
      });

      updateMatrixConnection(root, {
        connection: {
          status: MATRIX_CONNECTION_STATES.CONNECTED,
          authorizationToken: String(authResult.authorizationToken),
          authorizedAt: authResult.authorizedAt || new Date().toISOString(),
          authorizedBy: authResult.authorizedBy || String(args.requested_by || "mcp-agent"),
          deniedAt: null,
          deniedReason: "",
          lastError: ""
        }
      });

      const context = resolveContext();
      const report = await reportToMatrix(root, {
        eventType: "project_connected",
        stage: "setup",
        projectId: context.projectId || undefined,
        workspaceId: context.workspaceId || undefined,
        projectName: context.projectName,
        projectSlug: context.projectSlug,
        details: {
          matrixBaseUrl: context.matrixBaseUrl,
          authorizedBy: authResult.authorizedBy || String(args.requested_by || "mcp-agent")
        },
        timestamp: new Date().toISOString()
      });

      return toolResult(
        JSON.stringify(
          {
            ok: true,
            authorization: authResult,
            report
          },
          null,
          2
        )
      );
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

  if (tool === "matrix_report_stats") {
    const stage = String(args.stage || "planning");
    const stats = args.stats || {};
    const result = await reportToMatrix(root, {
      eventType: "stats_reported",
      stage,
      projectId: project.projectId,
      workspaceId: project.workspaceId,
      projectName: project.projectName,
      projectSlug: project.projectSlug,
      details: { stats },
      timestamp: new Date().toISOString()
    });
    return toolResult(JSON.stringify(result, null, 2));
  }

  if (tool === "matrix_sync_pending_reports") {
    const result = await syncPendingReports(root);
    return toolResult(JSON.stringify(result, null, 2));
  }

  throw new Error(`Unknown tool: ${tool}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
