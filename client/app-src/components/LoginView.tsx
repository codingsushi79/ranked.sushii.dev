import { useState } from "react";

export function LoginView({
  loading,
  error,
  onLogin,
  onSignup,
}: {
  loading: boolean;
  error: string | null;
  onLogin: () => Promise<void>;
  onSignup: () => void;
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
        <h1 className="login-title">Sign in to your account</h1>
        <p className="login-copy">
          Your browser opens for secure sign-in. After you log in, you return here with
          match tracking, profile, and leaderboard.
        </p>
        <button
          type="button"
          className="btn btn-primary login-btn"
          disabled={loading || busy}
          onClick={() => void handleLogin()}
        >
          {busy ? "Waiting for browser…" : "Log in with browser"}
        </button>
        <button type="button" className="btn btn-secondary login-btn" onClick={onSignup}>
          Create account
        </button>
        {error && <p className="ranked-msg-err">{error}</p>}
        <p className="login-footnote">
          Link Steam and verify email on the website to report rated matches.
        </p>
      </div>
    </div>
  );
}
