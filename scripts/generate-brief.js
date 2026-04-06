#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseArgs, resolvePathFromRoot } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { ensureDir, writeFile } = require("./lib/io");
const { reportToMatrix } = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { runLocalIdeAiJson } = require("./lib/local-ide-ai-client");
const { markBriefGenerated } = require("./lib/workflow-state");
const { printMatrixOutcome } = require("./lib/matrix-reporting");
const { getBriefPreconditions, buildGenerateBriefBlockingError } = require("./lib/brief-preconditions");
const { readClarifications } = require("./lib/clarification-store");

function toInputPayload(root, files, limit = 40) {
  return files.slice(0, limit).map((file) => ({
    path: path.relative(root, file).replace(/\\/g, "/"),
    content: fs.readFileSync(file, "utf8")
  }));
}

function cleanSignal(line, max = 180) {
  if (typeof line !== "string") {
    return "";
  }
  const compact = line.replace(/\s+/g, " ").replace(/[`*_>#]/g, "").trim();
  if (compact.length === 0) {
    return "";
  }
  return compact.length > max ? `${compact.slice(0, max - 3)}...` : compact;
}

function uniqueSignals(items, limit = 8) {
  const output = [];
  const seen = new Set();
  for (const item of items) {
    const cleaned = cleanSignal(item);
    if (!cleaned) {
      continue;
    }
    const key = cleaned.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(cleaned);
    if (output.length >= limit) {
      break;
    }
  }
  return output;
}

function collectReferenceSignals(references) {
  const headings = [];
  const bullets = [];
  const narrative = [];
  const requirementSignals = [];

  for (const reference of references) {
    const lines = String(reference.content || "").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      if (/^#{1,6}\s+/.test(trimmed)) {
        headings.push(trimmed.replace(/^#{1,6}\s+/, ""));
      }
      if (/^[-*]\s+/.test(trimmed)) {
        bullets.push(trimmed.replace(/^[-*]\s+/, ""));
      }
      if (
        trimmed.length > 40 &&
        !trimmed.startsWith("|") &&
        !trimmed.startsWith("```") &&
        !/^#{1,6}\s+/.test(trimmed) &&
        !/^[-*]\s+/.test(trimmed)
      ) {
        narrative.push(trimmed);
      }
      if (/(^#{1,6}\s*rf-\d+)|(rf-\d+)|(requisit)|(debe)|(must)|(shall)|(endpoint)|(api)/i.test(trimmed)) {
        requirementSignals.push(trimmed.replace(/^[-*]\s+/, "").replace(/^#{1,6}\s+/, ""));
      }
    }
  }

  return {
    headings: uniqueSignals(headings, 10),
    bullets: uniqueSignals(bullets, 12),
    narrative: uniqueSignals(narrative, 6),
    requirementSignals: uniqueSignals(requirementSignals, 10)
  };
}

function formatClarificationSignals(clarifications) {
  const entries = Object.entries(clarifications || {})
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value.trim()}`);
  return uniqueSignals(entries, 6);
}

function fallbackBrief(projectName, references, sourceCode, clarifications) {
  const signals = collectReferenceSignals(references);
  const clarificationSignals = formatClarificationSignals(clarifications);
  const refLines = references.slice(0, 8).map((item) => `- ${item.path}`);
  const sourceLines = sourceCode.slice(0, 8).map((item) => `- ${item.path}`);
  const scopeSignals = signals.headings.length > 0 ? signals.headings : signals.bullets;
  const requirementSignals = signals.requirementSignals.length > 0 ? signals.requirementSignals : signals.bullets;
  const narrativeSignals = signals.narrative.length > 0
    ? signals.narrative
    : ["No se detectaron parrafos descriptivos amplios en los refdocs."];
  const clarificationBlock = clarificationSignals.length > 0
    ? clarificationSignals.map((item) => `- ${item}`)
    : ["- Sin clarificaciones explicitas: revisar supuestos de negocio antes de cerrar el brief."];
  const scopeBlock = scopeSignals.length > 0
    ? scopeSignals.map((item) => `- ${item}`)
    : ["- No se detectaron secciones de alcance en los refdocs; definir alcance funcional inicial."];
  const requirementBlock = requirementSignals.length > 0
    ? requirementSignals.map((item) => `- ${item}`)
    : ["- No se detectaron requisitos expresos; validar RF/RNF en el PRD antes de planificar sprints."];
  const narrativeBlock = narrativeSignals.map((item) => `- ${item}`);

  return [
    `# Brief - ${projectName}`,
    "",
    "## Executive Summary",
    `- Inputs analizados: ${references.length} refdocs y ${sourceCode.length} archivos de codigo fuente.`,
    "- Objetivo operativo: transformar documentos base en especificaciones ejecutables para planning.",
    "- Modo de generacion: fallback deterministico (revisar y enriquecer manualmente en el IDE Agent).",
    "",
    "## Context Signals",
    ...narrativeBlock,
    "",
    "## Goals",
    "- Convert input documentation into executable sprint backlog.",
    "- Keep local workflow state persisted and optionally synchronized with matrix.",
    "- Leave enough context for generate_spec_kit without losing business intent.",
    "",
    "## Scope Inferred From Refdocs",
    ...scopeBlock,
    "",
    "## Requirement Signals",
    ...requirementBlock,
    "",
    "## Clarification Signals",
    ...clarificationBlock,
    "",
    "## Non-goals / Pending Definition",
    "- Cualquier funcionalidad no mencionada en refdocs queda fuera del alcance inicial.",
    "- Confirmar metricas de exito, restricciones tecnicas y criterios de salida antes de ejecutar sprints.",
    "",
    "## Inputs used",
    ...refLines,
    ...(sourceLines.length > 0 ? ["", "## Source code used", ...sourceLines] : [])
  ].join("\n");
}

