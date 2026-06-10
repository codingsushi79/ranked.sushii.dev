import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const SECTIONS = [
  {
    title: "1. Acceptance",
    body: 'By creating an account or using ranked.sushii.dev ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.',
  },
  {
    title: "2. Accounts",
    body: "You create an account with a username, email, and password, then link one Steam account during signup. That Steam link is permanent and cannot be changed. You may sign in with email and password or Steam. One person per account — shared, smurf, or fully automated accounts used to manipulate ranked stats are not allowed.",
  },
  {
    title: "3. Fair play",
    body: "Rated matches require honest play. You may not use cheats, hacks, aimbots, wallhacks, or any third-party software that provides an unfair advantage in Counter-Strike 2. You may not stat-pad, win-trade, or collude to manipulate Elo. We track match data through the desktop client. Violations can result in Elo resets, restrictions, or account termination.",
  },
  {
    title: "4. Desktop client",
    body: "The Ranked CS2 client reports match statistics to your linked account. You may only use the client on accounts you own and have linked through the Service. Tampering with match reports, sharing your Client ID, or submitting falsified data is prohibited. Windows installers are built from our open-source repository on GitHub.",
  },
  {
    title: "5. Community conduct",
    body: "Treat other players respectfully. Harassment, hate speech, spam, and abuse of reporting or reputation systems are prohibited. We may restrict access at our discretion.",
  },
  {
    title: "6. Your content",
    body: "Profile information, match statistics, and other data you submit may be stored and displayed as part of the Service (for example, leaderboards, public profiles, season stats, and trust ratings). You grant us a license to use this data to operate and improve the platform.",
  },
  {
    title: "7. Service availability",
    body: 'The Service is provided "as is." We may change, suspend, or discontinue features at any time, including season resets, Elo formulas, and client requirements. We do not guarantee uninterrupted access or specific ranking outcomes.',
  },
  {
    title: "8. Termination",
    body: "You may stop using the Service at any time. We may suspend or terminate accounts that violate these terms or harm other users or the platform.",
  },
  {
    title: "9. Contact",
    body: `Questions about these terms: ${SUPPORT_EMAIL}. See also our Privacy Policy at /privacy.`,
  },
] as const;

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 animate-in fade-in duration-500 fill-mode-both">
      <header className="flex flex-col gap-2 animate-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
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
            {section.title === "9. Contact" ? (
              <p>
                Questions about these terms:{" "}
                <a href={SUPPORT_MAILTO} className="text-foreground underline-offset-4 hover:underline">
                  {SUPPORT_EMAIL}
                </a>
                . See also our{" "}
                <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            ) : (
              <p>{section.body}</p>
            )}
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/privacy"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "animate-in fade-in duration-500 fill-mode-both delay-500 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          Privacy Policy
        </Link>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "animate-in fade-in duration-500 fill-mode-both delay-500 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          Back to sign up
        </Link>
      </div>
    </article>
  );
}
