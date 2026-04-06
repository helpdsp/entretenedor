#!/usr/bin/env node

const { loadEnv } = require("./lib/env");
const { syncPendingReports } = require("./lib/matrix-client");

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const result = await syncPendingReports(root);
  if (result.skipped) {
    console.log(`Running local-only mode: matrix sync skipped (${result.reason}). Remaining queued: ${result.remaining}`);
    return;
  }
  console.log(`Matrix sync completed. Synced: ${result.synced}, Remaining: ${result.remaining}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
