/** GitHub release used for the Windows client installer (CI publishes on every push to main). */
export const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "codingsushi79/ranked.sushii.dev";

export const CLIENT_RELEASE_TAG =
  process.env.NEXT_PUBLIC_CLIENT_RELEASE_TAG ?? "client-latest";

export const CLIENT_INSTALLER_FILENAME = "ranked-cs2-client-setup.exe";

const RELEASE_DOWNLOAD_BASE = `https://github.com/${GITHUB_REPO}/releases/download/${CLIENT_RELEASE_TAG}`;

export const CLIENT_DOWNLOAD_URL = `${RELEASE_DOWNLOAD_BASE}/${CLIENT_INSTALLER_FILENAME}`;

export const CLIENT_MANIFEST_URL = `${RELEASE_DOWNLOAD_BASE}/manifest.json`;

/** Base URL baked into the desktop client for update checks (manifest + installer). */
export const CLIENT_UPDATE_BASE_URL = RELEASE_DOWNLOAD_BASE;

export function isExternalDownloadUrl(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}
