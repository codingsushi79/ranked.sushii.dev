/** Build CS2 demo download / playback links from a match share code. */
export function buildDemoLinks(shareCode: string | null | undefined) {
  if (!shareCode) return null;

  const encoded = encodeURIComponent(shareCode.trim());
  return {
    shareCode: shareCode.trim(),
    steamUrl: `steam://rungame/730/76561202255233023/+csgo_download_match%20${encoded}`,
    webUrl: `https://replay.esplay.se/?sharecode=${encoded}`,
  };
}

export function formatMapName(map: string): string {
  return map.replace(/^de_/i, "").replace(/_/g, " ");
}
