import Link from "next/link";
import { cn } from "@/lib/utils";

function steamSignInHref(next: string | null, terms: boolean) {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (terms) params.set("terms", "1");
  const query = params.toString();
  return query ? `/api/steam/signin?${query}` : "/api/steam/signin";
}

export function SteamSignInButton({
  next,
  terms = false,
  disabled = false,
  className,
  label = "Sign in with Steam",
}: {
  next?: string | null;
  terms?: boolean;
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
      href={steamSignInHref(safeNext, terms)}
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
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v1h3l-.5 3H13v6.95c5.05-.5 9-4.76 9-9.95 0-5.52-4.48-10-10-10z" />
    </svg>
  );
}
