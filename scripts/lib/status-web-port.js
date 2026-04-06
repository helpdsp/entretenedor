const net = require("net");

const DEFAULT_PORT = 4173;
const MAX_PORT_ATTEMPTS = 64;

/**
 * Returns true if nothing is listening on host:port (IPv4).
 */
function isPortFree(port, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        resolve(false);
        return;
      }
      reject(err);
    });
    server.listen({ port, host }, () => {
      server.close(() => resolve(true));
    });
  });
}

/**
 * Picks the first free port starting at preferredPort (inclusive), same host as the status web server.
 */
async function findAvailablePort(preferredPort, options = {}) {
  const host = options.host || "127.0.0.1";
  const maxAttempts = Number.isFinite(options.maxAttempts) ? options.maxAttempts : MAX_PORT_ATTEMPTS;

  let start = Number(preferredPort);
  if (!Number.isFinite(start) || start < 1 || start > 65535) {
    start = DEFAULT_PORT;
  }

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = start + i;
    if (candidate > 65535) {
      break;
    }
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(candidate, host)) {
      return candidate;
    }
  }

  throw new Error(`No free TCP port found on ${host} starting at ${start} (${maxAttempts} attempts).`);
}

module.exports = {
  DEFAULT_PORT,
  findAvailablePort,
  isPortFree
};
