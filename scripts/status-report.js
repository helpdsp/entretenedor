#!/usr/bin/env node

const { loadEnv } = require("./lib/env");
const { buildStatusSummary } = require("./lib/status-summary");


async function main() {
  const root = process.cwd();
  loadEnv(root);
  const summary = buildStatusSummary(root);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
