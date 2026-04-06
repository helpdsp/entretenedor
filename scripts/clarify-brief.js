#!/usr/bin/env node

/**
 * clarify_brief
 *
 * Invoked by the agent when the refdocs have ambiguities before generate_brief.
 * Reads refdocs/, asks the IDE AI to generate contextual questions,
 * presents them interactively, and saves answers to planning/clarifications/brief.json.
 *
 * Usage:
 *   node scripts/clarify-brief.js
 *   node scripts/clarify-brief.js --answers-file path/to/answers.json
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { loadEnv } = require("./lib/env");
const { parseArgs } = require("./lib/args");
const { writeClarifications, parseAnswer } = require("./lib/clarification-store");
const { getBriefPreconditions } = require("./lib/brief-preconditions");
const { generateClarificationQuestions } = require("./lib/clarify-questions");
const { mergeFixedUxQuestions } = require("./lib/fixed-ux-questions");

const STAGE = "brief";

function readContextDocs(files, root, maxCharsPerFile = 8000) {
  return files.slice(0, 20).map((f) => ({
    path: path.relative(root, f).replace(/\\/g, "/"),
    content: fs.readFileSync(f, "utf8").slice(0, maxCharsPerFile)
  }));
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

async function runInteractive(root) {
  const preconditions = getBriefPreconditions(root);
  if (preconditions.referencesCount === 0) {
    throw new Error("No hay refdocs en refdocs/. Agrega al menos 1 documento antes de clarify_brief.");
  }

  console.log("Generando preguntas de clarificacion desde los refdocs...");
  const docs = readContextDocs(preconditions.references, root);
  const aiQuestions = generateClarificationQuestions(root, docs, "brief");
  const questions = mergeFixedUxQuestions(aiQuestions, root);
  if (questions.length > aiQuestions.length) {
    console.log(
      `Se anadieron ${questions.length - aiQuestions.length} preguntas UX fijas (config/ux-clarification.json).`
    );
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answers = {};

  try {
    console.log("\n=== Clarificacion de refdocs para generate_brief ===");
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
  console.log("Siguiente accion: generate_brief");
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
