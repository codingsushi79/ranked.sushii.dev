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
import { PlayerProfileContent } from "@/components/player-profile-content";
import { TrendingUp } from "lucide-react";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getPlayerProfileData(user.id);
  if (!profile) redirect("/login");

  const params = await searchParams;
  const welcome = params.welcome === "1";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6">
        {welcome && (
          <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
            <AlertDescription>
              Welcome to Ranked CS2. Download the client to start tracking matches.
            </AlertDescription>
          </Alert>
        )}

        <PlayerProfileContent profile={profile} showSeasonDates />

        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp />
              Public profile
            </CardTitle>
            <CardDescription>
              Share your stats page with others.
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
