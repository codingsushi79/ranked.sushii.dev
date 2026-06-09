import { redirect, notFound } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getFinaleContext, serializeFinale } from "@/lib/finale";
import { FinaleServerView } from "@/components/finale-server-view";

export default async function ServerPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login?next=/server");

  const ctx = await getFinaleContext(userId);
  if (!ctx.timeline.isLocked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
        <h1 className="text-2xl font-bold">Season finale server</h1>
        <p className="mt-2 text-muted-foreground">
          The server tab opens during the last 3 days of the season for the top
          10 players.
        </p>
      </div>
    );
  }

  if (!ctx.access.canView) notFound();

  const finale = serializeFinale(ctx);
  if (!finale) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <FinaleServerView
        initialFinale={finale}
        initialAccess={ctx.access}
      />
    </div>
  );
}
