"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/motion/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SteamSignInButton } from "@/components/steam-sign-in-button";

const ERROR_MESSAGES: Record<string, string> = {
  steam_failed: "Steam sign-in failed. Please try again.",
  no_steam_account:
    "No account is linked to that Steam ID. Sign up with email first, then link Steam.",
  login_required: "Log in with email first, then link Steam.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const error = searchParams.get("error");
  const errorMessage = error ? ERROR_MESSAGES[error] : null;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      toast.success("Welcome back!");
      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/profile");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <Card className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>
            Sign in with email and password, or use Steam if you linked it during
            signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorMessage && (
            <Alert>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={onSubmit} autoComplete="off">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input
                  id="login-email"
                  name="login-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">Password</FieldLabel>
                <Input
                  id="login-password"
                  name="login-password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                  autoComplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
                />
              </Field>
              <LoadingButton
                type="submit"
                loading={loading}
                loadingLabel="Signing in…"
                className="w-full"
              >
                Log in
              </LoadingButton>
            </FieldGroup>
          </form>

          <div className="relative text-center text-xs text-muted-foreground">
            <span className="bg-card relative z-10 px-2">or</span>
            <div className="absolute inset-x-0 top-1/2 border-t" />
          </div>

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
