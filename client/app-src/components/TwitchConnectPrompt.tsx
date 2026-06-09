import { useState } from "react";

interface TwitchConnectPromptProps {
  configured: boolean;
  error: string | null;
  onSignIn: () => Promise<void>;
}

export function TwitchConnectPrompt({ configured, error, onSignIn }: TwitchConnectPromptProps) {
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await onSignIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="twitch-connect-prompt overlay-card">
      <div>
        <p className="eyebrow">Twitch polls</p>
        <h3>Sign in to enable match-win polls</h3>
        <p className="subtle">
          Stats overlays and CS2 integration work without Twitch. Sign in when you want
          automatic match-win polls and the poll overlay.
        </p>
      </div>

      <button
        className="twitch-sign-in-button"
        disabled={busy || !configured}
        onClick={handleSignIn}
      >
        <TwitchGlyph />
        {busy ? "Opening Twitch..." : "Sign in with Twitch"}
      </button>

      {!configured && (
        <p className="sign-in-note sign-in-note-error">
          This build is missing Twitch credentials. Download a build from the official site.
        </p>
      )}

      {error && <p className="sign-in-note sign-in-note-error">{error}</p>}
    </section>
  );
}

function TwitchGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.64 5.93 9.43 2H2v16.57h5.14V11.8l2.21 2.21 1.14-.03 3.93-3.92V5.93h-2.78ZM18.86 2H15v3.93l2.21 2.21V7.14h1.64v8.43H15v2.14h5.14V2h-1.28Z"
      />
    </svg>
  );
}
