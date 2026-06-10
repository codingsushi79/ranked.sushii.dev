"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingButton } from "@/components/motion/loading-button";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function VerifyEmailPrompt({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");
      toast.success("Verification code sent — check your inbox");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both border-sky-500/25 bg-sky-500/5">
      <Mail className="text-sky-600/90 dark:text-sky-400/90" />
      <AlertTitle>Verify your email to play</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>
          You can browse the site without verifying. To download the client and
          report matches, confirm <strong>{email}</strong> first.
        </span>
        <div className="flex flex-wrap gap-2">
          <LoadingButton
            size="sm"
            onClick={sendCode}
            loading={loading}
            loadingLabel="Sending…"
          >
            Send verification code
          </LoadingButton>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/verify?email=${encodeURIComponent(email)}`}>
              Enter code
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
