import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className="inline-flex" title="Verified email">
      <BadgeCheck
        className={cn(
          "size-5 shrink-0 text-sky-600/80 dark:text-sky-400/85",
          className
        )}
        aria-label="Verified email"
      />
    </span>
  );
}
