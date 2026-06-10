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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/session";
import { getPlayerProfileData } from "@/lib/player-profile";
import { ProfileActions } from "@/components/profile-actions";
import { VerifyEmailPrompt } from "@/components/verify-email-prompt";
import { PlayerProfileContent } from "@/components/player-profile-content";
import { TrendingUp } from "lucide-react";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ steam?: string; verify?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getPlayerProfileData(user.id);
  if (!profile) redirect("/login");

  const params = await searchParams;
  const steamMessage =
    params.steam === "linked"
      ? "Steam account linked successfully."
      : params.steam === "taken"
        ? "That Steam account is already linked to another user."
        : params.steam === "failed"
          ? "Steam linking failed. Please try again."
          : params.steam === "locked"
            ? "Your Steam account is already linked and cannot be changed."
            : null;

  const verifyRequired = params.verify === "required" && !user.emailVerified;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6">
        {steamMessage && (
          <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
            <AlertDescription>{steamMessage}</AlertDescription>
          </Alert>
        )}

        {verifyRequired && (
          <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
            <AlertDescription>
              Verify your email before playing ranked matches.
            </AlertDescription>
          </Alert>
        )}

        {!user.steamId && (
          <Alert>
            <AlertDescription>
              Link Steam to finish account setup. This is a one-time step and
              cannot be changed later.{" "}
              <Link href="/signup/link-steam" className="underline underline-offset-4">
                Link Steam now
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {!user.emailVerified && user.email && (
          <VerifyEmailPrompt email={user.email} />
        )}

        <PlayerProfileContent
          profile={profile}
          showSeasonDates
          headerActions={
            <ProfileActions hasSteam={!!user.steamId} clientId={user.id} />
          }
        />

        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp />
              Public profile
            </CardTitle>
            <CardDescription>
              Share your stats page with others once Steam is linked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/players/${user.username}`}>View public profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
