import * as http from "http";
import { ElliotConfig } from "./config";

export function startCallbackServer(): Promise<ElliotConfig> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method === "POST" && req.url === "/callback") {
        let body = "";

        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const config = JSON.parse(body) as ElliotConfig;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
            server.close();
            resolve(config);
          } catch (error) {
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
      reject(
        new Error(
          "Setup timeout: No response from browser after 5 minutes. Please try again."
        )
      );
    }, 5 * 60 * 1000);

    server.listen(3333, () => {
      clearTimeout(timeout);
    });

    server.on("error", (error) => {
      reject(error);
    });
  });
}
