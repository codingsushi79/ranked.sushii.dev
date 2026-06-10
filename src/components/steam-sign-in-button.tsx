import Link from "next/link";
import { cn } from "@/lib/utils";

function steamSignInHref(next: string | null, link: boolean) {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (link) params.set("link", "1");
  const query = params.toString();
  return query ? `/api/steam/signin?${query}` : "/api/steam/signin";
}

export function SteamSignInButton({
  next,
  link = false,
  disabled = false,
  className,
  label = "Sign in with Steam",
}: {
  next?: string | null;
  link?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  if (disabled) {
    return (
      <span
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#171a21] px-4 text-sm font-medium text-white opacity-50",
          className
        )}
        aria-disabled
      >
        <SteamIcon />
        {label}
      </span>
    );
  }

  return (
    <Link
      href={steamSignInHref(safeNext, link)}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#171a21] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2a475e]",
        className
      )}
    >
      <SteamIcon />
      {label}
    </Link>
  );
}

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a2.327 2.327 0 0 1 2.214-1.387c.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.311 14.89C1.995 20.521 6.576 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.351l-1.337-.552a2.327 2.327 0 0 0 2.557-2.464 2.327 2.327 0 0 0-2.327-2.327 2.327 2.327 0 0 0-2.327 2.327c0 .854.463 1.605 1.153 2.007l-.552 1.337a2.327 2.327 0 0 0 2.327 2.327 2.327 2.327 0 0 0 2.327-2.327 2.327 2.327 0 0 0-2.007-1.153z" />
    </svg>
  );
}
