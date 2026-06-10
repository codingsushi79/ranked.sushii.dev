"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {!hasSteam ? (
          <Button asChild>
            <Link href="/api/steam/link">Link Steam</Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href="/api/steam/link">Re-link Steam</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
