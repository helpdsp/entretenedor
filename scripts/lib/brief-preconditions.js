const fs = require("fs");
const path = require("path");
const { readWorkflowState } = require("./workflow-state");

const REF_DOC_PATTERN = /\.(md|txt|json|ya?ml)$/i;
const SOURCE_CODE_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs|py|java|cs|go|rs|rb|php|cpp|c|h|hpp|swift|kt|kts|scala|w)$/i;
const REF_DOC_EXCLUDED_FILES = new Set(["brief.md", "brief-validation.json"]);

function toPosixPath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function resolveInputDir(root, inputValue, fallbackRelative) {
  const value = typeof inputValue === "string" && inputValue.trim().length > 0 ? inputValue.trim() : fallbackRelative;
  if (path.isAbsolute(value)) {
    return value;
  }
  return path.resolve(path.join(root, value));
}

function collectFiles(dirPath, pattern, options = {}) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 200;
  const excludedBasenames = options.excludedBasenames || new Set();
  const output = [];
  const stack = [dirPath];

  while (stack.length > 0 && output.length < limit) {
    const current = stack.pop();
    let entries = [];

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_error) {
      continue;
    }

    for (const entry of entries) {
      if (output.length >= limit) {
        break;
      }

      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!pattern.test(entry.name)) {
        continue;
      }

      if (excludedBasenames.has(entry.name.toLowerCase())) {
        continue;
      }

      output.push(absolute);
    }
  }

  return output;
}

function normalizeReverseEngineering(value) {
  return value === true || value === false ? value : null;
}

function getBriefPreconditions(root, options = {}) {
  const workflow = readWorkflowState(root);
  const reverseEngineering = normalizeReverseEngineering(workflow.setup?.reverseEngineering);

  const referencesDir = resolveInputDir(root, options.referencesDir || workflow.setup?.referencesDir, "refdocs");
  const sourceDir = resolveInputDir(root, options.sourceDir || workflow.setup?.sourceDir, "source-code");

  const references = collectFiles(referencesDir, REF_DOC_PATTERN, {
    excludedBasenames: REF_DOC_EXCLUDED_FILES,
    limit: 200
  });
  const sourceFiles = collectFiles(sourceDir, SOURCE_CODE_PATTERN, { limit: 400 });

  const sourceRequired =
    options.forceSourceCode === true ||
    String(options.requireSourceCode || "false").toLowerCase() === "true" ||
    reverseEngineering === true;

  const blockers = [];

  if (reverseEngineering === null) {
    blockers.push({
      code: "reverse_engineering_not_defined",
      message: "Project type is not defined.",
      action: "Run `init --reverse-engineering yes` or `init --reverse-engineering no`."
    });
  }

  if (references.length < 1) {
    blockers.push({
      code: "missing_refdocs",
      message: `No reference documents found in ${toPosixPath(path.relative(root, referencesDir) || referencesDir)}.`,
      action: "Add at least 1 refdoc file (.md/.txt/.json/.yaml) and retry `generate_brief`."
    });
  }

  if (sourceRequired && sourceFiles.length < 1) {
    blockers.push({
      code: "missing_source_code",
      message: `Reverse engineering mode requires source files in ${toPosixPath(path.relative(root, sourceDir) || sourceDir)}.`,
      action: "Add at least 1 source code file and retry `generate_brief`."
    });
  }

  return {
    ok: blockers.length === 0,
    workflow,
    reverseEngineering,
    referencesDir,
    sourceDir,
    references,
    sourceFiles,
    referencesCount: references.length,
    sourceCount: sourceFiles.length,
    sourceRequired,
    blockers,
    question: "Este proyecto sera de ingenieria inversa?"
  };
}

function buildGenerateBriefBlockingError(preconditions) {
  const lines = ["generate_brief blocked."];

  preconditions.blockers.forEach((blocker) => {
    lines.push(`- ${blocker.message}`);
    lines.push(`  Action: ${blocker.action}`);
  });

  return lines.join("\n");
}

module.exports = {
  getBriefPreconditions,
  buildGenerateBriefBlockingError,
  normalizeReverseEngineering
};
