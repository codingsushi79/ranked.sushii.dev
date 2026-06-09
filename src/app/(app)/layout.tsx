import { PageEnter } from "@/components/motion/page-enter";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/session";
import { getFinaleContext } from "@/lib/finale";
import { getSessionUserId } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const userId = user?.id ?? (await getSessionUserId());
  const finaleCtx = userId ? await getFinaleContext(userId) : null;
  const showServerTab =
    !!finaleCtx?.timeline.isLocked && !!finaleCtx?.access.canView;

  return (
    <>
      <SiteHeader user={user} showServerTab={showServerTab} />
      <main className="flex-1">
        <PageEnter>{children}</PageEnter>
      </main>
      <Toaster richColors />
    </>
  );
}
