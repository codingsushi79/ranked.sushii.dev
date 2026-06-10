import { buildDemoLinks } from "@/lib/demo";
import { cn } from "@/lib/utils";

export type MatchDemoFields = {
  demoShareCode?: string | null;
  demoUrl?: string | null;
  demo?: ReturnType<typeof buildDemoLinks>;
};

export function getMatchDemo(fields: MatchDemoFields) {
  return fields.demo ?? buildDemoLinks(fields.demoShareCode);
}

export function MatchDemoLink({
  demoShareCode,
  demoUrl,
  demo,
  className,
  compact = false,
}: MatchDemoFields & {
  className?: string;
  compact?: boolean;
}) {
  const links = getMatchDemo({ demoShareCode, demoUrl, demo });

  if (links) {
    return (
      <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
        <a
          href={links.steamUrl}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {compact ? "Demo" : "Watch in CS2"}
        </a>
        <a
          href={links.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Browser
        </a>
      </span>
    );
  }

  if (demoUrl) {
    return (
      <a
        href={demoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-sm font-medium text-primary underline-offset-4 hover:underline",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        Demo
      </a>
    );
  }

  return <span className={cn("text-sm text-muted-foreground", className)}>—</span>;
}
