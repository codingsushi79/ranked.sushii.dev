import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

function safePort(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const port = Number(value);
  if (port < 1024 || port > 65535) return null;
  return port;
}

export default async function ClientConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; port?: string }>;
}) {
  const params = await searchParams;
  const state = params.state?.trim();
  const port = safePort(params.port?.trim());

  if (!state || !port) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Invalid connection request</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open Ranked CS2 on your PC and try signing in again.
        </p>
      </div>
    );
  }

  const returnTo = `/client/connect?state=${encodeURIComponent(state)}&port=${port}`;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  redirect(
    `http://127.0.0.1:${port}/callback?state=${encodeURIComponent(state)}&clientId=${encodeURIComponent(user.id)}`
  );
}
