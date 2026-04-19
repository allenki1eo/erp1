"use client";

import { useActionState, useEffect, useState } from "react";
import { Lock, Unlock, XCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { changeBatchStatus } from "@/server/actions/quality";

type Batch = { id: string; label: string };
type Mode = "HOLD" | "QUARANTINE" | "RELEASE" | "REJECT";

const MODE_META: Record<Mode, { label: string; icon: typeof Lock; variant: "default" | "ghost" | "outline" | "destructive" }> = {
  HOLD: { label: "Place on hold", icon: Lock, variant: "default" },
  QUARANTINE: { label: "Quarantine", icon: ShieldAlert, variant: "outline" },
  RELEASE: { label: "Release", icon: Unlock, variant: "ghost" },
  REJECT: { label: "Reject", icon: XCircle, variant: "ghost" },
};

export function HoldDialog({ batches, mode, presetBatchId }: { batches: Batch[]; mode: Mode; presetBatchId?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(changeBatchStatus, null);
  const meta = MODE_META[mode];
  const Icon = meta.icon;

  useEffect(() => {
    if (state?.ok) {
      toast.success(`Batch ${mode.toLowerCase()}`);
      setOpen(false);
    }
  }, [state, mode]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={meta.variant} size="sm">
          <Icon className="size-4" /> {meta.label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{meta.label}</DialogTitle>
          <DialogDescription>
            {mode === "HOLD" && "Batch will be blocked from sale & production until released."}
            {mode === "QUARANTINE" && "Batch is physically segregated pending investigation."}
            {mode === "RELEASE" && "Batch returns to AVAILABLE stock."}
            {mode === "REJECT" && "Batch is rejected and marked as EXPIRED."}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="action" value={mode} />
          <div>
            <Label htmlFor="batchId">Batch *</Label>
            <Select name="batchId" defaultValue={presetBatchId ?? ""}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {batches.length === 0 ? (
                  <SelectItem value="__none" disabled>No batches</SelectItem>
                ) : batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="batchId" />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" rows={2} placeholder="ABV out of spec, microbial positive, etc." />
          </div>
          <div>
            <Label htmlFor="ncId">Linked NCR (optional)</Label>
            <input id="ncId" name="ncId" className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm" placeholder="NCR UUID" />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Confirm {meta.label.toLowerCase()}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
