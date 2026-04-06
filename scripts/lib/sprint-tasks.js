const fs = require("fs");
const path = require("path");

function sprintFolderName(sprintNum) {
  return `sprint-${String(sprintNum).padStart(2, "0")}`;
}

function getTasksFilePath(root, sprintNum) {
  return path.join(root, "planning", "sprints", sprintFolderName(sprintNum), "tasks.md");
}

/**
 * Parses the Status column from planning/sprints/sprint-NN/tasks.md (markdown table).
 * @returns {string[]} status values per data row, in order
 */
function parseTaskStatusesFromMarkdown(content) {
  const lines = content.split(/\r?\n/);
  let statusColIndex = -1;
  const statuses = [];

  for (const line of lines) {
    if (!line.trim().startsWith("|")) {
      continue;
    }
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.length === 0) {
      continue;
    }

    if (cells.some((c) => /^---+$/i.test(c) || c === ":---")) {
      continue;
    }

    if (cells.some((c) => /^status$/i.test(c))) {
      statusColIndex = cells.findIndex((c) => /^status$/i.test(c));
      continue;
    }

    if (statusColIndex >= 0 && cells.length > statusColIndex) {
      const first = cells[0];
      if (/^T-\d+$/i.test(first)) {
        statuses.push(cells[statusColIndex]);
      }
    }
  }

  return statuses;
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * @param {string} root - project root
 * @param {number} sprintNum - sprint number (1-based)
 * @returns {{ ok: boolean, statuses: string[], path: string }}
 */
function getSprintTaskStatusReport(root, sprintNum) {
  const filePath = getTasksFilePath(root, sprintNum);
  if (!fs.existsSync(filePath)) {
    return { ok: false, statuses: [], path: filePath, error: "missing_file" };
  }
  const content = fs.readFileSync(filePath, "utf8");
  const statuses = parseTaskStatusesFromMarkdown(content);
  if (statuses.length === 0) {
    return { ok: false, statuses: [], path: filePath, error: "no_rows" };
  }
  const pending = statuses.filter((s) => normalizeStatus(s) !== "done");
  return {
    ok: pending.length === 0,
    statuses,
    path: filePath,
    pendingCount: pending.length,
    pending
  };
}

function assertAllSprintTasksDone(root, sprintNum, contextLabel) {
  const report = getSprintTaskStatusReport(root, sprintNum);
  if (report.error === "missing_file") {
    throw new Error(
      `${contextLabel}: no se encontró ${path.relative(root, report.path) || report.path}.`
    );
  }
  if (report.error === "no_rows") {
    throw new Error(`${contextLabel}: no hay filas de tareas en ${path.relative(root, report.path)}.`);
  }
  if (!report.ok) {
    const sample = report.pending.slice(0, 5).join(", ") || "sin detalle";
    throw new Error(
      `${contextLabel}: quedan ${report.pendingCount} tarea(s) sin Status \`done\` (ej.: ${sample}).`
    );
  }
}

module.exports = {
  sprintFolderName,
  getTasksFilePath,
  parseTaskStatusesFromMarkdown,
  getSprintTaskStatusReport,
  assertAllSprintTasksDone
};
