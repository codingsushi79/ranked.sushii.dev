import { useState } from "react";
import { AppNav } from "./components/AppNav";
import { HomeView } from "./components/HomeView";
import { LeaderboardView } from "./components/LeaderboardView";
import { LoginView } from "./components/LoginView";
import { MatchTrackingPanel } from "./components/MatchTrackingPanel";
import { MatchView } from "./components/MatchView";
import { PlayerSearch } from "./components/PlayerSearch";
import { PlayerView } from "./components/PlayerView";
import { ProfileView } from "./components/ProfileView";
import { SettingsView } from "./components/SettingsView";
import { TitleBar } from "./components/TitleBar";
import type { AppView } from "./lib/types";
import { useAuth } from "./lib/useAuth";
import { useBridgeStatus } from "./lib/useBridgeStatus";
import { useUpdateStatus } from "./lib/useUpdateStatus";
import { UpdateBanner } from "./components/UpdateBanner";

export default function App() {
  const auth = useAuth();
  const { status } = useBridgeStatus();
  const { appVersion, update, checkForUpdates } = useUpdateStatus();
  const [view, setView] = useState<AppView>({ kind: "home" });

  async function openSite() {
    const apiUrl = await window.ranked.getApiUrl();
    await window.ranked.openExternal(apiUrl);
  }

  if (auth.loading) {
    return (
      <div className="app-shell app-shell-main">
        <TitleBar />
        <div className="app-loading">Loading…</div>
      </div>
    );
  }

  if (!auth.isSignedIn || !auth.profile) {
    return (
      <div className="app-shell app-shell-main">
        <TitleBar />
        <LoginView
          loading={auth.loading}
          error={auth.error}
          onLogin={auth.login}
        />
      </div>
    );
  }

  const profile = auth.profile;

  return (
    <div className="app-shell app-shell-main">
      <TitleBar />
      <div className="app-layout">
        <AppNav
          view={view}
          profile={profile}
          onNavigate={setView}
          onOpenSite={() => void openSite()}
        />
        <main className="app-main">
          <UpdateBanner appVersion={appVersion} update={update} />
          <PlayerSearch onNavigate={setView} />
          <div className="app-main-scroll">
            {view.kind === "home" && (
              <HomeView profile={profile} status={status} onNavigate={setView} />
            )}
            {view.kind === "leaderboard" && (
              <LeaderboardView viewerUsername={profile.username} onNavigate={setView} />
            )}
            {view.kind === "profile" && (
              <ProfileView
                profile={profile}
                onNavigate={setView}
              />
            )}
            {view.kind === "tracking" && (
              <div className="page-stack">
                <header className="page-header">
                  <h1 className="page-title">Match tracking</h1>
                  <p className="page-subtitle">
                    GSI + JSI setup for automatic rated match reporting.
                  </p>
                </header>
                <MatchTrackingPanel status={status} />
              </div>
            )}
            {view.kind === "settings" && (
              <SettingsView
                profile={profile}
                status={status}
                appVersion={appVersion}
                update={update}
                onCheckForUpdates={checkForUpdates}
                onLogout={() => void auth.logout()}
                onOpenSite={() => void openSite()}
                onNavigate={setView}
              />
            )}
            {view.kind === "player" && (
              <PlayerView username={view.username} onNavigate={setView} />
            )}
            {view.kind === "match" && <MatchView matchId={view.id} onNavigate={setView} />}
          </div>
        </main>
      </div>
    </div>
  );
}