function runLocalBriefAi(root, projectName, references, sourceCode, clarifications) {
  const parsed = runLocalIdeAiJson({
    root,
    taskName: "generate-brief",
    payload: {
      instruction:
        "Create a concise engineering brief from references and source code context. Return JSON with key brief.",
      project_name: projectName,
      references,
      source_code: sourceCode,
      clarifications: clarifications || {},
      output_schema: {
        brief: "string"
      }
    }
  });

  if (typeof parsed === "string") {
    return parsed;
  }
  if (parsed && typeof parsed.brief === "string" && parsed.brief.trim().length > 0) {
    return parsed.brief.trim();
  }
  throw new Error("Local AI returned invalid brief payload.");
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const context = getProjectContext(root);
  const briefPath = resolvePathFromRoot(root, args["output"], "spec-kit/input/brief.md");
  const preconditions = getBriefPreconditions(root, {
    referencesDir: args["references-dir"],
    sourceDir: args["source-dir"],
    requireSourceCode: args["require-source-code"]
  });

  if (!preconditions.ok) {
    throw new Error(buildGenerateBriefBlockingError(preconditions));
  }

  const references = toInputPayload(root, preconditions.references, 40);
  const sourceCode = toInputPayload(root, preconditions.sourceFiles, 40);
  const clarificationData = readClarifications(root, "brief");
  const clarifications = clarificationData ? clarificationData.answers : {};

  // --agent-written: the IDE agent already wrote the brief; skip generation and just register state.
  const agentWritten = args["agent-written"] === true || args["agent-written"] === "true";

  let briefContent = "";
  let fallbackUsed = false;
  let fallbackReason = "";

  if (agentWritten) {
    if (!fs.existsSync(briefPath) || fs.readFileSync(briefPath, "utf8").trim().length === 0) {
      throw new Error(
        `--agent-written flag set but brief file is missing or empty at ${briefPath}. ` +
        "Write the brief before running the script with this flag."
      );
    }
    briefContent = fs.readFileSync(briefPath, "utf8");
    console.log("Agent-written brief detected. Skipping generation, registering state.");
  } else {
    try {
      briefContent = runLocalBriefAi(root, context.projectName, references, sourceCode, clarifications);
    } catch (error) {
      fallbackUsed = true;
      fallbackReason = error && error.message ? error.message : "unknown error";
      briefContent = fallbackBrief(context.projectName, references, sourceCode, clarifications);
    }

    ensureDir(path.dirname(briefPath));
    writeFile(briefPath, briefContent);
  }

  markBriefGenerated(root, `Brief generated at ${path.relative(root, briefPath).replace(/\\/g, "/")}`);

  const report = await reportToMatrix(root, {
    eventType: "brief_generated",
    stage: "discovery",
    projectId: context.projectId || undefined,
    workspaceId: context.workspaceId || undefined,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    details: {
      content: briefContent,
      briefPath: path.relative(root, briefPath).replace(/\\/g, "/"),
      referencesCount: references.length,
      sourceCodeCount: sourceCode.length,
      fallbackUsed,
      agentWritten
    },
    timestamp: new Date().toISOString()
  });

  if (fallbackUsed) {
    console.warn("Warning: deterministic fallback brief was used.");
    console.warn(`Reason: ${fallbackReason}`);
    console.warn("Tip: The IDE agent should write the brief directly (see generate_brief command instructions).");
  }

  console.log(`Brief generated at ${briefPath}`);
  printMatrixOutcome(report);
  console.log("Next command: generate_spec_kit");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
