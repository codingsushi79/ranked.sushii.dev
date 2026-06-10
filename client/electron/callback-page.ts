type CallbackPageOptions = {
  title: string;
  message: string;
  variant?: "success" | "error";
  autoCloseSeconds?: number;
};

export function renderCallbackPage({
  title,
  message,
  variant = "success",
  autoCloseSeconds,
}: CallbackPageOptions): string {
  const accent =
    variant === "error" ? "oklch(0.704 0.191 22.216)" : "oklch(0.922 0 0)";
  const icon =
    variant === "error"
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

  const countdown =
    autoCloseSeconds != null
      ? `<p class="countdown">Closing in <span id="countdown">${autoCloseSeconds}</span>s…</p>`
      : "";

  const autoCloseScript =
    autoCloseSeconds != null
      ? `<script>
  (function () {
    var seconds = ${autoCloseSeconds};
    var el = document.getElementById("countdown");
    var timer = setInterval(function () {
      seconds -= 1;
      if (el) el.textContent = String(Math.max(seconds, 0));
      if (seconds <= 0) {
        clearInterval(timer);
        window.close();
      }
    }, 1000);
  })();
</script>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(title)} · Ranked CS2</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html {
      color-scheme: dark;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: oklch(0.145 0 0);
      color: oklch(0.985 0 0);
    }
    .shell {
      width: min(100%, 28rem);
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: oklch(0.985 0 0);
    }
    .brand svg { flex-shrink: 0; }
    .card {
      border: 1px solid oklch(1 0 0 / 10%);
      border-radius: 0.625rem;
      background: oklch(0.205 0 0);
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 1px 2px oklch(0 0 0 / 20%);
    }
    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      border-radius: 9999px;
      background: oklch(0.269 0 0);
      border: 1px solid oklch(1 0 0 / 10%);
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: oklch(0.708 0 0);
    }
    .countdown {
      margin-top: 1rem;
      font-size: 0.8125rem;
      color: oklch(0.556 0 0);
    }
    #countdown { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="brand">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="22" x2="18" y1="12" y2="12"/>
        <line x1="6" x2="2" y1="12" y2="12"/>
        <line x1="12" x2="12" y1="6" y2="2"/>
        <line x1="12" x2="12" y1="22" y2="18"/>
      </svg>
      Ranked CS2
    </div>
    <div class="card">
      <div class="icon">${icon}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      ${countdown}
    </div>
  </div>
  ${autoCloseScript}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
