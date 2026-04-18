"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions";

export function DeleteButton({
  id,
  action,
  confirmMessage = "Delete this item?",
  size = "sm",
}: {
  id: string;
  action: (id: string) => Promise<ActionResult>;
  confirmMessage?: string;
  size?: "sm" | "icon" | "default";
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size={size}
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        start(async () => {
          const res = await action(id);
          if (res.ok) toast.success("Deleted");
          else toast.error(res.error);
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
