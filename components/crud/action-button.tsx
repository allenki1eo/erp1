"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions";

type Variant = "default" | "outline" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "default" | "lg";

export function ActionButton({
  action,
  children,
  variant = "default",
  size = "default",
  successMessage = "Done",
  confirmMessage,
  className,
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  successMessage?: string;
  confirmMessage?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      disabled={pending}
      className={className}
      onClick={() => {
        if (confirmMessage && !confirm(confirmMessage)) return;
        start(async () => {
          const res = await action();
          if (res.ok) toast.success(successMessage);
          else toast.error(res.error);
        });
      }}
    >
      {children}
    </Button>
  );
}
