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

  const canPlay = user.emailVerified;

  const params = await searchParams;
  const steamMessage =
    params.steam === "linked"
      ? "Steam account linked successfully."
      : params.steam === "taken"
        ? "That Steam account is already linked to another user."
        : params.steam === "failed"
          ? "Steam linking failed. Please try again."
          : null;

  const verifyRequired = params.verify === "required" && !canPlay;

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
              Verify your email before linking Steam or playing ranked.
            </AlertDescription>
          </Alert>
        )}

        {!canPlay && <VerifyEmailPrompt email={user.email} />}

        <PlayerProfileContent
          profile={profile}
          showSeasonDates
          headerActions={
            <ProfileActions canPlay={canPlay} hasSteam={!!user.steamId} />
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
