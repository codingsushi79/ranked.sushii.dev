import { ImageResponse } from "next/og";
import { faviconMarkup } from "@/lib/favicon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(faviconMarkup(112), { ...size });
}
