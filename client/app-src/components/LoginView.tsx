import { useState } from "react";

export function LoginView({
  loading,
  error,
  onLogin,
}: {
  loading: boolean;
  error: string | null;
  onLogin: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setBusy(true);
    try {
      await onLogin();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-view">
      <div className="login-card card-surface">
        <p className="login-kicker">Ranked CS2</p>
        <h1 className="login-title">Sign in with Steam</h1>
        <p className="login-copy">
          Your browser opens for Steam sign-in. After you authenticate, you return
          here with match tracking, profile, and leaderboard.
        </p>
        <button
          type="button"
          className="btn btn-primary login-btn"
          disabled={loading || busy}
          onClick={() => void handleLogin()}
        >
          {busy ? "Waiting for browser…" : "Sign in with Steam"}
        </button>
        {error && <p className="ranked-msg-err">{error}</p>}
        <p className="login-footnote">
          New accounts are created through Steam. Your Steam ID cannot be changed later.
        </p>
      </div>
    </div>
  );
}
