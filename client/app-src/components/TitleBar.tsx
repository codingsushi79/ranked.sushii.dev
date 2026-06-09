interface TitleBarProps {
  onOpenSettings?: () => void;
  settingsOpen?: boolean;
}

export function TitleBar({ onOpenSettings, settingsOpen }: TitleBarProps) {
  return (
    <header className="title-bar" data-tauri-drag-region>
      <div className="title-brand">
        <span className="brand-dot" />
        <span>Ranked CS2</span>
      </div>
      <div className="title-actions">
        {onOpenSettings && !settingsOpen && (
          <button className="icon-button" onClick={onOpenSettings} title="Settings">
            ⚙
          </button>
        )}
        <button
          className="icon-button"
          onClick={() => window.ranked.minimize()}
          title="Minimize"
        >
          ─
        </button>
        <button
          className="icon-button icon-button-danger"
          onClick={() => window.ranked.close()}
          title="Close"
        >
          ×
        </button>
      </div>
    </header>
  );
}
