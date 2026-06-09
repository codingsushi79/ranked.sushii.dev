"use client";

import { useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isExternalDownloadUrl } from "@/lib/client-download";

type Phase = "idle" | "preparing" | "done";

export function DownloadButton({
  href,
  filename = "ranked-cs2-client-setup.exe",
  size = "lg",
  className,
}: {
  href: string;
  filename?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");

  function startDownload() {
    if (phase !== "idle") return;
    setPhase("preparing");

    window.setTimeout(() => {
      if (isExternalDownloadUrl(href)) {
        window.open(href, "_blank", "noopener,noreferrer");
      } else {
        const link = document.createElement("a");
        link.href = href;
        link.download = filename;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setPhase("done");
      window.setTimeout(() => setPhase("idle"), 2000);
    }, 500);
  }

  const label =
    phase === "preparing"
      ? "Preparing download…"
      : phase === "done"
        ? "Download started"
        : "Download for Windows";

  const Icon =
    phase === "preparing" ? Loader2 : phase === "done" ? Check : Download;

  return (
    <Button
      type="button"
      size={size}
      onClick={startDownload}
      disabled={phase === "preparing"}
      className={cn(
        phase === "preparing" && "animate-pulse",
        phase === "done" && "bg-emerald-600 text-white hover:bg-emerald-600/90",
        className
      )}
    >
      <Icon
        data-icon="inline-start"
        className={cn(phase === "preparing" && "animate-spin")}
      />
      {label}
    </Button>
  );
}
