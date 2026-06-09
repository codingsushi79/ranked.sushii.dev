import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code signing policy",
  description:
    "How Ranked CS2 Windows client binaries are built, signed, and released.",
};

export default function CodeSigningPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Code signing policy</h1>
        <p className="text-sm text-muted-foreground">
          Ranked CS2 Windows desktop client
        </p>
      </header>

      <div className="prose prose-invert mt-8 max-w-none text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_strong]:text-foreground">
        <p>
          Free code signing provided by{" "}
          <a href="https://signpath.io/" target="_blank" rel="noopener noreferrer">
            SignPath.io
          </a>
          , certificate by{" "}
          <a
            href="https://signpath.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            SignPath Foundation
          </a>
          .
        </p>

        <h2 className="text-base font-semibold text-foreground">What we sign</h2>
        <p>
          We sign only <strong>ranked-cs2-client-setup.exe</strong>, built from
          the open-source <code>client/</code> directory in our GitHub repository
          using GitHub Actions on Microsoft-hosted Windows runners. Local builds
          are not published to ranked.sushii.dev.
        </p>

        <h2 className="text-base font-semibold text-foreground">Team roles</h2>
        <ul className="list-disc pl-5">
          <li>
            <strong>Authors:</strong> repository maintainers with merge access
            (update GitHub team link in{" "}
            <code>docs/CODE_SIGNING.md</code> before SignPath approval)
          </li>
          <li>
            <strong>Reviewers:</strong> pull requests require review before merge
          </li>
          <li>
            <strong>Approvers:</strong> designated maintainer approves each
            SignPath signing request before release
          </li>
        </ul>

        <h2 className="text-base font-semibold text-foreground">Privacy</h2>
        <p>
          The client runs locally and reads CS2 match data via Game State
          Integration. It connects to ranked.sushii.dev when you save a Client
          ID or report a Competitive or Premier match. It does not send data to
          other networked systems unless you configure a custom API URL in a
          development build.
        </p>
        <p>
          See our <Link href="/terms">Terms of Service</Link> for hosted-service
          data practices. Third-party libraries are listed in{" "}
          <code>client/package-lock.json</code> (Electron, React, etc.).
        </p>

        <h2 className="text-base font-semibold text-foreground">Windows SmartScreen</h2>
        <p>
          Until a release is signed through SignPath, Windows may show
          &quot;Windows protected your PC&quot;. Choose <strong>More info</strong>{" "}
          → <strong>Run anyway</strong>. Signed releases show{" "}
          <strong>SignPath Foundation</strong> as the publisher.
        </p>

        <h2 className="text-base font-semibold text-foreground">Source</h2>
        <p>
          Full policy and release workflow:{" "}
          <a
            href="https://github.com/YOUR_ORG/ranked.sushii.dev/blob/main/docs/CODE_SIGNING.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs/CODE_SIGNING.md
          </a>{" "}
          (replace GitHub URL with your public repository).
        </p>
      </div>

      <p className="mt-8">
        <Link href="/download" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Back to download
        </Link>
      </p>
    </article>
  );
}
