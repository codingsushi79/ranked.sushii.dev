import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/session";
import { SteamSignInButton } from "@/components/steam-sign-in-button";

export default async function SignupLinkSteamPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");

  if (user.steamId) {
    const params = await searchParams;
    const next = params.next?.startsWith("/") ? params.next : "/profile";
    redirect(next);
  }

  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/profile";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <Card className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
        <CardHeader>
          <CardTitle>Link Steam</CardTitle>
          <CardDescription>
            Connect the Steam account you&apos;ll play on. This is permanent —
            you cannot link a different Steam account later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              Signed in as <strong>{user.username}</strong>. After linking, you
              can log in with email or Steam.
            </AlertDescription>
          </Alert>
          <SteamSignInButton
            link
            next={nextPath}
            label="Link Steam account"
          />
          <Link
            href="/profile"
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Skip for now
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
