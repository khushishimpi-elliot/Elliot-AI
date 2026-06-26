import * as http from "http";
import * as net from "net";
import { ElliotConfig } from "./config.js";

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const addr = srv.address();
      srv.close(() => {
        if (addr && typeof addr === "object") resolve(addr.port);
        else reject(new Error("Could not get free port"));
      });
    });
  });
}

export async function startCallbackServer(): Promise<ElliotConfig> {
  const port = await getFreePort();

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method === "POST" && req.url === "/callback") {
        let body = "";
        req.on("data", (chunk) => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            const config = JSON.parse(body) as ElliotConfig;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
            server.close();
            resolve(config);
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Invalid JSON" }));
            reject(new Error("Failed to parse callback data"));
          }
        });
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Not found" }));
      }
    });

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Setup timeout: No response from browser after 5 minutes. Please try again."));
    }, 5 * 60 * 1000);

    server.listen(port, () => {
      clearTimeout(timeout);
      // Expose port so init.ts can build the callback URL after the server starts
      (server as any).__port = port;
    });

    server.on("error", reject);

    // Attach port to the promise so init.ts can read it
    (resolve as any).__port = port;
    (server as any).getPort = () => port;
  });
}

export async function getCallbackPort(): Promise<number> {
  return getFreePort();
}
