const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

function resolvePathFromRoot(root, targetPath, fallbackRelative) {
  if (targetPath) {
    return path.resolve(targetPath);
  }
  return path.resolve(path.join(root, fallbackRelative));
}

module.exports = {
  parseArgs,
  resolvePathFromRoot
};
