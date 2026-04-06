#!/usr/bin/env node

/**
 * clarify_sprints
 *
 * Invoked by the agent when the Spec Kit has ambiguities before generate_sprints.
 * Reads spec-kit/input/*.md files, asks the IDE AI to generate contextual questions,
 * presents them interactively, and saves answers to planning/clarifications/sprints.json.
 *
 * Usage:
 *   node scripts/clarify-sprints.js
 *   node scripts/clarify-sprints.js --answers-file path/to/answers.json
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { loadEnv } = require("./lib/env");
const { parseArgs } = require("./lib/args");
const { writeClarifications, parseAnswer } = require("./lib/clarification-store");
const { generateClarificationQuestions } = require("./lib/clarify-questions");

const STAGE = "sprints";
const SPEC_DIR_REL = path.join("spec-kit", "input");

const SPEC_FILES = [
  "epics.md",
  "stories.md",
  "sprint-plan.md",
  "PRD.md",
  "technical-spec.md"
];

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

async function runInteractive(root) {
  const specDir = path.join(root, SPEC_DIR_REL);
  const docs = SPEC_FILES
    .map((f) => ({ rel: f, abs: path.join(specDir, f) }))
    .filter((f) => fs.existsSync(f.abs))
    .map((f) => ({
      path: path.join(SPEC_DIR_REL, f.rel).replace(/\\/g, "/"),
      content: fs.readFileSync(f.abs, "utf8").slice(0, 8000)
    }));

  if (docs.length === 0) {
    throw new Error(
      `No se encontraron artefactos del Spec Kit en ${SPEC_DIR_REL}. Ejecuta generate_spec_kit primero.`
    );
  }

  console.log(`Generando preguntas de clarificacion desde el Spec Kit (${docs.length} documentos)...`);
  const questions = generateClarificationQuestions(root, docs, "sprints");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answers = {};

  try {
    console.log("\n=== Clarificacion del Spec Kit para generate_sprints ===");
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

  let result;
  if (args["answers-file"]) {
    result = runFromFile(root, String(args["answers-file"]));
    console.log("Clarificaciones cargadas desde archivo.");
  } else {
    result = await runInteractive(root);
  }

  writeClarifications(root, STAGE, result.answers, { questions: result.questions || [] });
  console.log(`\nClarificaciones guardadas en planning/clarifications/${STAGE}.json`);
  console.log("Siguiente accion: generate_sprints");
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
