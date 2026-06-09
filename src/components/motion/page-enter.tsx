import { cn } from "@/lib/utils";

export function PageEnter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
        className
      )}
    >
      {children}
    </div>
  );
}
