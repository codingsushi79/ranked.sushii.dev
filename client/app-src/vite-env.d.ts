/// <reference types="vite/client" />

import type { RankedApi } from "../electron/preload";

declare global {
  interface Window {
    ranked: RankedApi;
  }
}

export {};
