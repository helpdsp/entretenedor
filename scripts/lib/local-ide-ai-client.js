const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { cleanJsonText } = require("./text");
const { ensureDir } = require("./io");

function buildCommand(template, inputPath, outputPath) {
  if (!template) {
    throw new Error(
      "LOCAL_IDE_AI_COMMAND is not configured. Set it in .env using {{INPUT_FILE}} and {{OUTPUT_FILE}} placeholders."
    );
  }

  if (template.includes("{{INPUT_FILE}}") || template.includes("{{OUTPUT_FILE}}")) {
    return template
      .replaceAll("{{INPUT_FILE}}", inputPath)
      .replaceAll("{{OUTPUT_FILE}}", outputPath);
  }

  return `${template} --input "${inputPath}" --output "${outputPath}"`;
}

function runLocalIdeAiJson({ root, taskName, payload }) {
  const commandTemplate = process.env.LOCAL_IDE_AI_COMMAND || "";
  const timeoutMs = Number(process.env.LOCAL_IDE_AI_TIMEOUT_MS || "180000");
  const workspaceDir = path.join(root, ".local-ai");
  ensureDir(workspaceDir);

  const stamp = Date.now();
  const inputPath = path.join(workspaceDir, `${taskName}-${stamp}.input.json`);
  const outputPath = path.join(workspaceDir, `${taskName}-${stamp}.output.json`);

  fs.writeFileSync(inputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  const command = buildCommand(commandTemplate, inputPath, outputPath);
  const result = spawnSync(command, {
    shell: true,
    cwd: root,
    encoding: "utf8",
    timeout: timeoutMs
  });

  if (result.status !== 0) {
    throw new Error(
      `Local IDE AI command failed. Status=${result.status}\nSTDERR: ${result.stderr || "(empty)"}`
    );
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Local IDE AI did not create output file: ${outputPath}. Ensure command writes JSON result to {{OUTPUT_FILE}}.`
    );
  }

  const raw = fs.readFileSync(outputPath, "utf8");
  try {
    return JSON.parse(cleanJsonText(raw));
  } catch (error) {
    throw new Error(`Could not parse IDE AI JSON output: ${error.message}`);
  }
}

module.exports = {
  runLocalIdeAiJson
};
