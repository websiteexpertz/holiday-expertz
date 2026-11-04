import { spawn } from "node:child_process";

console.log("\n🏨 \x1b[36mHolidayExpertz Full Stack Development\x1b[0m");
console.log("  🌐 Frontend: \x1b[32mhttp://localhost:3000\x1b[0m");
console.log("  ⚙️  Backend:  \x1b[32mhttp://localhost:3001\x1b[0m\n");

const frontend = spawn("npm", ["run", "dev", "--prefix", "frontend"], {
  stdio: "inherit",
  shell: true,
});

const backend = spawn("npm", ["run", "dev", "--prefix", "backend"], {
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  try {
    frontend.kill("SIGTERM");
    backend.kill("SIGTERM");
  } catch {
    // Ignore error on kill
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

