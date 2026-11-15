export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const dns = await import("node:dns");
      dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    } catch (err) {
      console.warn("[Backend Instrumentation] Failed to configure DNS servers:", err);
    }
  }
}

