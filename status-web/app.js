const modeBadge = document.getElementById("modeBadge");
const reverseQuestion = document.getElementById("reverseQuestion");
const workflowStatus = document.getElementById("workflowStatus");
const workflowFacts = document.getElementById("workflowFacts");
const nextCommand = document.getElementById("nextCommand");
const nextReason = document.getElementById("nextReason");
const checklist = document.getElementById("checklist");
const clarificationsStatus = document.getElementById("clarificationsStatus");
const matrixStatus = document.getElementById("matrixStatus");
const blockers = document.getElementById("blockers");

function createItem(text, tone = "") {
  const item = document.createElement("li");
  item.textContent = text;
  if (tone) {
    item.classList.add(tone);
  }
  return item;
}

function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function toneForMatrixStatus(status) {
  if (status === "connected") {
    return "ok";
  }
  if (status === "pending_auth") {
    return "warn";
  }
  if (status === "denied") {
    return "error";
  }
  return "";
}

function formatReverseEngineering(value) {
  if (value === true) {
    return "yes";
  }
  if (value === false) {
    return "no";
  }
  return "pending";
}

function render(data) {
  modeBadge.textContent = data.mode === "connected-to-matrix" ? "Connected To Matrix" : "Local-Only Mode";
  reverseQuestion.textContent = `${data.briefPreconditions.question} Current value: ${formatReverseEngineering(data.briefPreconditions.reverseEngineering)}.`;
  workflowStatus.textContent = data.workflow.status;

  clearChildren(workflowFacts);
  workflowFacts.appendChild(createItem(`Reverse engineering: ${formatReverseEngineering(data.briefPreconditions.reverseEngineering)}`));
  workflowFacts.appendChild(createItem(`Refdocs: ${data.briefPreconditions.referencesCount} in ${data.briefPreconditions.referencesDir}`));
  workflowFacts.appendChild(
    createItem(
      data.briefPreconditions.sourceRequired
        ? `Source code: ${data.briefPreconditions.sourceCount} in ${data.briefPreconditions.sourceDir} (required)`
        : `Source code: optional (${data.briefPreconditions.sourceCount} detected)`
    )
  );
  workflowFacts.appendChild(createItem(`Brief: ${data.workflow.brief.generated ? "generated" : "pending"} / ${data.workflow.brief.approved ? "approved" : "not approved"}`));
  workflowFacts.appendChild(createItem(`Spec: ${data.workflow.spec.generated ? "generated" : "pending"} / ${data.workflow.spec.approved ? "approved" : "not approved"}`));
  workflowFacts.appendChild(createItem(`Sprints: ${data.workflow.sprints.generated ? "planned" : "pending"} / total ${data.workflow.sprints.total || 0}`));
  workflowFacts.appendChild(createItem(`Active sprint: ${data.workflow.sprints.active || "none"}`));
  workflowFacts.appendChild(createItem(`Completed sprints: ${(data.workflow.sprints.completed || []).join(", ") || "none"}`));

  nextCommand.textContent = data.nextAction.command;
  nextReason.textContent = data.nextAction.blocked
    ? `BLOCKED - ${data.nextAction.reason}`
    : data.nextAction.reason;

  clearChildren(checklist);
  data.setupChecklist.forEach((entry) => {
    const tone = entry.done ? "ok" : "warn";
    checklist.appendChild(createItem(`${entry.done ? "PASS" : "TODO"} - ${entry.label}. ${entry.done ? "" : entry.hint}`, tone));
  });

  if (clarificationsStatus) {
    clearChildren(clarificationsStatus);
    const cl = data.clarifications || {};
    const briefDone = Boolean(cl.brief);
    const sprintsDone = Boolean(cl.sprints);
    clarificationsStatus.appendChild(
      createItem(
        `Brief clarification: ${briefDone ? "complete" : "pending — run clarify_brief"}`,
        briefDone ? "ok" : "warn"
      )
    );
    clarificationsStatus.appendChild(
      createItem(
        `Sprints clarification: ${sprintsDone ? "complete" : "pending — run clarify_sprints"}`,
        sprintsDone ? "ok" : "warn"
      )
    );
  }

  clearChildren(matrixStatus);
  matrixStatus.appendChild(createItem(`Status: ${data.matrix.status}`, toneForMatrixStatus(data.matrix.status)));
  matrixStatus.appendChild(createItem(`API key configured: ${data.matrix.apiKeyConfigured ? "yes" : "no"}`));
  matrixStatus.appendChild(createItem(`Base URL: ${data.matrix.baseUrl || "not configured"}`));
  matrixStatus.appendChild(createItem(`Project ID: ${data.matrix.projectId || "not configured"}`));
  matrixStatus.appendChild(createItem(`Workspace ID: ${data.matrix.workspaceId || "not configured"}`));
  matrixStatus.appendChild(createItem(`Authorized at: ${data.matrix.authorizedAt || "-"}`));
  matrixStatus.appendChild(createItem(`Authorized by: ${data.matrix.authorizedBy || "-"}`));
  matrixStatus.appendChild(createItem(`Queued reports: ${data.matrix.queuedReports}`));

  clearChildren(blockers);
  if (!data.blockers || data.blockers.length === 0) {
    blockers.appendChild(createItem("No blockers detected.", "ok"));
  } else {
    data.blockers.forEach((entry) => {
      blockers.appendChild(createItem(`${entry.message} ${entry.unblock}`, "warn"));
    });
  }
}

async function fetchStatus() {
  const response = await fetch("/api/status", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load status (${response.status}).`);
  }
  const payload = await response.json();
  render(payload);
}

async function refresh() {
  try {
    await fetchStatus();
  } catch (error) {
    modeBadge.textContent = "Status unavailable";
    nextReason.textContent = error.message;
  }
}

refresh();
setInterval(refresh, 4000);
