import { normalizeTheme, themeToCssVars, type ThemeDefinition } from "../../shared/theme";

export function applyTheme(theme: ThemeDefinition) {
  const normalized = normalizeTheme(theme);
  const root = document.documentElement;

  for (const [name, value] of Object.entries(themeToCssVars(normalized))) {
    root.style.setProperty(name, value);
  }

  root.dataset.windowStyle = normalized.windowStyle;
}
