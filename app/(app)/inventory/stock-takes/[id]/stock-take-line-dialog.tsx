"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { updateStockTakeLine } from "@/server/actions/inventory";

type Line = {
  id: string;
  countedQty: number | null;
  systemQty: number;
};

export function StockTakeLineDialog({
  line,
  productName,
}: {
  line: Line;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateStockTakeLine, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Count updated");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Enter count</DialogTitle>
          <DialogDescription className="truncate">{productName}</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={line.id} />
          <div>
            <Label className="text-xs text-muted-foreground">System qty</Label>
            <p className="text-sm font-medium">{line.systemQty}</p>
          </div>
          <div>
            <Label htmlFor="countedQty">Counted qty *</Label>
            <Input
              id="countedQty"
              name="countedQty"
              type="number"
              step="0.001"
              min="0"
              defaultValue={line.countedQty ?? line.systemQty}
              required
              autoFocus
            />
            <FormError state={state} field="countedQty" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Save count</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
