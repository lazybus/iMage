import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const HOSTNAME = process.env.HOSTNAME ?? "0.0.0.0";
const require = createRequire(import.meta.url);
const nextCliPath = require.resolve("next/dist/bin/next");

function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error && typeof error === "object" && "code" in error) {
        const errorCode = error.code;

        if (errorCode === "EADDRINUSE" || errorCode === "EACCES") {
          resolve(false);
          return;
        }
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;

  while (!(await isPortAvailable(port))) {
    port += 1;
  }

  return port;
}

async function main() {
  const port = await findAvailablePort(DEFAULT_PORT);
  const args = [nextCliPath, "dev", "--turbopack", "--hostname", HOSTNAME, "--port", String(port)];
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
    },
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});