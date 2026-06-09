import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AdminBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-500/50 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400",
        className
      )}
    >
      Admin
    </Badge>
  );
}

export function UsernameDisplay({
  username,
  isAdmin,
  suffix,
  className,
}: {
  username: string;
  isAdmin?: boolean;
  suffix?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{username}</span>
      {isAdmin && <AdminBadge />}
      {suffix}
    </span>
  );
}
