#!/usr/bin/env node

/**
 * upgrade.js
 *
 * Refresh IDE configurations for all configured IDEs in the project.
 * Detects which IDEs are already configured and re-generates their framework files.
 *
 * Usage:
 *   node scripts/upgrade.js
 *   node scripts/upgrade.js --dry-run
 *   node scripts/upgrade.js --list
 *   node scripts/upgrade.js --help
 */

const fs = require('fs');
const path = require('path');

const {
  getAvailableIdes,
  isIdeConfigured,
  getWorkspaceDir,
  generateIdeFiles,
} = require('./lib/ide-builders');

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: false,
    list: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (args[i] === '--list') {
      opts.list = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      opts.help = true;
    }
  }

  return opts;
}

function showHelp() {
  console.log(`
${c.bold}VISION Framework - Upgrade IDE Configurations${c.reset}

Refresh IDE configuration files for all configured IDEs in the project.
Auto-detects which IDEs are configured and re-generates their files.

${c.bold}Usage:${c.reset}
  node scripts/upgrade.js [options]

${c.bold}Options:${c.reset}
  --dry-run         Preview what would be refreshed without modifying files
  --list            Show which IDEs are configured and would be refreshed
  --help, -h        Show this help message

${c.bold}Examples:${c.reset}
  node scripts/upgrade.js              # Refresh all configured IDEs
  node scripts/upgrade.js --dry-run    # Preview changes
  node scripts/upgrade.js --list       # List configured IDEs

${c.bold}How it works:${c.reset}
  1. Scans for existing IDE config directories (.cursor/, .claude/, etc.)
  2. Re-generates IDE configuration files with latest commands
  3. Reports which IDEs were refreshed

Use this command after:
  - Framework commands are updated
  - New commands are added to commands/
  - You want to ensure IDE configs are synchronized
`);
}

function listConfiguredIdes(root) {
  const allIdes = getAvailableIdes();
  const configured = [];
  const notConfigured = [];

  for (const ide of allIdes) {
    if (isIdeConfigured(root, ide.id)) {
      configured.push(ide);
    } else {
      notConfigured.push(ide);
    }
  }

  console.log(`\n${c.bold}IDE Configuration Status:${c.reset}\n`);

  if (configured.length > 0) {
    console.log(`${c.green}Configured (would be refreshed):${c.reset}`);
    for (const ide of configured) {
      const workspaceDir = path.relative(root, getWorkspaceDir(root, ide.id));
      console.log(`  ${c.green}✓${c.reset} ${c.cyan}${ide.id}${c.reset} - ${ide.name}`);
      console.log(`    ${c.dim}Location: ${workspaceDir}${c.reset}`);
    }
  }

  if (notConfigured.length > 0) {
    console.log(`\n${c.dim}Not configured (use ./bin/add_ide --ide <name> to add):${c.reset}`);
    for (const ide of notConfigured) {
      console.log(`  ${c.red}✗${c.reset} ${c.dim}${ide.id} - ${ide.name}${c.reset}`);
    }
  }

  console.log('');
  return configured;
}

function getCommandFiles(root) {
  const commandsDir = path.join(root, 'commands');
  if (!fs.existsSync(commandsDir)) {
    return [];
  }
  return fs
    .readdirSync(commandsDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md');
}

function main() {
  const opts = parseArgs();
  const root = process.cwd();

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  // Check if this is a VISION project
  const commandsDir = path.join(root, 'commands');
  if (!fs.existsSync(commandsDir)) {
    console.log(`${c.red}Error:${c.reset} No commands/ directory found. Are you in a VISION project?`);
    process.exit(1);
  }

  // List mode
  if (opts.list) {
    listConfiguredIdes(root);
    process.exit(0);
  }

  // Get command files
  const files = getCommandFiles(root);
  if (files.length === 0) {
    console.log(`${c.yellow}Warning:${c.reset} No command files found in commands/`);
    process.exit(1);
  }

  // Detect configured IDEs
  const allIdes = getAvailableIdes();
  const configuredIdes = allIdes.filter((ide) => isIdeConfigured(root, ide.id));

  if (configuredIdes.length === 0) {
    console.log(`\n${c.yellow}No configured IDEs found.${c.reset}`);
    console.log(`Run ${c.cyan}./bin/add_ide --ide <name>${c.reset} to add IDE support first.`);
    console.log(`Or run ${c.cyan}./bin/upgrade --list${c.reset} to see available IDEs.\n`);
    process.exit(0);
  }

  // Show header
  console.log(`\n${c.blue}${c.bold}VISION Framework - Upgrade IDE Configurations${c.reset}\n`);

  if (opts.dryRun) {
    console.log(`${c.dim}[DRY-RUN MODE] No files will be modified${c.reset}\n`);
  }

  console.log(`Scanning for configured IDEs...`);
  console.log(`  ${c.green}✓${c.reset} Found: ${configuredIdes.map((i) => i.id).join(', ')}\n`);

  if (opts.dryRun) {
    console.log(`${c.dim}Would refresh:${c.reset}`);
    for (const ide of configuredIdes) {
      console.log(`  ${c.cyan}${ide.id}${c.reset}`);
    }
    console.log(`\n${c.dim}(No files modified in dry-run mode)${c.reset}\n`);
    process.exit(0);
  }

  // Refresh each configured IDE
  console.log(`${c.bold}Refreshing configurations:${c.reset}\n`);

  const results = [];
  for (const ide of configuredIdes) {
    const result = generateIdeFiles(root, ide.id, files, commandsDir, false);

    if (result.error) {
      console.log(`${c.red}✗${c.reset}  ${c.cyan}${ide.id}${c.reset} - Failed: ${result.error}`);
      results.push({ ide: ide.id, success: false, error: result.error });
    } else {
      console.log(`${c.green}✓${c.reset}  ${c.cyan}${ide.id}${c.reset} - ${result.count} files refreshed`);
      result.files.forEach((f) => {
        const relPath = path.relative(root, f.file);
        console.log(`    ${c.dim}→ ${relPath}${c.reset}`);
      });
      results.push({ ide: ide.id, success: true, count: result.count });
    }
  }

  // Summary
  console.log(`\n${c.bold}Summary:${c.reset}`);
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    console.log(`  ${c.green}✓${c.reset} ${successful.length} IDE(s) refreshed with latest commands`);
  }
  if (failed.length > 0) {
    console.log(`  ${c.red}✗${c.reset} ${failed.length} IDE(s) failed to refresh`);
  }

  console.log('');
}

main();
