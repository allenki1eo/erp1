"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowUpFromLine } from "lucide-react";
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
import { emptyBarrel } from "@/server/actions/production";

export function EmptyBarrelDialog({
  agingBatchId, barrelCode, fillVolume, fillAbv,
}: {
  agingBatchId: string;
  barrelCode: string;
  fillVolume: number;
  fillAbv: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(emptyBarrel, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Barrel emptied");
      setOpen(false);
    }
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><ArrowUpFromLine className="size-4" /> Empty</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Empty barrel {barrelCode}</DialogTitle>
          <DialogDescription>
            Filled with {fillVolume}L at {fillAbv}% ABV. Record what came out — angel&apos;s share auto-calculates.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <input type="hidden" name="agingBatchId" value={agingBatchId} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="emptiedVolume">Emptied volume (L) *</Label>
              <Input id="emptiedVolume" name="emptiedVolume" type="number" step="0.1" min="0.1"
                max={fillVolume} required />
              <FormError state={state} field="emptiedVolume" />
            </div>
            <div>
              <Label htmlFor="emptiedAbv">Emptied ABV % *</Label>
              <Input id="emptiedAbv" name="emptiedAbv" type="number" step="0.01" min="0" max="100" required />
              <FormError state={state} field="emptiedAbv" />
            </div>
          </div>

          <div>
            <Label htmlFor="emptiedAt">Emptied on *</Label>
            <Input id="emptiedAt" name="emptiedAt" type="date" defaultValue={today} required />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Empty barrel</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
