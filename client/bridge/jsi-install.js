const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SCRIPT_NAME = "ranked.jsi.js";
const PLUGIN_ID = "ranked-cs2";
const BUNDLED_REL = path.join("..", "cs2", SCRIPT_NAME);

const PLUGIN_META = {
  id: PLUGIN_ID,
  file: SCRIPT_NAME,
  name: "Ranked CS2",
  description: "Reports Competitive and Premier matches to ranked.sushii.dev",
  version: "1.0.0",
  author: "sushii.dev",
};

/** Relative paths under CS2 install dir where JSI may load scripts. */
const CS2_JSI_PATHS = [
  path.join("game", "jsi", "scripts"),
  path.join("game", "jsi"),
  path.join("game", "csgo", "jsi"),
];

function getBundledScriptPath() {
  return path.join(__dirname, BUNDLED_REL);
}

function readBundledScript() {
  const bundled = getBundledScriptPath();
  if (!fs.existsSync(bundled)) {
    throw new Error(`Bundled JSI script not found at ${bundled}`);
  }
  return fs.readFileSync(bundled, "utf8");
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function scriptFileRef(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  return entry.file ?? entry.id ?? null;
}

function isRankedCatalogEntry(entry) {
  if (!entry) return false;
  if (typeof entry === "string") return entry === SCRIPT_NAME || entry === PLUGIN_ID;
  return (
    entry.id === PLUGIN_ID ||
    entry.file === SCRIPT_NAME ||
    entry.name === PLUGIN_META.name
  );
}

function isRankedInstalledEntry(entry) {
  if (!entry) return false;
  if (typeof entry === "string") {
    return entry === PLUGIN_ID || entry === SCRIPT_NAME;
  }
  return (
    entry.id === PLUGIN_ID ||
    entry.file === SCRIPT_NAME ||
    (entry.enabled !== false &&
      (entry.id === PLUGIN_ID || entry.file === SCRIPT_NAME))
  );
}

function isRankedManifestEntry(entry) {
  const file = scriptFileRef(entry);
  return file === SCRIPT_NAME;
}

function getWindowsSteamPath() {
  if (process.platform !== "win32") return null;
  try {
    const out = execSync(
      'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath',
      { encoding: "utf8", windowsHide: true }
    );
    const match = out.match(/SteamPath\s+REG_SZ\s+(.+)/i);
    if (!match) return null;
    return match[1].trim().replace(/\\$/, "").replace(/\\/g, path.sep);
  } catch {
    return null;
  }
}

function getDefaultSteamPaths() {
  const paths = [];
  const reg = getWindowsSteamPath();
  if (reg) paths.push(reg);

  if (process.platform === "win32") {
    paths.push("C:\\Program Files (x86)\\Steam");
    paths.push("C:\\Program Files\\Steam");
  } else if (process.platform === "darwin") {
    paths.push(
      path.join(process.env.HOME || "", "Library/Application Support/Steam")
    );
  } else {
    paths.push(path.join(process.env.HOME || "", ".steam", "steam"));
    paths.push(path.join(process.env.HOME || "", ".local/share/Steam"));
  }

  return [...new Set(paths.filter((p) => p && fs.existsSync(p)))];
}

function parseLibraryFolders(steamPath) {
  const vdfPath = path.join(steamPath, "steamapps", "libraryfolders.vdf");
  if (!fs.existsSync(vdfPath)) return [steamPath];

  const content = fs.readFileSync(vdfPath, "utf8");
  const libraries = [steamPath];
  for (const match of content.matchAll(/"path"\s+"([^"]+)"/g)) {
    const lib = match[1].replace(/\\\\/g, "\\");
    if (fs.existsSync(lib)) libraries.push(lib);
  }
  return [...new Set(libraries)];
}

function findCs2FromLibrary(libraryRoot) {
  const manifest = path.join(libraryRoot, "steamapps", "appmanifest_730.acf");
  if (!fs.existsSync(manifest)) return null;

  const content = fs.readFileSync(manifest, "utf8");
  const dirMatch = content.match(/"installdir"\s+"([^"]+)"/);
  if (!dirMatch) return null;

  const gamePath = path.join(
    libraryRoot,
    "steamapps",
    "common",
    dirMatch[1]
  );
  return fs.existsSync(gamePath) ? gamePath : null;
}

function discoverCs2InstallDirs() {
  const found = [];
  for (const steam of getDefaultSteamPaths()) {
    for (const lib of parseLibraryFolders(steam)) {
      const cs2 = findCs2FromLibrary(lib);
      if (cs2 && !found.includes(cs2)) found.push(cs2);
    }
  }
  return found;
}

