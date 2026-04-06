#!/usr/bin/env node

/**
 * clarify_sprint
 *
 * Invoked by the agent when a sprint plan has ambiguities before start_sprint.
 * Reads planning/sprints/sprint-0N/, asks the IDE AI to generate contextual questions,
 * presents them interactively, and saves answers to planning/clarifications/sprint-N.json.
 *
 * Usage:
 *   node scripts/clarify-sprint.js --sprint 1
 *   node scripts/clarify-sprint.js --sprint 2 --answers-file path/to/answers.json
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { loadEnv } = require("./lib/env");
const { parseArgs } = require("./lib/args");
const { writeClarifications, parseAnswer } = require("./lib/clarification-store");
const { generateClarificationQuestions } = require("./lib/clarify-questions");

const SPRINT_FILES = ["goal.md", "stories.md", "tasks.md", "qa-plan.md"];

function sprintDir(n) {
  return path.join("planning", "sprints", `sprint-${String(n).padStart(2, "0")}`);
}

function formatQuestion(q, index, total) {
  const lines = [`\n[${index + 1}/${total}] ${q.prompt}:`];
  q.options.forEach((opt, i) => lines.push(`  ${i + 1}. ${opt}`));
  lines.push("  0. Respuesta libre");
  return lines.join("\n");
}

function askQuestion(rl, q, index, total) {
  return new Promise((resolve) => {
    console.log(formatQuestion(q, index, total));

    function prompt() {
      rl.question("Respuesta: ", (line) => {
        const result = parseAnswer(line, q.options);
        if (!result.valid) {
          console.log(`  → ${result.reason}`);
          prompt();
          return;
        }
        if (result.needsFreeText) {
          rl.question("  Escribe tu respuesta: ", (text) => {
            if (!text.trim()) {
              console.log("  → La respuesta no puede estar vacia.");
              prompt();
              return;
            }
            resolve(text.trim());
          });
          return;
        }
        resolve(result.value);
      });
    }

    prompt();
  });
}

async function runInteractive(root, sprintNum) {
  const relDir = sprintDir(sprintNum);
  const absDir = path.join(root, relDir);

  if (!fs.existsSync(absDir)) {
    throw new Error(
      `Directorio del sprint no encontrado: ${relDir}. Ejecuta generate_sprints primero.`
    );
  }

  const docs = SPRINT_FILES
    .map((f) => ({ rel: path.join(relDir, f), abs: path.join(absDir, f) }))
    .filter((f) => fs.existsSync(f.abs))
    .map((f) => ({
      path: f.rel.replace(/\\/g, "/"),
      content: fs.readFileSync(f.abs, "utf8").slice(0, 6000)
    }));

  if (docs.length === 0) {
    throw new Error(`No se encontraron archivos en ${relDir}.`);
  }

  console.log(`Generando preguntas de clarificacion para sprint ${sprintNum} (${docs.length} archivos)...`);
  const questions = generateClarificationQuestions(root, docs, "sprint");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answers = {};

  try {
    console.log(`\n=== Clarificacion del sprint ${sprintNum} para start_sprint ===`);
    console.log("Responde con el numero de opcion o escribe tu respuesta directamente.\n");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // eslint-disable-next-line no-await-in-loop
      answers[q.id] = await askQuestion(rl, q, i, questions.length);
    }
  } finally {
    rl.close();
  }

  return { answers, questions };
}

function runFromFile(root, answersFilePath) {
  const absPath = path.isAbsolute(answersFilePath)
    ? answersFilePath
    : path.join(root, answersFilePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Answers file not found: ${absPath}`);
  }
  const data = JSON.parse(fs.readFileSync(absPath, "utf8"));
  if (typeof data !== "object" || data === null) {
    throw new Error("answers-file must be a JSON object.");
  }
  return { answers: data };
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));

  const sprintNum = args.sprint ? Number(args.sprint) : null;
  if (!sprintNum || isNaN(sprintNum) || sprintNum < 1) {
    throw new Error("Especifica el sprint con --sprint N (ej: clarify_sprint --sprint 1)");
  }

  const stage = `sprint-${sprintNum}`;

  let result;
  if (args["answers-file"]) {
    result = runFromFile(root, String(args["answers-file"]));
    console.log("Clarificaciones cargadas desde archivo.");
  } else {
    result = await runInteractive(root, sprintNum);
  }

  writeClarifications(root, stage, result.answers, {
    sprint: sprintNum,
    questions: result.questions || []
  });
  console.log(`\nClarificaciones guardadas en planning/clarifications/${stage}.json`);
  console.log(`Siguiente accion: start_sprint --sprint ${sprintNum}`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
