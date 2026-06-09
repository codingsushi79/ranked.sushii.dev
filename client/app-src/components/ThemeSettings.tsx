import { useEffect, useMemo, useState } from "react";
import type { ThemeDefinition } from "../types";
import {
  BUILTIN_THEMES,
  decodeThemeCode,
  encodeThemeCode,
  normalizeTheme,
} from "../types";

interface ThemeSettingsProps {
  theme: ThemeDefinition;
  onChange: (theme: ThemeDefinition) => void;
}

export function ThemeSettings({ theme, onChange }: ThemeSettingsProps) {
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const exportCode = useMemo(() => encodeThemeCode(theme), [theme]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const applyPreset = (preset: ThemeDefinition) => {
    onChange(normalizeTheme(preset));
    setImportError(null);
  };

  const handleImport = () => {
    try {
      onChange(decodeThemeCode(importCode));
      setImportError(null);
      setImportCode("");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not import theme code.");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportCode);
    setCopied(true);
  };

  const updateColor = (key: keyof ThemeDefinition["colors"], value: string) => {
    onChange(
      normalizeTheme({
        ...theme,
        name: `${theme.name} Custom`,
        colors: { ...theme.colors, [key]: value },
      })
    );
  };

  return (
    <section className="settings-section">
      <h3>Appearance</h3>
      <p className="subtle">
        Pick a preset, switch between rounded and square overlays, or paste a theme code from
        the website editor.
      </p>

      <div className="theme-preset-grid">
        {BUILTIN_THEMES.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={`theme-preset-card ${theme.name === preset.name ? "theme-preset-card-active" : ""}`}
            onClick={() => applyPreset(preset)}
          >
            <span
              className="theme-preset-swatch"
              style={{
                background: `linear-gradient(135deg, ${preset.colors.accent}, ${preset.colors.accentSecondary})`,
                borderRadius: preset.windowStyle === "square" ? "4px" : "999px",
              }}
            />
            <span className="theme-preset-copy">
              <strong>{preset.name}</strong>
              <small>{preset.windowStyle === "square" ? "Square windows" : "Rounded windows"}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="theme-style-toggle">
        <label className="launcher-option">
          <input
            type="radio"
            name="windowStyle"
            checked={theme.windowStyle === "rounded"}
            onChange={() => onChange(normalizeTheme({ ...theme, windowStyle: "rounded" }))}
          />
          <span>
            <strong>Rounded overlays</strong>
            <small>Soft corners on panels and controls</small>
          </span>
        </label>
        <label className="launcher-option">
          <input
            type="radio"
            name="windowStyle"
            checked={theme.windowStyle === "square"}
            onChange={() => onChange(normalizeTheme({ ...theme, windowStyle: "square" }))}
          />
          <span>
            <strong>Square overlays</strong>
            <small>Sharp corners for a cleaner broadcast look</small>
          </span>
        </label>
      </div>

      <label>
        Overlay opacity
        <input
          type="range"
          min={0.5}
          max={1}
          step={0.01}
          value={theme.overlayOpacity}
          onChange={(event) =>
            onChange(
              normalizeTheme({ ...theme, overlayOpacity: Number(event.target.value) })
            )
          }
        />
      </label>

      <div className="theme-color-grid">
        {(
          [
            ["accent", "Accent"],
            ["accentSecondary", "Accent 2"],
            ["background", "Background"],
            ["panel", "Panel"],
            ["text", "Text"],
            ["muted", "Muted"],
            ["ct", "CT"],
            ["t", "T"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="theme-color-field">
            {label}
            <input
              type="color"
              value={toColorInput(theme.colors[key])}
              onChange={(event) => updateColor(key, event.target.value)}
            />
          </label>
        ))}
      </div>

      <label>
        Export theme code
        <textarea className="theme-code-field" readOnly rows={3} value={exportCode} />
      </label>
      <div className="settings-actions">
        <button type="button" className="ghost-button" onClick={handleCopy}>
          {copied ? "Copied" : "Copy theme code"}
        </button>
      </div>

      <label>
        Import theme code
        <textarea
          className="theme-code-field"
          rows={3}
          placeholder="Paste CS2SYNC::THEME::..."
          value={importCode}
          onChange={(event) => setImportCode(event.target.value)}
        />
      </label>
      {importError && <p className="sign-in-note sign-in-note-error">{importError}</p>}
      <div className="settings-actions">
        <button type="button" className="primary-button" onClick={handleImport}>
          Apply imported theme
        </button>
      </div>
    </section>
  );
}

function toColorInput(value: string) {
  if (value.startsWith("#") && (value.length === 7 || value.length === 4)) {
    return value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value;
  }
  return "#7c5cff";
}
