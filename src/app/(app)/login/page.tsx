"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SteamSignInButton } from "@/components/steam-sign-in-button";

const ERROR_MESSAGES: Record<string, string> = {
  steam_failed: "Steam sign-in failed. Please try again.",
  terms: "Accept the Terms of Service on the sign-up page first.",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const error = searchParams.get("error");
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <Card className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>
            Sign in with your Steam account. Your ranked profile is tied to Steam
            and cannot be changed later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorMessage && (
            <Alert>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <SteamSignInButton next={nextPath} />
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href={
                nextPath
                  ? `/signup?next=${encodeURIComponent(nextPath)}`
                  : "/signup"
              }
              className="text-foreground underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
