import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const SECTIONS = [
  {
    title: "1. Overview",
    body: 'This Privacy Policy explains how ranked.sushii.dev ("Ranked CS2", "we", "the Service") collects, uses, and shares information when you use the website or the Windows desktop client.',
  },
  {
    title: "2. Information we collect",
    body: "Account information: username, email address, password (stored as a hash), and Steam ID, display name, and avatar from Steam OpenID. Gameplay data: Elo rating, wins and losses, placement progress, aggregated stats (kills, deaths, assists, headshots, MVPs, damage), and per-match records including map, mode, scores, and player statistics. Match reports may include Steam IDs and stats for other players in the same lobby when provided by the game client. Technical data: session cookies for login, and standard server logs from our hosting provider (for example request time, IP address, and browser type).",
  },
  {
    title: "3. How we use information",
    body: "We use your information to create and secure your account, verify your email, authenticate you through Steam, calculate and display ranked ratings, show leaderboards and public player profiles, operate seasons and match history, enforce our Terms of Service, and respond to support or abuse reports.",
  },
  {
    title: "4. Desktop client",
    body: "The Ranked CS2 Windows client stores your Client ID locally on your PC. It reads Counter-Strike 2 match data on your computer through Game State Integration. It sends data to ranked.sushii.dev only when you save a Client ID, verify your linked account, or finish a Competitive or Premier match that is submitted for rating. The client checks ranked.sushii.dev for software updates. It does not sell data or run third-party advertising analytics.",
  },
  {
    title: "5. Third-party services",
    body: "We use Resend to send verification emails (your email address and one-time codes). Steam OpenID and the Steam Web API are used when you choose to link your Steam account. The website is hosted on Vercel, which may process technical connection data as part of hosting. We do not use separate analytics or advertising trackers in the application code.",
  },
  {
    title: "6. Public information",
    body: "Your username, ranked stats, match history shown on your profile, and leaderboard placement may be visible to other users of the Service, consistent with how the product works.",
  },
  {
    title: "7. Retention and deletion",
    body: `We keep account and gameplay data while your account is active and as needed to operate seasons, leaderboards, and match records. Email verification codes expire shortly after use. You may stop using the Service at any time; email ${SUPPORT_EMAIL} if you want account deletion handled manually.`,
  },
  {
    title: "8. Security",
    body: "We use industry-standard measures such as hashed passwords, authenticated sessions, and HTTPS. No method of transmission or storage is completely secure.",
  },
  {
    title: "9. Children",
    body: "The Service is not directed at children under 13. We do not knowingly collect personal information from children under 13.",
  },
  {
    title: "10. Changes",
    body: "We may update this policy from time to time. The \"Last updated\" date at the top will change when we do. Continued use of the Service after changes means you accept the updated policy.",
  },
  {
    title: "11. Contact",
    body: `Privacy questions: ${SUPPORT_EMAIL}.`,
  },
] as const;

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 animate-in fade-in duration-500 fill-mode-both">
      <header className="flex flex-col gap-2 animate-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated June 9, 2026</p>
      </header>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
        {SECTIONS.map((section, i) => (
          <section
            key={section.title}
            className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
            style={{ animationDelay: `${100 + i * 50}ms` }}
          >
            <h2 className="text-base font-semibold text-foreground">
              {section.title}
            </h2>
            {section.title === "11. Contact" ? (
              <p>
                Privacy questions:{" "}
                <a href={SUPPORT_MAILTO} className="text-foreground underline-offset-4 hover:underline">
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            ) : section.title === "7. Retention and deletion" ? (
              <p>
                We keep account and gameplay data while your account is active and as needed to
                operate seasons, leaderboards, and match records. Email verification codes expire
                shortly after use. You may stop using the Service at any time; email{" "}
                <a href={SUPPORT_MAILTO} className="text-foreground underline-offset-4 hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                if you want account deletion handled manually.
              </p>
            ) : (
              <p>{section.body}</p>
            )}
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/terms"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "animate-in fade-in duration-500 fill-mode-both delay-500"
          )}
        >
          Terms of Service
        </Link>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "animate-in fade-in duration-500 fill-mode-both delay-500"
          )}
        >
          Sign up
        </Link>
      </div>
    </article>
  );
}
