#!/usr/bin/env node

/**
 * clarify_spec_kit
 *
 * Invoked by the agent when the brief has ambiguities before generate_spec_kit.
 * Reads spec-kit/input/brief.md, asks the IDE AI to generate contextual questions,
 * presents them interactively, and saves answers to planning/clarifications/spec_kit.json.
 *
 * Usage:
 *   node scripts/clarify-spec-kit.js
 *   node scripts/clarify-spec-kit.js --answers-file path/to/answers.json
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { loadEnv } = require("./lib/env");
const { parseArgs } = require("./lib/args");
const { writeClarifications, parseAnswer } = require("./lib/clarification-store");
const { generateClarificationQuestions } = require("./lib/clarify-questions");

const STAGE = "spec_kit";
const BRIEF_PATH_REL = path.join("spec-kit", "input", "brief.md");

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
  const briefPath = path.join(root, BRIEF_PATH_REL);
  if (!fs.existsSync(briefPath)) {
    throw new Error(
      `Brief no encontrado en ${BRIEF_PATH_REL}. Ejecuta generate_brief primero.`
    );
  }

  console.log("Generando preguntas de clarificacion desde el brief...");
  const docs = [
    {
      path: BRIEF_PATH_REL.replace(/\\/g, "/"),
      content: fs.readFileSync(briefPath, "utf8")
    }
  ];
  const questions = generateClarificationQuestions(root, docs, "spec_kit");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answers = {};

  try {
    console.log("\n=== Clarificacion del brief para generate_spec_kit ===");
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
  console.log("Siguiente accion: generate_spec_kit");
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
