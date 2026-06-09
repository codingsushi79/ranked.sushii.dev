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
import { VerifyEmailPrompt } from "@/components/verify-email-prompt";
import { Download, AlertCircle } from "lucide-react";

export default async function DownloadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/download");

  const canPlay = user.emailVerified;
  const canDownload = canPlay && !!user.steamId;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 motion-safe:scroll-smooth">
      <div className="mb-6 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-3xl font-bold tracking-tight">Download client</h1>
        <p className="text-muted-foreground">
          The Windows client runs a local JSI bridge in CS2 and reports match
          stats to your ranked account.
        </p>
      </div>

      {!canPlay && (
        <div className="mb-6">
          <VerifyEmailPrompt email={user.email} />
        </div>
      )}

      {canPlay && !user.steamId && (
        <Alert className="mb-6">
          <AlertCircle />
          <AlertTitle>Link Steam first</AlertTitle>
          <AlertDescription>
            Connect your Steam account on your profile before downloading.
          </AlertDescription>
        </Alert>
      )}

      <Card className="animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both delay-150">
        <CardHeader>
          <CardTitle>Ranked CS2 Client (Windows)</CardTitle>
          <CardDescription>
            v2.0.0 · Competitive and Premier only · JSI script auto-installs on
            launch · all-in-one desktop app (no browser window)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Link Steam on your profile.</li>
            <li>Copy your Client ID from your profile.</li>
            <li>Download and run the client — paste your Client ID and save.</li>
            <li>Launch CS2 — match tracking starts automatically when you play.</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Your Client ID is your account UUID — it never changes. Reopen the
            app from the Start menu if you close it.
          </p>

          {canDownload ? (
            <DownloadButton
              href="/downloads/ranked-cs2-client-setup.exe"
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
              Signed releases list <strong>SignPath Foundation</strong> as publisher — see our{" "}
              <Link href="/code-signing" className="underline underline-offset-4">
                code signing policy
              </Link>
              .
            </AlertDescription>
          </Alert>

          <Button variant="outline" asChild>
            <Link href="/profile">Go to profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
