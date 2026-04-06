#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { parseArgs } = require("./lib/args");
const { loadEnv } = require("./lib/env");
const { buildStatusSummary } = require("./lib/status-summary");
const { findAvailablePort, DEFAULT_PORT } = require("./lib/status-web-port");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME_TYPES[extension] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
}

async function main() {
  const root = process.cwd();
  loadEnv(root);
  const args = parseArgs(process.argv.slice(2));
  const preferred = Number(args.port || process.env.STATUS_WEB_PORT || DEFAULT_PORT);
  const strictRaw = args["strict-port"];
  const strictPort =
    strictRaw === true || ["1", "true", "yes"].includes(String(strictRaw || "").trim().toLowerCase());
  const staticRoot = path.join(root, "status-web");

  if (!fs.existsSync(path.join(staticRoot, "index.html"))) {
    throw new Error("status-web/index.html was not found.");
  }

  let port;
  if (strictPort) {
    port = preferred;
  } else {
    try {
      port = await findAvailablePort(preferred);
    } catch (error) {
      console.error(`VISION status web: ${error.message}`);
      process.exit(1);
    }
    if (port !== preferred) {
      console.warn(`VISION status web: port ${preferred} in use, using ${port} instead.`);
    }
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/api/status") {
      try {
        const summary = buildStatusSummary(root);
        sendJson(res, 200, summary);
      } catch (error) {
        sendJson(res, 500, { ok: false, error: error.message });
      }
      return;
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const normalized = path.normalize(requestedPath).replace(/^(\.\.[\\/])+/, "");
    const absolutePath = path.join(staticRoot, normalized);
    serveFile(res, absolutePath);
  });

  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const hint = strictPort
        ? "strict bind — choose another STATUS_WEB_PORT or free this port."
        : "port became busy before listen; retry once.";
      console.error(`VISION status web: port ${port} already in use (${hint})`);
      process.exit(1);
    }
    console.error(`VISION status web: ${err.message}`);
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`VISION status web running at http://127.0.0.1:${port}`);
    console.log("Press Ctrl+C to stop.");
  });
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
