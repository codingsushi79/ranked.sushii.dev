import type { UpdateStatusPayload } from "../types";

export function UpdateBanner({
  appVersion,
  update,
}: {
  appVersion: string;
  update: UpdateStatusPayload;
}) {
  if (
    update.status !== "available" &&
    update.status !== "downloading" &&
    update.status !== "ready"
  ) {
    return null;
  }

  const busy = update.status === "downloading";
  const ready = update.status === "ready";

  return (
    <div className="update-banner" role="status">
      <div className="update-banner-copy">
        <p className="update-banner-title">
          {ready
            ? `Update v${update.version} ready`
            : busy
              ? `Downloading update v${update.version}…`
              : `Update v${update.version} available`}
        </p>
        <p className="update-banner-meta">
          {ready
            ? "Restarting automatically in a few seconds. Match recording stays paused until then."
            : busy
              ? `${update.progress ?? 0}% complete · Match recording is paused until the update finishes.`
              : `You're on v${appVersion}. Download starting automatically…`}
        </p>
        {busy && (
          <div className="update-progress" aria-hidden>
            <div
              className="update-progress-bar"
              style={{ width: `${update.progress ?? 0}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
