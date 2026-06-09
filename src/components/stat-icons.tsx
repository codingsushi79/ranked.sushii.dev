import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { Skull } from "lucide-react";
import { cn } from "@/lib/utils";

export function KillsIcon({ className }: { className?: string }) {
  return (
    <FontAwesomeIcon
      icon={faCrosshairs}
      className={cn("size-4 text-emerald-600", className)}
    />
  );
}

export function DeathsIcon({ className }: { className?: string }) {
  return <Skull className={cn("size-4 text-red-500", className)} />;
}
