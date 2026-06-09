const STEAM_OPENID = "https://steamcommunity.com/openid/login";

export function getSteamLoginUrl(returnUrl: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": new URL(returnUrl).origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID}?${params.toString()}`;
}

export function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(
    /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/
  );
  return match?.[1] ?? null;
}

export async function verifySteamOpenId(
  params: URLSearchParams
): Promise<string | null> {
  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });
  const text = await res.text();
  if (!text.includes("is_valid:true")) return null;

  const claimedId = params.get("openid.claimed_id");
  if (!claimedId) return null;
  return extractSteamId(claimedId);
}

export async function fetchSteamProfile(steamId: string) {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    return {
      steamName: `Player ${steamId.slice(-4)}`,
      steamAvatar: null as string | null,
    };
  }

  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`;
  const res = await fetch(url);
  const data = await res.json();
  const player = data?.response?.players?.[0];
  return {
    steamName: player?.personaname ?? `Player ${steamId.slice(-4)}`,
    steamAvatar: player?.avatarfull ?? null,
  };
}
