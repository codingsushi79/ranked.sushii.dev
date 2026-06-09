import type { NextConfig } from "next";
import {
  CLIENT_DOWNLOAD_URL,
  CLIENT_MANIFEST_URL,
} from "./src/lib/client-download";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/downloads/ranked-cs2-client-setup.exe",
        destination: CLIENT_DOWNLOAD_URL,
        permanent: false,
      },
      {
        source: "/downloads/manifest.json",
        destination: CLIENT_MANIFEST_URL,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
