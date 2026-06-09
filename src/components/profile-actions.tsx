"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import Link from "next/link";

export function ProfileActions({
  canPlay,
  hasSteam,
  clientId,
}: {
  canPlay: boolean;
  hasSteam: boolean;
  clientId: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyClientId() {
    try {
      await navigator.clipboard.writeText(clientId);
      setCopied(true);
      toast.success("Client ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the ID and copy manually");
    }
  }

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

      {hasSteam && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            Paste this Client ID into the desktop app to link your account.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={clientId}
              onFocus={(e) => e.target.select()}
              className="font-mono text-xs"
              aria-label="Client ID"
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              onClick={() => void copyClientId()}
            >
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
