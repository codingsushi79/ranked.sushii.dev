import type { WindowRole } from "../types";

export function getWindowRole(): WindowRole {
  const role = new URLSearchParams(window.location.search).get("window");
  if (role === "stats" || role === "poll") {
    return role;
  }
  return "main";
}

export function isOverlayWindow() {
  return getWindowRole() !== "main";
}
