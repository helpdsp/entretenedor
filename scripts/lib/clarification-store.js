const fs = require("fs");
const path = require("path");
const { ensureDir } = require("./io");

const CLARIFICATIONS_REL = path.join("planning", "clarifications");

/**
 * Valid clarification stages:
 *   "brief"    - from refdocs  → informs generate_brief
 *   "spec_kit" - from brief    → informs generate_spec_kit
 *   "sprints"  - from spec kit → informs generate_sprints
 *   "sprint-N" - from sprint N → informs start_sprint --sprint N
 */

function getClarificationsPath(root, stage) {
  return path.join(root, CLARIFICATIONS_REL, `${stage}.json`);
}

function readClarifications(root, stage) {
  const filePath = getClarificationsPath(root, stage);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return null;
  }
}

function writeClarifications(root, stage, answers, meta) {
  const filePath = getClarificationsPath(root, stage);
  ensureDir(path.dirname(filePath));
  const record = Object.assign(
    { stage, answers, completedAt: new Date().toISOString() },
    meta || {}
  );
  fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
}

/**
 * Completeness check: file exists and has at least one non-empty answer.
 * Questions are AI-generated and vary per project, so we don't validate specific IDs.
 */
function isClarificationsComplete(root, stage) {
  const data = readClarifications(root, stage);
  if (!data || typeof data.answers !== "object" || data.answers === null) {
    return false;
  }
  return Object.values(data.answers).some(
    (v) => typeof v === "string" && v.trim().length > 0
  );
}

/**
 * Parse a raw CLI line against a set of options.
 * Returns:
 *   { valid: true, value: string }          - answer ready to save
 *   { valid: true, needsFreeText: true }     - user typed 0, prompt for free text
 *   { valid: false, reason: string }         - invalid input, caller should retry
 */
function parseAnswer(raw, options) {
  const trimmed = String(raw == null ? "" : raw).trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: "Entrada vacia. Escribe un numero o respuesta directa." };
  }
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num === 0) {
      return { valid: true, needsFreeText: true };
    }
    if (num >= 1 && num <= options.length) {
      return { valid: true, value: options[num - 1] };
    }
    return { valid: false, reason: `Numero invalido. Escribe entre 0 y ${options.length}.` };
  }
  return { valid: true, value: trimmed };
}

module.exports = {
  getClarificationsPath,
  readClarifications,
  writeClarifications,
  isClarificationsComplete,
  parseAnswer
};
