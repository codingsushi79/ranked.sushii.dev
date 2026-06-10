"use client";

import { Button } from "@/components/ui/button";

export function ProfileActions({
  canPlay,
  hasSteam,
}: {
  canPlay: boolean;
  hasSteam: boolean;
}) {
  if (!canPlay) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2 sm:pt-1">
      {!hasSteam ? (
        <Button asChild>
          <a href="/api/steam/link">Link Steam</a>
        </Button>
      ) : (
        <Button variant="outline" asChild>
          <a href="/api/steam/link">Re-link Steam</a>
        </Button>
      )}
    </div>
  );
}
