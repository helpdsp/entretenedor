#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseArgs, resolvePathFromRoot } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { readRequired, readFileIfExists } = require("./lib/io");
const {
  generateSpecInMatrix,
  reportToMatrix,
  getMatrixConfig,
  resolveMatrixEligibility
} = require("./lib/matrix-client");
const { getProjectContext } = require("./lib/project-context");
const { runLocalIdeAiJson } = require("./lib/local-ide-ai-client");
const { markSpecGenerated } = require("./lib/workflow-state");
const { printMatrixOutcome } = require("./lib/matrix-reporting");
const { readClarifications } = require("./lib/clarification-store");

/** Resolve consolidated product PRD text: --product-prd, then spec-kit/input/product-prd.md, then refdocs/*prd*.md/.txt */
function resolveProductPrdContent(root, args) {
  const explicit = args["product-prd"];
  if (explicit) {
    const p = resolvePathFromRoot(root, explicit);
    return readRequired(p);
  }
  const canonical = path.join(root, "spec-kit", "input", "product-prd.md");
  const fromInput = readFileIfExists(canonical);
  if (fromInput) {
    return fromInput;
  }
  const refdocsDir = path.join(root, "refdocs");
  if (fs.existsSync(refdocsDir)) {
    const names = fs
      .readdirSync(refdocsDir)
      .filter((n) => {
        const lower = n.toLowerCase();
        return (lower.endsWith(".md") || lower.endsWith(".txt")) && lower.includes("prd");
      })
      .sort();
    if (names.length > 0) {
      const first = readFileIfExists(path.join(refdocsDir, names[0]));
      if (first) {
        return first;
      }
    }
  }
  return "";
}

const OUTPUT_MAP = [
  { key: "prd", file: "PRD.md" },
  { key: "technical_spec", file: "technical-spec.md" },
  { key: "api_spec_yaml", file: "api-spec.yaml" },
  { key: "data_model", file: "data-model.md" },
  { key: "epics", file: "epics.md" },
  { key: "stories", file: "stories.md" },
  { key: "sprint_plan", file: "sprint-plan.md" },
  { key: "test_plan", file: "test-plan.md" }
];

function writeSpecArtifacts(outputDir, spec) {
  const artifactFiles = [];
  OUTPUT_MAP.forEach(({ key, file }) => {
    const value = spec?.[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Spec payload missing key: ${key}`);
    }
    fs.writeFileSync(path.join(outputDir, file), `${value.trim()}\n`, "utf8");
    artifactFiles.push(file);
  });
  return artifactFiles;
}

function truncateText(text, maxChars) {
  const s = String(text || "").trim();
  if (s.length <= maxChars) {
    return s;
  }
  return `${s.slice(0, maxChars)}\n\n...(truncated — see full product PRD in refdocs or pass a larger file)...\n`;
}

/** Extract markdown section starting at ## N. ... until next ## M. (numbered heading) or EOF */
function extractNumberedMdSection(md, sectionNum) {
  const s = String(md || "");
  const re = new RegExp(
    `^##\\s*${sectionNum}\\.[^\\n]*\\r?\\n([\\s\\S]*?)(?=^##\\s*\\d+\\.|\\Z)`,
    "m"
  );
  const m = s.match(re);
  return m ? m[1].trim() : "";
}

/**
 * Parse `### RF-XX — Title` blocks from a product PRD (section 5 style).
 * @returns {{ id: string, title: string, body: string }[]}
 */
function parseRfSections(md) {
  const text = String(md || "");
  const re = /^###\s*(RF-\d+)\s*[—–-]?\s*(.*)$/gim;
  const matches = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    matches.push({
      index: m.index,
      headerLen: m[0].length,
      id: m[1].toUpperCase(),
      title: (m[2] || "").trim() || m[1]
    });
  }
  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].headerLen;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    let body = text.slice(start, end).trim();
    const cutMajor = body.search(/\n##\s+/);
    if (cutMajor !== -1) {
      body = body.slice(0, cutMajor).trim();
    }
    sections.push({
      id: matches[i].id,
      title: matches[i].title,
      body
    });
  }
  return sections;
}

