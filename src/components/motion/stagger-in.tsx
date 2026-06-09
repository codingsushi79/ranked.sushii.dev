import { cn } from "@/lib/utils";

export function fadeInUp(className?: string, delayMs?: number) {
  return {
    className: cn(
      "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both",
      className
    ),
    style: delayMs != null ? { animationDelay: `${delayMs}ms` } : undefined,
  };
}

export function staggerIn(index: number, baseDelay = 0, step = 60) {
  return {
    className:
      "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both",
    style: { animationDelay: `${baseDelay + index * step}ms` },
  };
}
