import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/motion/download-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/session";
import {
  CLIENT_DOWNLOAD_URL,
  CLIENT_MANIFEST_URL,
  CLIENT_RELEASE_TAG,
  GITHUB_REPO,
} from "@/lib/client-download";
import { VerifyEmailPrompt } from "@/components/verify-email-prompt";
import { Download, AlertCircle } from "lucide-react";
import fs from "fs";
import path from "path";

async function getClientVersion() {
  try {
    const res = await fetch(CLIENT_MANIFEST_URL, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = (await res.json()) as { version?: string };
      if (data.version) return data.version;
    }
  } catch {
    // Fall back to repo package.json (local dev / full deploy).
  }

  try {
    const pkgPath = path.join(process.cwd(), "client/package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "latest";
  } catch {
    return "latest";
  }
}

export default async function DownloadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/download");

  const canPlay = user.emailVerified;
  const canDownload = canPlay && !!user.steamId;
  const clientVersion = await getClientVersion();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 motion-safe:scroll-smooth">
      <div className="mb-6 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-3xl font-bold tracking-tight">Download client</h1>
        <p className="text-muted-foreground">
          The Windows client runs a local JSI bridge in CS2 and reports match
          stats to your ranked account.
        </p>
      </div>

      {!canPlay && user.email && (
        <div className="mb-6">
          <VerifyEmailPrompt email={user.email} />
        </div>
      )}

      {canPlay && !user.steamId && (
        <Alert className="mb-6">
          <AlertCircle />
          <AlertTitle>Link Steam first</AlertTitle>
          <AlertDescription>
            Finish signup by linking Steam on your{" "}
            <Link href="/signup/link-steam" className="underline underline-offset-4">
              account setup page
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <Card className="animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both delay-150">
        <CardHeader>
          <CardTitle>Ranked CS2 Client (Windows)</CardTitle>
          <CardDescription>
            v{clientVersion} · Windows installer · Competitive and Premier
            only · Sets up CS2 integration during install
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Link Steam during signup (one time only).</li>
            <li>Download and run the installer — follow the setup wizard.</li>
            <li>Open Ranked CS2 and click <strong>Log in with browser</strong>.</li>
            <li>Launch CS2 — rated matches report automatically.</li>
          </ol>

          {canDownload ? (
            <DownloadButton
              href={CLIENT_DOWNLOAD_URL}
              className="animate-download-glow w-full sm:w-auto"
            />
          ) : (
            <Button size="lg" disabled>
              <Download data-icon="inline-start" />
              Complete setup to download
            </Button>
          )}

          <Alert>
            <AlertCircle />
            <AlertTitle>Windows security prompt</AlertTitle>
            <AlertDescription>
              Windows may show &quot;Windows protected your PC&quot; for unsigned
              builds. Click <strong>More info</strong> → <strong>Run anyway</strong>.
              Installers are built from our{" "}
              <a
                href="https://github.com/codingsushi79/ranked.sushii.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                open-source repository
              </a>
              .
            </AlertDescription>
          </Alert>

          <p className="text-xs text-muted-foreground">
            Installer hosted on{" "}
            <a
              href={`https://github.com/${GITHUB_REPO}/releases/tag/${CLIENT_RELEASE_TAG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              GitHub Releases
            </a>
            .
          </p>

          <Button variant="outline" asChild>
            <Link href="/profile">Go to profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