function guessStoryOwnerHint(title) {
  const t = String(title || "").toLowerCase();
  if (/admin|platform|waitlist|invite/i.test(t)) {
    return "backend, frontend, qa";
  }
  if (/org|organizaci/i.test(t)) {
    return "backend, frontend, qa";
  }
  if (/creator|content factory|wizard|copilot|fragment/i.test(t)) {
    return "backend, frontend, ai";
  }
  if (/mcp|server/i.test(t)) {
    return "backend, devops";
  }
  if (/leaderboard|dashboard|atom|track|catálogo|catalogo|catalog/i.test(t)) {
    return "frontend, backend";
  }
  if (/auth|login|registro|notific|certific|profile|perfil|skin|i18n|switch/i.test(t)) {
    return "backend, frontend";
  }
  return "frontend, backend";
}

function buildStoriesMarkdownFromRfSections(projectName, briefExcerpt, rfSections, prdNote) {
  const lines = [
    `# User stories — ${projectName}`,
    "",
    "> **VISION fallback:** una historia por cada **RF** detectado (`### RF-XX` en el PRD). Completa criterios y owners con el detalle del PRD.",
    "",
    prdNote,
    "",
    "## Brief aprobado (extracto)",
    "",
    briefExcerpt,
    "",
    "## Tabla índice (stories ↔ RF)",
    "",
    "| Story | RF | Título |",
    "|-------|-----|--------|",
    ...rfSections.map((s, i) => {
      const num = String(i + 1).padStart(2, "0");
      const safeTitle = String(s.title).replace(/\|/g, "\\|");
      return `| S-${num} | ${s.id} | ${safeTitle} |`;
    }),
    "",
    "---",
    ""
  ];

  rfSections.forEach((s, i) => {
    const num = String(i + 1).padStart(2, "0");
    const owner = guessStoryOwnerHint(s.title);
    lines.push(`## ${s.id} — ${s.title}`);
    lines.push("");
    lines.push(`### S-${num} — ${s.title}`);
    lines.push("");
    lines.push(
      `- **Como** parte de los roles definidos en el PRD **quiero** el comportamiento descrito en **${s.id}** **para** cumplir el requisito funcional.`
    );
    lines.push(`- **RF:** ${s.id}`);
    lines.push("- **Criterios de aceptación (checklist):**");
    const bulletLines = s.body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("- ") || l.startsWith("* "));
    const take = bulletLines.slice(0, 12);
    if (take.length > 0) {
      take.forEach((b) => {
        const text = b.replace(/^[-*]\s+/, "").trim();
        if (text.length > 0) {
          lines.push(`  - [ ] ${text}`);
        }
      });
    } else {
      lines.push(`  - [ ] Criterios verificables según el texto completo de **${s.id}** en el PRD.`);
    }
    lines.push("- **Dependencias:** orden lógico respecto a otros RF (ver PRD); integraciones listadas en §8 si aplica.");
    lines.push(`- **Owner sugerido:** ${owner}`);
    lines.push("- **Notas técnicas:** tablas Supabase, RLS, RPC y Edge Functions según PRD §7–8.");
    lines.push("");
    lines.push(`#### Extracto PRD (${s.id})`);
    lines.push("");
    lines.push("```text");
    const excerpt = s.body.length > 1800 ? `${s.body.slice(0, 1800)}\n…` : s.body;
    lines.push(excerpt || "(sin cuerpo bajo el encabezado en el parseo)");
    lines.push("```");
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

function buildEpicsMarkdownFromRfSections(projectName, briefExcerpt, rfSections, prdNote) {
  const chunkSize = 4;
  const chunks = [];
  for (let i = 0; i < rfSections.length; i += chunkSize) {
    chunks.push(rfSections.slice(i, i + chunkSize));
  }

  const lines = [
    `# Epics — ${projectName}`,
    "",
    "> **VISION fallback:** épicas agrupadas en lotes de hasta **4 RF** (orden del PRD). Renombra y reagrupa según negocio.",
    "",
    prdNote,
    "",
    "## Brief aprobado (extracto)",
    "",
    briefExcerpt,
    "",
    "## Mapa epic ↔ RF",
    "",
    "| Epic | RF incluidos |",
    "|------|----------------|",
    ...chunks.map((g, i) => {
      const num = String(i + 1).padStart(2, "0");
      return `| E-${num} | ${g.map((x) => x.id).join(", ")} |`;
    }),
    "",
    "---",
    ""
  ];

  chunks.forEach((g, i) => {
    const num = String(i + 1).padStart(2, "0");
    const label = g.map((x) => x.title).join(" · ");
    const shortLabel = label.length > 90 ? `${label.slice(0, 87)}…` : label;
    lines.push(`## E-${num} — ${shortLabel}`);
    lines.push("");
    lines.push("| Campo | Contenido |");
    lines.push("|-------|-----------|");
    lines.push(`| **Objetivo de negocio** | Entregar los requisitos: ${g.map((x) => x.id).join(", ")}. |`);
    lines.push(`| **Alcance (RF)** | ${g.map((x) => x.id).join(", ")} |`);
    lines.push("| **Fuera de alcance explícito** | Alineado con PRD §12 (MVP vs fase 2). |");
    lines.push(`| **Dependencias** | ${i === 0 ? "—" : `E-${String(i).padStart(2, "0")} u otras épicas previas`} |`);
    lines.push("| **Riesgos** | Revisar dependencias técnicas entre RF del bloque. |");
    lines.push("| **Criterio de “done” del epic** | Stories S-XX asociadas aceptadas en QA. |");
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

function buildSprintPlanMarkdownFromRfSections(projectName, briefExcerpt, rfSections, prdNote) {
  const n = rfSections.length;
  const sprintCount = Math.min(12, Math.max(4, Math.ceil(n / 3)));
  const perSprint = Math.ceil(n / sprintCount);
  const lines = [
    `# Sprint plan — ${projectName}`,
    "",
    "> **VISION fallback:** reparto **aproximado** de RF en sprints (≈${perSprint} RF/sprint). Ajustar con `clarify_sprints` y el equipo.",
    "",
    prdNote,
    "",
    "## Brief aprobado (extracto)",
    "",
    briefExcerpt,
    "",
    "| Sprint | Goal (sugerido) | RF / stories cubiertas | Dependencias |",
    "|--------|-----------------|---------------------------|--------------|",
    ""
  ];

  for (let s = 0; s < sprintCount; s++) {
    const start = s * perSprint;
    const slice = rfSections.slice(start, start + perSprint);
    const ids = slice.map((x) => x.id).join(", ");
    const storyNums = slice.map((_, j) => `S-${String(start + j + 1).padStart(2, "0")}`).join(", ");
    const goal =
      s === 0
        ? "Fundación y primeros RF"
        : s === sprintCount - 1
          ? "Cierre MVP / integración"
          : `Incremento funcional (${slice[0]?.id || ""}…)`;
    const dep = s === 0 ? "—" : `Sprint ${s}`;
    lines.push(`| ${s + 1} | ${goal} | ${ids} (${storyNums}) | ${dep} |`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`**Total RF en plan:** ${n} · **Sprints:** ${sprintCount}`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Structured placeholders for epics / stories / sprint-plan when AI generation is unavailable.
 * If the product PRD contains `### RF-XX` headings, generates one story per RF and grouped epics.
 */
function buildFallbackPlanningArtifacts(projectName, safeBrief, hasProductPrd, safeProductPrd) {
  const briefExcerpt = truncateText(safeBrief, 4000);
  const prdNote = hasProductPrd
    ? "El PRD de producto está disponible: se usan encabezados `### RF-XX` para generar historias."
    : "Añade un PRD en `refdocs/*prd*.md` o `spec-kit/input/product-prd.md` y vuelve a ejecutar `generate_spec_kit`.";

  const rfSections = parseRfSections(safeProductPrd || "");
  if (rfSections.length > 0) {
    return {
      epics: buildEpicsMarkdownFromRfSections(projectName, briefExcerpt, rfSections, prdNote),
      stories: buildStoriesMarkdownFromRfSections(projectName, briefExcerpt, rfSections, prdNote),
      sprint_plan: buildSprintPlanMarkdownFromRfSections(projectName, briefExcerpt, rfSections, prdNote)
    };
  }

  const epics = [
    `# Epics — ${projectName}`,
    "",
    "> **VISION fallback:** no se encontraron encabezados `### RF-XX` en el PRD. Usa ese formato en la sección de requisitos o configura `LOCAL_IDE_AI_COMMAND`.",
    "",
    prdNote,
    "",
    "## Brief aprobado (extracto)",
    "",
    briefExcerpt,
    "",
    "---",
    "",
    "## E-01 — (nombre del epic)",
    "",
    "| Campo | Contenido |",
    "|-------|-----------|",
    "| **Objetivo de negocio** | … |",
    "| **Alcance (RF)** | RF-… |",
    "| **Fuera de alcance explícito** | … |",
    "| **Dependencias** | … |",
    "| **Riesgos** | … |",
    "| **Criterio de “done” del epic** | … |",
    "",
    "*(Añadir E-02, E-03…)*",
    ""
  ].join("\n");

  const stories = [
    `# User stories — ${projectName}`,
    "",
    "> **VISION fallback:** sin `### RF-XX` en el PRD no se pueden generar historias automáticamente. Añade esos encabezados o usa IA local.",
    "",
    prdNote,
    "",
    "## Brief aprobado (extracto)",
    "",
    briefExcerpt,
    "",
    "---",
    "",
    "## E-01 — …",
    "",
    "### S-01 — (título corto)",
    "",
    "- **Como** … **quiero** … **para** …",
    "- **RF:** RF-…",
    "- **Criterios (G/W/T):**",
    "  - **Given** … **when** … **then** …",
    "- **Dependencias:** …",
    "- **Owner sugerido:** frontend | backend | qa | …",
    "- **Notas técnicas:** tablas Supabase / RPC / Edge Function si aplica",
    "",
    "*(Añadir S-02…)*",
    ""
  ].join("\n");

  const sprintPlan = [
    `# Sprint plan — ${projectName}`,
    "",
    "> **VISION fallback:** tabla guía (6–8 sprints típicos MVP). Ajustar goals y dependencias según `epics.md` / `stories.md`.",
    "",
    prdNote,
    "",
    "## Brief aprobado (extracto)",
    "",
    briefExcerpt,
    "",
    "---",
    "",
    "| Sprint | Goal | Epics / historias (IDs) | Dependencias | Riesgos | Salida / QA | Buffer |",
    "|--------|------|-------------------------|--------------|---------|-------------|--------|",
    "| 1 | Fundación: auth, datos base | E-… S-… | — | RLS, env | Smoke login | … |",
    "| 2 | … | … | Sprint 1 | … | … | … |",
    "| 3 | … | … | … | … | … | … |",
    "| 4 | … | … | … | … | … | … |",
    "| 5 | … | … | … | … | … | … |",
    "| 6 | … | … | … | … | … | … |",
    "",
    "*(Añadir filas o columnas según necesidad.)*",
    ""
  ].join("\n");

  return { epics, stories, sprint_plan: sprintPlan };
}

/**
 * When LOCAL_IDE_AI_COMMAND is missing, build artifacts from approved brief + product PRD
 * so outputs are project-specific (not the generic VISION planning template).
 */
function buildFallbackSpec(projectName, brief, productPrd) {
  const safeBrief = brief.trim();
  const safePrd = (productPrd || "").trim();
  const prdExcerpt = truncateText(safePrd, 45000);
  const productSection = safePrd
    ? `## Product PRD (input)\n\n${prdExcerpt}\n\n`
    : "## Product PRD (input)\n\n*(No product PRD resolved — add spec-kit/input/product-prd.md, refdocs/*prd*.md, or --product-prd.)*\n\n";

  const dbSection = extractNumberedMdSection(safePrd, "7");
  const infraSection = extractNumberedMdSection(safePrd, "8");
  const qualitySection = extractNumberedMdSection(safePrd, "9");

  const dataModelBody =
    dbSection.length > 0
      ? `## Extracted from product PRD (section 7)\n\n${dbSection}\n`
      : `## Data model (no §7 heading found)\n\n${truncateText(safePrd, 24000)}\n`;

  const apiDescription = truncateText(
    [
      "Fallback OpenAPI shell — real endpoints are RPC + Edge Functions in the product PRD.",
      infraSection ? `\n---\n## Infra / API excerpt (section 8)\n\n${truncateText(infraSection, 12000)}` : ""
    ].join(""),
    14000
  );

  const sharedContext = truncateText(
    [`### Approved brief\n\n${safeBrief}`, safePrd ? `\n\n### Product PRD (excerpt)\n\n${truncateText(safePrd, 18000)}` : ""].join(""),
    24000
  );

  const planning = buildFallbackPlanningArtifacts(projectName, safeBrief, Boolean(safePrd), safePrd);

  return {
    prd: `# PRD — ${projectName}\n\n${productSection}## Executive brief\n\n${safeBrief}\n\n## Goals\n\n- Ship software that satisfies the product PRD above.\n- Refine this engineering PRD after structured generation when LOCAL_IDE_AI_COMMAND is available.\n`,
    technical_spec: [
      `# Technical specification — ${projectName}`,
      "",
      "> **VISION fallback:** Bundles your **approved brief** and **product PRD** into one engineering-facing document. For structured architecture (layers, diagrams, ADRs), configure `LOCAL_IDE_AI_COMMAND` or edit manually.",
      "",
      "## Approved brief",
      "",
      safeBrief || "*(empty brief)*",
      "",
      "## Product PRD (primary implementation source)",
      "",
      safePrd ? truncateText(safePrd, 52000) : "*(no product PRD — add refdocs or product-prd.md)*",
      ""
    ].join("\n"),
    api_spec_yaml: [
      "openapi: 3.1.0",
      "info:",
      `  title: ${projectName} — HTTP / RPC surface`,
      "  version: 1.0.0",
      "  x-vision-fallback: true",
      `  description: ${JSON.stringify(apiDescription)}`,
      "paths: {}",
      ""
    ].join("\n"),
    data_model: [
      `# Data model — ${projectName}`,
      "",
      "> **VISION fallback:** Uses section 7 of the product PRD when a \"## 7.\" heading is present; otherwise embeds an excerpt of the full PRD.",
      "",
      dataModelBody,
      ""
    ].join("\n"),
    epics: planning.epics,
    stories: planning.stories,
    sprint_plan: planning.sprint_plan,
    test_plan: [
      `# Test plan — ${projectName}`,
      "",
      "> Align tests with quality gates and RF acceptance in the product PRD.",
      qualitySection ? `## Extracted from product PRD (section 9)\n\n${qualitySection}\n` : "",
      "## Context (brief + PRD excerpt)\n",
      sharedContext,
      ""
    ].join("\n")
  };
}

function generateLocalSpecWithAi(
  root,
  projectName,
  projectSlug,
  brief,
  productPrd,
  specKitClarifications
) {
  const clarifications = specKitClarifications && typeof specKitClarifications === "object"
    ? specKitClarifications
    : {};
  const parsed = runLocalIdeAiJson({
    root,
    taskName: "generate-spec-kit",
    payload: {
      instruction: [
        "Generate a complete engineering Spec Kit from TWO primary inputs: (1) approved executive brief, (2) product PRD (functional / consolidated requirements).",
        "Return strict JSON with all required keys.",
        "The output PRD field is the engineering/delivery PRD derived from both inputs — do not merely copy the product PRD.",
        "Incorporate spec_kit_clarifications into PRD, technical_spec, stories, epics, and test_plan where relevant,",
        "especially UX/UI implementation (components, design tokens, i18n) and acceptance criteria.",
        "If product_prd is empty, rely on the brief alone but note gaps in technical_spec.",
        "If spec_kit_clarifications is empty, use only brief + product_prd."
      ].join(" "),
      project_name: projectName,
      project_slug: projectSlug,
      brief,
      product_prd: productPrd || "",
      spec_kit_clarifications: clarifications,
      output_schema: {
        prd: "string",
        technical_spec: "string",
        api_spec_yaml: "string",
        data_model: "string",
        epics: "string",
        stories: "string",
        sprint_plan: "string",
        test_plan: "string"
      }
    }
  });

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Local AI returned invalid spec payload.");
  }
  return parsed;
}

async function reportGeneration(root, context, source, outputDir, artifactFiles) {
  const report = await reportToMatrix(root, {
    eventType: "spec_generated",
    stage: "spec",
    projectId: context.projectId || undefined,
    workspaceId: context.workspaceId || undefined,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    details: {
      source,
      outputDir: path.relative(root, outputDir).replace(/\\/g, "/"),
      artifactFiles
    },
    timestamp: new Date().toISOString()
  });

  printMatrixOutcome(report);
}

async function runMatrixMode(root, args, context) {
  const briefPath = resolvePathFromRoot(root, args.brief, "spec-kit/input/brief.md");
  const outputDir = resolvePathFromRoot(root, args["output-dir"], "spec-kit/input");
  fs.mkdirSync(outputDir, { recursive: true });

  const brief = readRequired(briefPath);
  const productPrd = resolveProductPrdContent(root, args);
  const result = await generateSpecInMatrix({
    root,
    brief,
    product_prd: productPrd,
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    projectId: context.projectId,
    workspaceId: context.workspaceId
  });

  const artifactFiles = writeSpecArtifacts(outputDir, result);
  markSpecGenerated(root, "matrix", artifactFiles, `Matrix spec generated at ${path.relative(root, outputDir)}`);
  await reportGeneration(root, context, "matrix", outputDir, artifactFiles);

  console.log(`Spec Kit generated from matrix in ${outputDir}`);
  console.log("Next step: generate_sprints");
}

async function runLocalMode(root, args, context, reason) {
  const briefPath = resolvePathFromRoot(root, args.brief, "spec-kit/input/brief.md");
  const outputDir = resolvePathFromRoot(root, args["output-dir"], "spec-kit/input");
  fs.mkdirSync(outputDir, { recursive: true });

  const brief = readRequired(briefPath);
  const productPrd = resolveProductPrdContent(root, args);
  if (!productPrd.trim()) {
    console.warn(
      "Warning: No product PRD resolved. Add spec-kit/input/product-prd.md, a refdocs/*prd*.md file, or pass --product-prd <path>."
    );
  } else {
    console.log("Product PRD input loaded for spec generation.");
  }
  const clarificationData = readClarifications(root, "spec_kit");
  const specKitClarifications = clarificationData && clarificationData.answers ? clarificationData.answers : {};
  let specPayload;
  try {
    specPayload = generateLocalSpecWithAi(
      root,
      context.projectName,
      context.projectSlug,
      brief,
      productPrd,
      specKitClarifications
    );
  } catch (error) {
    console.warn(`Warning: local AI spec generation failed (${error.message}). Using project-derived fallback.`);
    console.warn(
      "Fallback embeds approved brief + product PRD into all 8 artifacts (not the generic VISION template). Configure LOCAL_IDE_AI_COMMAND for structured engineering output."
    );
    specPayload = buildFallbackSpec(context.projectName, brief, productPrd);
  }

  const artifactFiles = writeSpecArtifacts(outputDir, specPayload);
  markSpecGenerated(root, "local", artifactFiles, `Local spec generated at ${path.relative(root, outputDir)}`);
  await reportGeneration(root, context, "local", outputDir, artifactFiles);

  if (reason) {
    console.log(`Running local-only mode: ${reason}`);
  }
  console.log(`Spec Kit generated locally in ${outputDir}`);
  console.log("Next step: generate_sprints");
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const context = getProjectContext(root);
  const mode = String(args.mode || "auto").toLowerCase();

  if (!["auto", "matrix", "local"].includes(mode)) {
    throw new Error("Invalid --mode. Use --mode auto, --mode matrix or --mode local.");
  }

  if (mode === "local") {
    await runLocalMode(root, args, context);
    return;
  }

  const matrixEligibility = resolveMatrixEligibility(getMatrixConfig(root));
  if (mode === "matrix" && !matrixEligibility.ok) {
    await runLocalMode(root, args, context, `matrix mode requested but unavailable (${matrixEligibility.reason}).`);
    return;
  }

  if (mode === "auto" && !matrixEligibility.ok) {
    await runLocalMode(root, args, context, `matrix not authorized (${matrixEligibility.reason}).`);
    return;
  }

  await runMatrixMode(root, args, context);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