function jsiRootsFromCs2(cs2Root) {
  const roots = new Set();
  for (const rel of CS2_JSI_PATHS) {
    const dir = path.join(cs2Root, rel);
    if (rel.endsWith("scripts")) {
      roots.add(path.dirname(dir));
    } else {
      roots.add(dir);
    }
  }
  return [...roots];
}

function collectJsiRoots(config = {}) {
  const roots = new Set();
  const appDataRoot =
    process.env.APPDATA ||
    path.join(require("os").homedir(), ".ranked-cs2");
  roots.add(path.join(appDataRoot, "ranked-cs2", "jsi"));

  for (const cs2Root of discoverCs2InstallDirs()) {
    for (const r of jsiRootsFromCs2(cs2Root)) roots.add(r);
  }

  for (const customPath of config.jsiPaths || []) {
    if (!customPath || !fs.existsSync(customPath)) continue;
    if (customPath.replace(/\\/g, "/").endsWith("/scripts")) {
      roots.add(path.dirname(customPath));
    } else {
      roots.add(customPath);
    }
  }

  return [...roots];
}

function inspectJsiRoot(jsiRoot) {
  const scriptsDir = path.join(jsiRoot, "scripts");
  const scriptPath = path.join(scriptsDir, SCRIPT_NAME);
  const scriptInRoot = path.join(jsiRoot, SCRIPT_NAME);
  const hasScript =
    fs.existsSync(scriptPath) || fs.existsSync(scriptInRoot);

  const catalogPath = path.join(jsiRoot, "catalog.json");
  const installedPath = path.join(jsiRoot, "installed.json");
  const manifestPath = path.join(scriptsDir, "manifest.json");

  const catalog = readJsonFile(catalogPath);
  const installed = readJsonFile(installedPath);
  const manifest = readJsonFile(manifestPath);

  let inCatalog = false;
  let inInstalled = false;
  let inManifest = false;

  if (catalog) {
    const items = catalog.plugins ?? catalog.catalog ?? catalog.scripts ?? [];
    if (Array.isArray(items)) {
      inCatalog = items.some(isRankedCatalogEntry);
    }
  }

  if (installed) {
    const items = installed.plugins ?? installed.installed ?? [];
    if (Array.isArray(items)) {
      inInstalled = items.some(isRankedInstalledEntry);
    }
  }

  if (manifest) {
    if (Array.isArray(manifest.catalog)) {
      inCatalog = inCatalog || manifest.catalog.some(isRankedCatalogEntry);
    }
    if (Array.isArray(manifest.installed)) {
      inInstalled =
        inInstalled || manifest.installed.some(isRankedInstalledEntry);
    }
    if (Array.isArray(manifest.scripts)) {
      const entry = manifest.scripts.find(isRankedManifestEntry);
      if (entry) {
        inManifest = true;
        inCatalog = inCatalog || true;
        const enabled =
          typeof entry === "object" ? entry.enabled !== false : true;
        inInstalled = inInstalled || enabled;
      }
    }
  }

  return {
    root: jsiRoot,
    scriptPath: fs.existsSync(scriptPath)
      ? scriptPath
      : fs.existsSync(scriptInRoot)
        ? scriptInRoot
        : null,
    hasScript,
    inCatalog,
    inInstalled,
    inManifest,
    ready: hasScript && inCatalog && inInstalled,
  };
}

function updateCatalog(catalogPath) {
  let catalog = readJsonFile(catalogPath) ?? { version: 1, plugins: [] };
  if (!Array.isArray(catalog.plugins)) {
    catalog.plugins = Array.isArray(catalog.catalog) ? catalog.catalog : [];
  }

  const idx = catalog.plugins.findIndex(isRankedCatalogEntry);
  const entry = { ...PLUGIN_META };
  if (idx >= 0) {
    catalog.plugins[idx] =
      typeof catalog.plugins[idx] === "string"
        ? entry
        : { ...catalog.plugins[idx], ...entry };
  } else {
    catalog.plugins.push(entry);
  }

  writeJsonFile(catalogPath, catalog);
  return catalogPath;
}

function updateInstalled(installedPath) {
  let installed = readJsonFile(installedPath) ?? {
    version: 1,
    plugins: [],
  };
  if (!Array.isArray(installed.plugins)) {
    installed.plugins = Array.isArray(installed.installed)
      ? installed.installed
      : [];
  }

  const entry = {
    id: PLUGIN_ID,
    file: SCRIPT_NAME,
    name: PLUGIN_META.name,
    enabled: true,
    installedAt: new Date().toISOString(),
  };

  const idx = installed.plugins.findIndex(
    (p) =>
      (typeof p === "string" && (p === PLUGIN_ID || p === SCRIPT_NAME)) ||
      (typeof p === "object" && (p.id === PLUGIN_ID || p.file === SCRIPT_NAME))
  );

  if (idx >= 0) {
    installed.plugins[idx] =
      typeof installed.plugins[idx] === "string"
        ? entry
        : { ...installed.plugins[idx], ...entry };
  } else {
    installed.plugins.push(entry);
  }

  writeJsonFile(installedPath, installed);
  return installedPath;
}

