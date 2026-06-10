import type { AppState, OverlayStatus, UpdateStatusPayload } from "../types";
import { ConnectionStatus } from "./ConnectionStatus";
import { OverlayLauncher } from "./OverlayLauncher";

interface MainDashboardProps {
  state: AppState;
  overlayStatus: OverlayStatus;
  updateStatus: UpdateStatusPayload;
  twitchConnected: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  onApplyOverlays: (options: { stats: boolean; poll: boolean }) => Promise<void>;
  onCloseAllOverlays: () => Promise<void>;
  onInstallGsi: () => Promise<void>;
}

export function MainDashboard({
  state,
  overlayStatus,
  updateStatus,
  twitchConnected,
  statusMessage,
  errorMessage,
  onApplyOverlays,
  onCloseAllOverlays,
  onInstallGsi,
}: MainDashboardProps) {
  return (
    <div className="main-panel">
      <ConnectionStatus
        compact
        cs2Connected={state.cs2.connected}
        twitchConnected={state.twitchConnected}
        gsiInstalled={state.gsiInstalled}
        mapName={state.cs2.map?.name}
        round={state.cs2.map?.round}
        scoreCT={state.cs2.map?.teamCT.score}
        scoreT={state.cs2.map?.teamT.score}
        playerName={state.cs2.playerName}
        team={state.cs2.team}
      />

      <OverlayLauncher
        overlayStatus={overlayStatus}
        twitchConnected={twitchConnected}
        onApply={onApplyOverlays}
        onCloseAll={onCloseAllOverlays}
      />

      {updateStatus.status === "available" && (
        <div className="toast toast-info">
          Update v{updateStatus.version} available — match recording paused until you update.
        </div>
      )}

      {updateStatus.status === "downloading" && (
        <div className="toast toast-info">
          Downloading update v{updateStatus.version}… {updateStatus.progress ?? 0}%
        </div>
      )}

      {updateStatus.status === "ready" && (
        <div className="toast toast-info">
          Update v{updateStatus.version} ready — restarting automatically…
        </div>
      )}

      {(statusMessage || errorMessage) && (
        <div className={`toast ${errorMessage ? "toast-error" : "toast-info"}`}>
          {errorMessage ?? statusMessage}
        </div>
      )}

      {!state.gsiInstalled && (
        <button className="ghost-button full-width" onClick={onInstallGsi}>
          Install CS2 GSI Config
        </button>
      )}
    </div>
  );
}
