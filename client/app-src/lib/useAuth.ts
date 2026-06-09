import { useCallback, useEffect, useState } from "react";
import type { ClientProfile } from "../lib/types";

type AuthState = {
  loading: boolean;
  profile: ClientProfile | null;
  error: string | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    profile: null,
    error: null,
  });

  const refresh = useCallback(async () => {
    const status = (await window.ranked.getStatus()) as { hasClientId?: boolean };
    if (!status.hasClientId) {
      setState({ loading: false, profile: null, error: null });
      return;
    }

    try {
      const profile = (await window.ranked.getProfile()) as ClientProfile;
      setState({ loading: false, profile, error: null });
    } catch (err) {
      setState({
        loading: false,
        profile: null,
        error: err instanceof Error ? err.message : "Could not load account",
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function login() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await window.ranked.login();
      await refresh();
    } catch (err) {
      setState({
        loading: false,
        profile: null,
        error: err instanceof Error ? err.message : "Sign-in failed",
      });
      throw err;
    }
  }

  async function logout() {
    await window.ranked.signOut();
    setState({ loading: false, profile: null, error: null });
  }

  return {
    ...state,
    isSignedIn: !!state.profile,
    refresh,
    login,
    logout,
  };
}