function updateManifest(scriptsDir) {
  const manifestPath = path.join(scriptsDir, "manifest.json");
  let manifest = readJsonFile(manifestPath) ?? { version: 1, scripts: [] };

  if (!Array.isArray(manifest.scripts)) manifest.scripts = [];

  const entry = {
    id: PLUGIN_ID,
    file: SCRIPT_NAME,
    enabled: true,
    name: PLUGIN_META.name,
  };
  const idx = manifest.scripts.findIndex(isRankedManifestEntry);
  if (idx >= 0) {
    manifest.scripts[idx] =
      typeof manifest.scripts[idx] === "string"
        ? entry
        : { ...manifest.scripts[idx], ...entry };
  } else {
    manifest.scripts.push(entry);
  }

  if (!Array.isArray(manifest.catalog)) manifest.catalog = [];
  const catIdx = manifest.catalog.findIndex(isRankedCatalogEntry);
  if (catIdx >= 0) {
    manifest.catalog[catIdx] = { ...PLUGIN_META, ...manifest.catalog[catIdx] };
  } else {
    manifest.catalog.push({ ...PLUGIN_META });
  }

  if (!Array.isArray(manifest.installed)) manifest.installed = [];
  if (!manifest.installed.some(isRankedInstalledEntry)) {
    manifest.installed.push(PLUGIN_ID);
  }

  writeJsonFile(manifestPath, manifest);
  return manifestPath;
}

function writeScript(targetDir, contents) {
  fs.mkdirSync(targetDir, { recursive: true });
  const target = path.join(targetDir, SCRIPT_NAME);
  fs.writeFileSync(target, contents, "utf8");
  return target;
}

function installAtRoot(jsiRoot, contents, installedTo, errors) {
  const scriptsDir = path.join(jsiRoot, "scripts");
  try {
    const p = writeScript(scriptsDir, contents);
    installedTo.push(p);
  } catch (e) {
    try {
      const p = writeScript(jsiRoot, contents);
      installedTo.push(p);
    } catch (e2) {
      errors.push(`${jsiRoot}: ${e2.message}`);
      return;
    }
  }

  try {
    updateCatalog(path.join(jsiRoot, "catalog.json"));
  } catch (e) {
    errors.push(`catalog (${jsiRoot}): ${e.message}`);
  }

  try {
    updateInstalled(path.join(jsiRoot, "installed.json"));
  } catch (e) {
    errors.push(`installed (${jsiRoot}): ${e.message}`);
  }

  if (fs.existsSync(scriptsDir)) {
    try {
      updateManifest(scriptsDir);
    } catch (e) {
      errors.push(`manifest (${scriptsDir}): ${e.message}`);
    }
  }
}

/**
 * Read-only scan of catalog / installed registration (no file writes).
 */
function inspectJsiScripts(config = {}) {
  const locations = collectJsiRoots(config).map(inspectJsiRoot);
  const readyLocations = locations.filter((l) => l.ready);
  return {
    ok: readyLocations.length > 0,
    locations,
    inCatalog: locations.some((l) => l.inCatalog),
    inInstalled: locations.some((l) => l.inInstalled),
    ready: readyLocations.length > 0,
    cs2Found: discoverCs2InstallDirs(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * @param {{ jsiPaths?: string[] }} config
 */
function installJsiScripts(config = {}) {
  const contents = readBundledScript();
  const installedTo = [];
  const errors = [];

  for (const jsiRoot of collectJsiRoots(config)) {
    installAtRoot(jsiRoot, contents, installedTo, errors);
  }

  const inspection = inspectJsiScripts(config);

  return {
    ok: inspection.ready || installedTo.length > 0,
    installedTo: [...new Set(installedTo)],
    locations: inspection.locations,
    inCatalog: inspection.inCatalog,
    inInstalled: inspection.inInstalled,
    ready: inspection.ready,
    errors,
    cs2Found: inspection.cs2Found,
    updatedAt: inspection.updatedAt,
  };
}

module.exports = {
  SCRIPT_NAME,
  PLUGIN_ID,
  getBundledScriptPath,
  installJsiScripts,
  inspectJsiScripts,
  discoverCs2InstallDirs,
};
