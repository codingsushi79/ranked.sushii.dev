"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/motion/loading-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(params.get("email") ?? "");

  useEffect(() => {
    if (email) return;
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.email) setEmail(data.email);
      })
      .catch(() => {});
  }, [email]);

  async function resendCode() {
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");
      if (data.email) setEmail(data.email);
      toast.success("Verification code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Missing email — sign in or use the link from your profile");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      toast.success("Email verified — you're ready to play!");
      router.push("/profile");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to {email || "your email"}. Required to
          link Steam, download the client, and play ranked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            {!params.get("email") && !email && (
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="otp">Verification code</FieldLabel>
              <Input
                id="otp"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                className="text-center font-mono text-lg tracking-[0.3em]"
              />
            </Field>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingLabel="Verifying…"
              disabled={otp.length !== 6 || !email}
              className="w-full"
            >
              Verify email
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="outline"
              loading={sending}
              loadingLabel="Sending…"
              className="w-full"
              onClick={resendCode}
            >
              Resend code
            </LoadingButton>
            <Button type="button" variant="ghost" className="w-full" asChild>
              <Link href="/profile">Back to profile</Link>
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
