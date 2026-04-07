#!/usr/bin/env node

/**
 * add-ide.js
 *
 * Add IDE support to an existing VISION project.
 * Generates IDE configuration files for the specified IDE(s).
 *
 * Usage:
 *   node scripts/add-ide.js --ide cursor
 *   node scripts/add-ide.js --ide cursor,claude
 *   node scripts/add-ide.js --ide cursor --ide claude
 *   node scripts/add-ide.js --all
 *   node scripts/add-ide.js --list
 *   node scripts/add-ide.js --ide cursor --dry-run
 *   node scripts/add-ide.js --ide cursor --force
 */

const fs = require('fs');
const path = require('path');

const {
  getAvailableIdes,
  isIdeSupported,
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
    ide: [],
    all: false,
    list: false,
    dryRun: false,
    force: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ide' && args[i + 1]) {
      // Handle comma-separated values and multiple --ide flags
      const values = args[++i]
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      opts.ide.push(...values);
    } else if (args[i] === '--all') {
      opts.all = true;
    } else if (args[i] === '--list') {
      opts.list = true;
    } else if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (args[i] === '--force') {
      opts.force = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      opts.help = true;
    }
  }

  return opts;
}

function showHelp() {
  console.log(`
${c.bold}VISION Framework - Add IDE Support${c.reset}

Add IDE configuration files to an existing VISION project.

${c.bold}Usage:${c.reset}
  node scripts/add-ide.js [options]

${c.bold}Options:${c.reset}
  --ide <name>      Add specific IDE (comma-separated or multiple flags)
  --all             Add all available IDEs
  --list            List available IDEs and their configuration status
  --dry-run         Preview what would be created without writing files
  --force           Overwrite existing IDE configurations
  --help, -h        Show this help message

${c.bold}Examples:${c.reset}
  node scripts/add-ide.js --ide cursor
  node scripts/add-ide.js --ide cursor,claude
  node scripts/add-ide.js --ide cursor --ide copilot
  node scripts/add-ide.js --all
  node scripts/add-ide.js --list
  node scripts/add-ide.js --ide claude --dry-run
  node scripts/add-ide.js --ide claude --force

${c.bold}Available IDEs:${c.reset}`);

  const ides = getAvailableIdes();
  ides.forEach((ide) => {
    console.log(`  ${c.cyan}${ide.id}${c.reset} - ${ide.name} (${ide.description})`);
  });

  console.log('');
}

function listIdes(root) {
  const ides = getAvailableIdes();

  console.log(`\n${c.bold}Available IDEs:${c.reset}\n`);

  ides.forEach((ide) => {
    const configured = isIdeConfigured(root, ide.id);
    const workspaceDir = path.relative(root, getWorkspaceDir(root, ide.id));

    if (configured) {
      console.log(`  ${c.green}✓${c.reset} ${c.cyan}${ide.id}${c.reset} - ${ide.name}`);
      console.log(`    ${c.dim}Configured at: ${workspaceDir}${c.reset}`);
    } else {
      console.log(`  ${c.red}✗${c.reset} ${c.cyan}${ide.id}${c.reset} - ${ide.name}`);
      console.log(`    ${c.dim}Would create: ${workspaceDir}${c.reset}`);
    }
  });

  console.log('');
}

function getCommandFiles(root) {
  const commandsDir = path.join(root, 'commands');
  if (!fs.existsSync(commandsDir)) {
    return [];
  }
  return fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
}

function addIde(root, ide, files, opts) {
  if (!isIdeSupported(ide)) {
    console.log(`${c.yellow}⚠${c.reset}  Skipping unsupported IDE: ${ide}`);
    return { added: false, skipped: true, error: 'Unsupported IDE' };
  }

  const alreadyConfigured = isIdeConfigured(root, ide);

  if (alreadyConfigured && !opts.force) {
    console.log(
      `${c.yellow}⚠${c.reset}  Skipping ${c.cyan}${ide}${c.reset} (already configured, use --force to overwrite)`,
    );
    return { added: false, skipped: true, reason: 'Already configured' };
  }

  if (alreadyConfigured && opts.force) {
    console.log(
      `${c.yellow}!${c.reset}  Overwriting existing ${c.cyan}${ide}${c.reset} configuration`,
    );
  }

  const commandsDir = path.join(root, 'commands');
  const result = generateIdeFiles(root, ide, files, commandsDir, opts.dryRun);

  if (result.error) {
    console.log(`${c.red}✗${c.reset}  Failed to add ${c.cyan}${ide}${c.reset}: ${result.error}`);
    return { added: false, error: result.error };
  }

  if (opts.dryRun) {
    console.log(
      `${c.dim}[dry-run]${c.reset} ${c.cyan}${ide}${c.reset} would create ${result.count} files:`,
    );
    result.files.forEach((f) => {
      const relPath = path.relative(root, f.file);
      console.log(`    ${c.dim}→ ${relPath}${c.reset}`);
    });
  } else {
    console.log(`${c.green}✓${c.reset}  ${c.cyan}${ide}${c.reset} - ${result.count} files created`);
    result.files.forEach((f) => {
      const relPath = path.relative(root, f.file);
      console.log(`    ${c.dim}→ ${relPath}${c.reset}`);
    });
  }

  return { added: true, count: result.count, dryRun: opts.dryRun };
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
    console.log(
      `${c.red}Error:${c.reset} No commands/ directory found. Are you in a VISION project?`,
    );
    process.exit(1);
  }

  // List mode
  if (opts.list) {
    listIdes(root);
    process.exit(0);
  }

  // Determine which IDEs to add
  let targetIdes = [];
  if (opts.all) {
    targetIdes = getAvailableIdes().map((i) => i.id);
  } else if (opts.ide.length > 0) {
    targetIdes = opts.ide;
  } else {
    console.log(`${c.yellow}No IDE specified.${c.reset} Use --ide, --all, or --list.`);
    console.log(`Run with --help for usage information.\n`);
    process.exit(1);
  }

  // Get command files
  const files = getCommandFiles(root);
  if (files.length === 0) {
    console.log(`${c.yellow}Warning:${c.reset} No command files found in commands/`);
    process.exit(1);
  }

  // Show header
  console.log(`\n${c.blue}${c.bold}Adding IDE support to VISION project${c.reset}\n`);

  if (opts.dryRun) {
    console.log(`${c.dim}[DRY-RUN MODE] No files will be created${c.reset}\n`);
  }

  // Add each IDE
  const results = [];
  for (const ide of targetIdes) {
    const result = addIde(root, ide, files, opts);
    results.push({ ide, ...result });
  }

  // Summary
  console.log(`\n${c.bold}Summary:${c.reset}`);
  const added = results.filter((r) => r.added);
  const skipped = results.filter((r) => r.skipped);
  const errors = results.filter((r) => r.error && !r.skipped);

  if (added.length > 0) {
    const mode = opts.dryRun ? 'would be added' : 'added';
    console.log(`  ${c.green}✓${c.reset} ${added.length} IDE(s) ${mode}`);
  }
  if (skipped.length > 0) {
    console.log(`  ${c.yellow}⚠${c.reset} ${skipped.length} IDE(s) skipped`);
  }
  if (errors.length > 0) {
    console.log(`  ${c.red}✗${c.reset} ${errors.length} IDE(s) failed`);
  }

  console.log('');
}

main();
