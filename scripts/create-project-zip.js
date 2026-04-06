#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { parseArgs, resolvePathFromRoot } = require("./lib/args");
const { loadEnv } = require("./lib/env");

function getProjectSlug(root) {
  try {
    const configPath = path.join(root, "config", "project.config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const slug = config.projectSlug || "";
    if (!slug || /__.*__/.test(slug)) {
      return "project";
    }
    return slug;
  } catch (_error) {
    return "project";
  }
}

function zipDirectory(sourceDir, outputFile) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFile);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve({ bytes: archive.pointer() }));
    archive.on("error", (error) => reject(error));
    archive.pipe(output);

    archive.glob("**/*", {
      cwd: sourceDir,
      dot: true,
      ignore: [
        "node_modules/**",
        ".git/**",
        "dist/**",
        ".matrix/**",
        "*.log"
      ]
    });

    archive.finalize();
  });
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const slug = getProjectSlug(root);
  const distDir = path.join(root, "dist");
  fs.mkdirSync(distDir, { recursive: true });

  const outputPath = resolvePathFromRoot(
    root,
    args.output,
    `dist/${slug}-planning-kit.zip`
  );

  const result = await zipDirectory(root, outputPath);
  console.log(`ZIP created: ${outputPath}`);
  console.log(`Size: ${result.bytes} bytes`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
