import crypto from "crypto";
import http from "http";
import { shell } from "electron";

export const DESKTOP_AUTH_PORT = 27501;

export function startDesktopLogin(apiUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const state = crypto.randomBytes(16).toString("hex");
    let settled = false;
    let timeout: NodeJS.Timeout | undefined;
    let server: http.Server | undefined;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      server?.close();
      fn();
    };

    server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url ?? "/", `http://127.0.0.1:${DESKTOP_AUTH_PORT}`);
        if (url.pathname !== "/callback") {
          res.writeHead(404);
          res.end();
          return;
        }

        const gotState = url.searchParams.get("state");
        const clientId = url.searchParams.get("clientId")?.trim();
        if (gotState !== state || !clientId) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(
            "<h1>Sign-in failed</h1><p>Return to Ranked CS2 and try again.</p>"
          );
          finish(() => reject(new Error("Sign-in failed — try again")));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<h1>Signed in!</h1><p>You can close this tab and return to Ranked CS2.</p>"
        );
        finish(() => resolve(clientId));
      } catch (err) {
        res.writeHead(500);
        res.end();
        finish(() =>
          reject(err instanceof Error ? err : new Error("Sign-in failed"))
        );
      }
    });

    server.on("error", (err) => {
      finish(() => reject(err));
    });

    server.listen(DESKTOP_AUTH_PORT, "127.0.0.1", () => {
      const base = apiUrl.replace(/\/$/, "");
      const connectUrl = `${base}/client/connect?state=${encodeURIComponent(state)}&port=${DESKTOP_AUTH_PORT}`;
      void shell.openExternal(connectUrl);
    });

    timeout = setTimeout(() => {
      finish(() => reject(new Error("Sign-in timed out — try again")));
    }, 5 * 60 * 1000);
  });
}
