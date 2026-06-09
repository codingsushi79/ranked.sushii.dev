"use client";

import { Loader2 } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type LoadingButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    loadingLabel?: string;
  };

export function LoadingButton({
  loading,
  loadingLabel,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(loading && "relative", className)}
      {...props}
    >
      {loading && (
        <Loader2
          className="animate-spin"
          data-icon="inline-start"
          aria-hidden
        />
      )}
      <span className={cn(loading && "animate-pulse")}>
        {loading && loadingLabel ? loadingLabel : children}
      </span>
    </Button>
  );
}
