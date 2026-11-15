import dns from "node:dns";

export function register() {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  } catch (err) {
    console.warn("[Backend Instrumentation] Failed to configure DNS servers:", err);
  }
}

