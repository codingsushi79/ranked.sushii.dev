import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Ranked CS2</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <a href={SUPPORT_MAILTO} className="hover:text-foreground">
            Help: {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
