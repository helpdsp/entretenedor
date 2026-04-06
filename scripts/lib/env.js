const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function loadEnv(rootDir) {
  const candidates = [
    path.join(rootDir, ".env"),
    path.join(rootDir, ".env.local")
  ];

  candidates.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      const parsed = dotenv.parse(fs.readFileSync(filePath, "utf8"));
      Object.entries(parsed).forEach(([key, value]) => {
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      });
    }
  });
}

module.exports = {
  loadEnv
};
