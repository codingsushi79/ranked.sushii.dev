import fs from "fs";
import path from "path";

const SHARE_CODE_RE = /CSGO-[A-Za-z0-9-]{26,34}/g;

function readTail(filePath: string, maxBytes = 64_000): string | null {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const size = stat.size;
    const start = Math.max(0, size - maxBytes);
    const fd = fs.openSync(filePath, "r");
    try {
      const buffer = Buffer.alloc(Math.min(maxBytes, size));
      fs.readSync(fd, buffer, 0, buffer.length, start);
      return buffer.toString("utf8");
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return null;
  }
}

function scanFileForShareCode(filePath: string): string | null {
  const text = readTail(filePath);
  if (!text) return null;
  const match = text.match(SHARE_CODE_RE);
  return match?.[0] ?? null;
}

/** Scan recent CS2 files for a Valve match share code (best-effort). */
export function findRecentShareCode(cfgDir: string, maxAgeMs = 2 * 60 * 60 * 1000): string | null {
  const gameDir = path.dirname(cfgDir);
  const roots = [
    path.join(gameDir, "replays"),
    path.join(gameDir, "Replays"),
    path.join(gameDir, "backup_round00"),
    gameDir,
    cfgDir,
  ];

  const cutoff = Date.now() - maxAgeMs;
  const files: { path: string; mtime: number }[] = [];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (![".info", ".txt", ".dem", ".json"].includes(ext)) continue;
      const filePath = path.join(root, entry.name);
      try {
        const mtime = fs.statSync(filePath).mtimeMs;
        if (mtime >= cutoff) {
          files.push({ path: filePath, mtime });
        }
      } catch {
        // skip unreadable files
      }
    }
  }

  files.sort((a, b) => b.mtime - a.mtime);

  for (const file of files.slice(0, 12)) {
    const code = scanFileForShareCode(file.path);
    if (code) return code;
  }

  return null;
}
