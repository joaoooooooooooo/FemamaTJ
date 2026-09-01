import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectDirectory = fileURLToPath(new URL("..", import.meta.url));
const workerDirectory = fileURLToPath(new URL("../worker", import.meta.url));
const viteEntry = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const wranglerEntry = fileURLToPath(
  new URL("../worker/node_modules/wrangler/bin/wrangler.js", import.meta.url),
);
const children = [
  spawn(process.execPath, [viteEntry], {
    cwd: projectDirectory,
    stdio: "inherit",
  }),
  spawn(process.execPath, [wranglerEntry, "dev", "--port", "8791"], {
    cwd: workerDirectory,
    stdio: "inherit",
  }),
];

let isStopping = false;

function stopChildren(signal = "SIGTERM") {
  if (isStopping) {
    return;
  }

  isStopping = true;
  children.forEach((child) => {
    if (child.killed || !child.pid) {
      return;
    }

    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      child.kill(signal);
    }
  });
}

children.forEach((child) => {
  child.on("error", (error) => {
    console.error(error.message);
    stopChildren();
    process.exitCode = 1;
  });

  child.on("exit", (code) => {
    if (!isStopping && code !== 0) {
      process.exitCode = code ?? 1;
      stopChildren();
    }
  });
});

process.on("SIGINT", () => stopChildren("SIGINT"));
process.on("SIGTERM", () => stopChildren("SIGTERM"));
