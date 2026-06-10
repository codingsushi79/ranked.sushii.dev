"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SteamSignInButton } from "@/components/steam-sign-in-button";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const termsError = searchParams.get("error") === "terms";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <Card className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Sign in with Steam to create your Ranked CS2 account. Your Steam
            identity is permanent — you cannot link a different account later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {termsError && (
            <Alert>
              <AlertDescription>
                Accept the Terms of Service below before continuing with Steam.
              </AlertDescription>
            </Alert>
          )}
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border border-input accent-primary"
            />
            <span className="text-muted-foreground">
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          <SteamSignInButton
            next={nextPath}
            terms
            disabled={!acceptedTerms}
            label="Continue with Steam"
          />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={
                nextPath
                  ? `/login?next=${encodeURIComponent(nextPath)}`
                  : "/login"
              }
              className="text-foreground underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
