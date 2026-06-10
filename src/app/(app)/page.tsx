import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/session";
import { Crosshair, Download, BarChart3, Trophy, Zap } from "lucide-react";
import { SeasonCountdown } from "@/components/season-countdown";
import { ensureCurrentSeason } from "@/lib/player";
import { getSeasonTimeline } from "@/lib/seasons";

export default async function HomePage() {
  const user = await getCurrentUser();
  const season = await ensureCurrentSeason();
  const timeline = getSeasonTimeline(season);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <SeasonCountdown className="mb-8" />
      {timeline.isLocked && (
        <p className="mb-8 text-sm text-amber-600 dark:text-amber-400">
          Season {season.number} rankings are locked. Top 10 players are preparing
          for the season finale 5v5 on xplay.gg.
        </p>
      )}
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both">
        <Badge variant="secondary" className="w-fit">
          Rated competitive CS2
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Play CS2. Climb the leaderboard. Track every stat.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Matchmaking stats via the desktop client, Elo per season, level-based
          leaderboards, and a full profile linked to your Steam account.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {user ? (
            <>
              <Button asChild size="lg">
                <Link href="/download">Download client</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/leaderboard">Leaderboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/signup">Get started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/leaderboard">Leaderboard</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-20 grid gap-6 md:grid-cols-3">
        {[
          { icon: Crosshair, title: "Play ranked", desc: "Competitive matches tracked automatically through the CS2 JSI client. Win or lose Elo based on team strength and your performance." },
          { icon: Trophy, title: "Level leaderboards", desc: "Five skill levels from 0 to 3700+ Elo. Compete on the board for your level — not just the global top 10." },
          { icon: BarChart3, title: "Full match stats", desc: "K/D, ADR, headshots, MVPs, and Elo changes for every rated game — with scoreboards and demo links." },
        ].map((item, i) => (
        <Card
          key={item.title}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: `${150 + i * 80}ms` }}
        >
          <CardHeader>
            <item.icon className="mb-2 size-5" />
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.desc}</CardDescription>
          </CardHeader>
        </Card>
        ))}
      </div>

      <Card className="mt-12 animate-in fade-in duration-700 fill-mode-both delay-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="size-5" />
            <CardTitle>How it works</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-4">
          {[
            { step: "1", title: "Sign up", desc: "Create an account with email and password, then link Steam once." },
            { step: "2", title: "Verify & download", desc: "Verify your email, download the Windows client, and sign in." },
            { step: "3", title: "Connect", desc: "Open the client and log in with browser, email, or Steam." },
            { step: "4", title: "Play", desc: "Launch CS2 — stats and Elo update automatically." },
          ].map((item, i) => (
            <div
              key={item.step}
              className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              style={{ animationDelay: `${400 + i * 60}ms` }}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {item.step}
              </span>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-12 flex animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both delay-500 items-center justify-between rounded-xl border bg-muted/40 p-6">
        <div>
          <p className="font-medium">Ready to queue?</p>
          <p className="text-sm text-muted-foreground">
            Download the client after linking Steam and verifying email.
          </p>
        </div>
        <Button asChild className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Link href={user ? "/download" : "/signup"}>
            <Download data-icon="inline-start" />
            {user ? "Download" : "Sign up"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
