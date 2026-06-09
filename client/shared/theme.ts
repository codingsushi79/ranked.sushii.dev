export type WindowStyle = "rounded" | "square";

export interface ThemeColors {
  background: string;
  panel: string;
  panelBorder: string;
  text: string;
  muted: string;
  accent: string;
  accentSecondary: string;
  success: string;
  danger: string;
  ct: string;
  t: string;
}

export interface ThemeDefinition {
  name: string;
  windowStyle: WindowStyle;
  colors: ThemeColors;
  overlayOpacity: number;
}

export const THEME_CODE_PREFIX = "CS2SYNC::THEME::";
export const THEME_CODE_VERSION = 1;

export const DEFAULT_THEME: ThemeDefinition = {
  name: "Sync Purple",
  windowStyle: "rounded",
  overlayOpacity: 0.92,
  colors: {
    background: "#0a0c12",
    panel: "rgba(18, 22, 32, 0.92)",
    panelBorder: "rgba(255, 255, 255, 0.08)",
    text: "#f4f7ff",
    muted: "#9aa6bf",
    accent: "#7c5cff",
    accentSecondary: "#35d0ff",
    success: "#3dd68c",
    danger: "#ff6b81",
    ct: "#5b9dff",
    t: "#ffb347",
  },
};

export const BUILTIN_THEMES: ThemeDefinition[] = [
  DEFAULT_THEME,
  {
    name: "Neon Pulse",
    windowStyle: "rounded",
    overlayOpacity: 0.9,
    colors: {
      background: "#040810",
      panel: "rgba(8, 18, 32, 0.92)",
      panelBorder: "rgba(53, 208, 255, 0.18)",
      text: "#ecfbff",
      muted: "#7da8b8",
      accent: "#00d4ff",
      accentSecondary: "#7c5cff",
      success: "#3dd68c",
      danger: "#ff6b81",
      ct: "#5b9dff",
      t: "#ffb347",
    },
  },
  {
    name: "Ember Stream",
    windowStyle: "rounded",
    overlayOpacity: 0.93,
    colors: {
      background: "#120908",
      panel: "rgba(32, 16, 14, 0.92)",
      panelBorder: "rgba(255, 120, 80, 0.14)",
      text: "#fff4ef",
      muted: "#b89a90",
      accent: "#ff6b3d",
      accentSecondary: "#ffb347",
      success: "#3dd68c",
      danger: "#ff4d6d",
      ct: "#5b9dff",
      t: "#ffb347",
    },
  },
  {
    name: "Forest Ops",
    windowStyle: "rounded",
    overlayOpacity: 0.91,
    colors: {
      background: "#07110c",
      panel: "rgba(12, 24, 18, 0.92)",
      panelBorder: "rgba(61, 214, 140, 0.14)",
      text: "#eefbf3",
      muted: "#8eb09a",
      accent: "#3dd68c",
      accentSecondary: "#7c5cff",
      success: "#3dd68c",
      danger: "#ff6b81",
      ct: "#5b9dff",
      t: "#ffb347",
    },
  },
  {
    name: "Square Mono",
    windowStyle: "square",
    overlayOpacity: 0.95,
    colors: {
      background: "#111318",
      panel: "rgba(22, 24, 30, 0.96)",
      panelBorder: "rgba(255, 255, 255, 0.1)",
      text: "#f5f7fb",
      muted: "#9aa3b2",
      accent: "#d0d4dc",
      accentSecondary: "#8b93a1",
      success: "#7ddea8",
      danger: "#ff6b81",
      ct: "#8eb8ff",
      t: "#ffc978",
    },
  },
];

const RADIUS_BY_STYLE: Record<WindowStyle, { window: string; control: string; title: string }> = {
  rounded: { window: "22px", control: "16px", title: "14px" },
  square: { window: "6px", control: "4px", title: "4px" },
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function accentSoft(accent: string) {
  if (accent.startsWith("#")) {
    const { r, g, b } = hexToRgb(accent);
    return `rgba(${r}, ${g}, ${b}, 0.18)`;
  }
  return "rgba(124, 92, 255, 0.18)";
}

export function normalizeTheme(theme: Partial<ThemeDefinition> | null | undefined): ThemeDefinition {
  if (!theme?.colors) {
    return { ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors } };
  }

  return {
    name: theme.name?.trim() || DEFAULT_THEME.name,
    windowStyle: theme.windowStyle === "square" ? "square" : "rounded",
    overlayOpacity:
      typeof theme.overlayOpacity === "number"
        ? Math.min(1, Math.max(0.5, theme.overlayOpacity))
        : DEFAULT_THEME.overlayOpacity,
    colors: {
      ...DEFAULT_THEME.colors,
      ...theme.colors,
    },
  };
}

export function resolveTheme(settings: { theme?: Partial<ThemeDefinition> | null }): ThemeDefinition {
  return normalizeTheme(settings.theme);
}

export function themeToCssVars(theme: ThemeDefinition): Record<string, string> {
  const radii = RADIUS_BY_STYLE[theme.windowStyle];
  const { colors } = theme;

  return {
    "--shell-bg": colors.background,
    "--panel": colors.panel,
    "--panel-border": colors.panelBorder,
    "--text": colors.text,
    "--muted": colors.muted,
    "--accent": colors.accent,
    "--accent-secondary": colors.accentSecondary,
    "--accent-soft": accentSoft(colors.accent),
    "--success": colors.success,
    "--danger": colors.danger,
    "--ct": colors.ct,
    "--t": colors.t,
    "--overlay-opacity": String(theme.overlayOpacity),
    "--radius-window": radii.window,
    "--radius-control": radii.control,
    "--radius-title": radii.title,
  };
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeThemeCode(theme: ThemeDefinition) {
  const payload = JSON.stringify(normalizeTheme(theme));
  return `${THEME_CODE_PREFIX}${THEME_CODE_VERSION}::${toBase64Url(payload)}`;
}

export function decodeThemeCode(code: string): ThemeDefinition {
  const trimmed = code.trim();
  if (!trimmed.startsWith(THEME_CODE_PREFIX)) {
    throw new Error("Theme code must start with CS2SYNC::THEME::");
  }

  const body = trimmed.slice(THEME_CODE_PREFIX.length);
  const separator = body.indexOf("::");
  if (separator === -1) {
    throw new Error("Theme code is missing its version separator.");
  }

  const version = Number.parseInt(body.slice(0, separator), 10);
  if (version !== THEME_CODE_VERSION) {
    throw new Error(`Unsupported theme code version (${version}).`);
  }

  const encoded = body.slice(separator + 2);
  const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<ThemeDefinition>;
  return normalizeTheme(parsed);
}

export function findBuiltinTheme(name: string) {
  return BUILTIN_THEMES.find((theme) => theme.name === name) ?? null;
}
